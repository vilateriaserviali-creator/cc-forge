"""Minimal DBPF 2.1 writer for Sims 4 resources.

This writer deliberately does not invent GEOM/CASP bytes. It accepts real resource
payloads and packs them into a DBPF package with the Sims 4-style index.

Resource key:
(type, group, instance) where instance is a 64-bit value.
"""

from __future__ import annotations

import struct
import zlib
from dataclasses import dataclass
from pathlib import Path


DBPF_MAGIC = b"DBPF"
DBPF_MAJOR = 2
DBPF_MINOR = 1
COMPRESSION_NONE = 0x0000
COMPRESSION_ZLIB = 0x5A42


@dataclass(frozen=True)
class Resource:
    type_id: int
    group_id: int
    instance_id: int
    data: bytes
    compress: bool = True


@dataclass(frozen=True)
class IndexEntry:
    type_id: int
    group_id: int
    instance_id: int
    offset: int
    compressed_size: int
    uncompressed_size: int
    compression: int


def _compress(data: bytes, enabled: bool) -> tuple[bytes, int]:
    if not enabled or len(data) < 64:
        return data, COMPRESSION_NONE
    packed = zlib.compress(data)
    if len(packed) >= len(data):
        return data, COMPRESSION_NONE
    return packed, COMPRESSION_ZLIB


def build_package(resources: list[Resource]) -> bytes:
    if not resources:
        raise ValueError("At least one resource is required.")

    prepared: list[tuple[Resource, bytes, int]] = []
    for resource in resources:
        if not 0 <= resource.type_id <= 0xFFFFFFFF:
            raise ValueError("type_id must fit uint32")
        if not 0 <= resource.group_id <= 0xFFFFFFFF:
            raise ValueError("group_id must fit uint32")
        if not 0 <= resource.instance_id <= 0xFFFFFFFFFFFFFFFF:
            raise ValueError("instance_id must fit uint64")
        packed, compression = _compress(resource.data, resource.compress)
        prepared.append((resource, packed, compression))

    # Standard DBPF header with the index placed after all resources.
    header = bytearray(96)
    header[0:4] = DBPF_MAGIC
    struct.pack_into("<II", header, 4, DBPF_MAJOR, DBPF_MINOR)
    struct.pack_into("<I", header, 32, len(prepared))
    struct.pack_into("<I", header, 36, 0)  # reserved
    # index_size at 40 and index_offset at 52 are filled below.
    struct.pack_into("<I", header, 48, 3)  # index version

    blob = bytearray(header)
    entries: list[IndexEntry] = []

    for resource, payload, compression in prepared:
        offset = len(blob)
        blob.extend(payload)
        entries.append(
            IndexEntry(
                resource.type_id,
                resource.group_id,
                resource.instance_id,
                offset,
                len(payload),
                len(resource.data),
                compression,
            )
        )

    # Index type 0x1F means type/group/instance extension are present.
    index = bytearray()
    index.extend(struct.pack("<I", 0x1F))
    index.extend(struct.pack("<I", len(entries)))

    for entry in entries:
        index.extend(
            struct.pack(
                "<IIIQIIHH",
                entry.type_id,
                entry.group_id,
                (entry.instance_id >> 32) & 0xFFFFFFFF,
                entry.instance_id & 0xFFFFFFFF,
                entry.offset,
                entry.compressed_size | 0x80000000,
                entry.uncompressed_size,
                entry.compression,
                1,
            )
        )

    index_offset = len(blob)
    blob.extend(index)

    struct.pack_into("<I", blob, 40, len(index))
    struct.pack_into("<I", blob, 52, index_offset)

    return bytes(blob)


def write_package(path: str | Path, resources: list[Resource]) -> None:
    Path(path).write_bytes(build_package(resources))


if __name__ == "__main__":
    # Tiny self-test package. This is NOT a playable clothing package.
    test = Resource(
        type_id=0x2F7D0004,  # PNG resource type
        group_id=0,
        instance_id=0xCCF0000000000001,
        data=b"CC_FORGE_TEST_RESOURCE",
        compress=False,
    )
    out = Path("cc-forge-dbpf-test.package")
    write_package(out, [test])
    print(out)
