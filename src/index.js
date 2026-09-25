const ALLOWED_ORIGIN = "https://vilateriaserviali-creator.github.io";

function corsHeaders(origin) {
  const allowed = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(origin)
    }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, origin);
    }

    if (!env.OPENAI_API_KEY) {
      return json({ error: "OPENAI_API_KEY ещё не добавлен в Cloudflare Worker." }, 500, origin);
    }

    try {
      const { description = "", image = null } = await request.json();

      if (!String(description).trim() && !image) {
        return json({ error: "Добавьте фото или описание." }, 400, origin);
      }

      const content = [{
        type: "input_text",
        text:
          "Create an original Maxis Match clothing-only concept for The Sims 4 CC Forge. " +
          "The garment itself is the subject. Do NOT generate a person, face, body, mannequin, model, influencer, outfit photo, or lifestyle scene. " +
          "Show one complete garment clearly on a clean neutral studio background, centered and fully visible, like a clean Sims 4 CAS asset concept sheet. " +
          "Preserve the requested garment type and key visual details from the reference, while creating an original design. " +
          "Use simplified Maxis Match proportions, clean stylized shapes, readable seams and trims, controlled detail, game-friendly color blocking, and a polished Sims 4 CAS aesthetic. Prioritize silhouette, construction, seams, closures, pockets, trims, stylized fabric texture, colors and CC-friendly details. " +
          "If a reference photo contains a person wearing the garment, extract the garment design only and ignore the person. " +
          "Also return a structured garment specification in the requested JSON schema. Infer conservatively from the photo/description; do not invent details that are not visually supported. CAS should use Sims 4 concepts: body_type such as Top/Bottom/Body, gender Female/Male/Unisex, age such as Teen/Young Adult/Adult/Elder or Child/Toddler, categories such as Everyday/Formal/Athletic/Sleep/Party/Swimwear/Hot Weather/Cold Weather, and concise style tags. " +
          "User description: " +
          (String(description).trim() ||
            "Analyze the reference garment and create a refined original Sims 4 clothing concept.")
      }];

      if (image) {
        content.push({
          type: "input_image",
          image_url: image,
          detail: "high"
        });
      }

      const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + env.OPENAI_API_KEY
        },
        body: JSON.stringify({
          model: "gpt-5.1",
          input: [{ role: "user", content }],
          text: {
            format: {
              type: "json_schema",
              name: "garment_spec",
              description: "Structured Sims 4 clothing specification extracted from the reference and description.",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  garment_type: { type: "string" },
                  silhouette: { type: "string" },
                  details: { type: "array", items: { type: "string" } },
                  materials: { type: "array", items: { type: "string" } },
                  colors: { type: "array", items: { type: "string" } },
                  maxis_match_notes: { type: "array", items: { type: "string" } },
                  cas: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      body_type: { type: "string" },
                      gender: { type: "string" },
                      age: { type: "string" },
                      categories: { type: "array", items: { type: "string" } },
                      style_tags: { type: "array", items: { type: "string" } }
                    },
                    required: ["body_type", "gender", "age", "categories", "style_tags"]
                  }
                },
                required: ["garment_type", "silhouette", "details", "materials", "colors", "maxis_match_notes", "cas"]
              }
            }
          },
          tools: [{
            type: "image_generation",
            model: "gpt-image-2",
            action: image ? "edit" : "generate",
            background: "opaque",
            size: "1024x1024"
          }]
        })
      });

      const data = await openaiResponse.json();

      if (!openaiResponse.ok) {
        return json(
          { error: data?.error?.message || "Ошибка OpenAI API." },
          openaiResponse.status,
          origin
        );
      }

      const imageCall = (data.output || []).find(item => item.type === "image_generation_call");
      const textParts = (data.output || [])
        .filter(item => item.type === "message")
        .flatMap(item => item.content || [])
        .filter(part => part.type === "output_text")
        .map(part => part.text)
        .join("");
      let garmentSpec = null;
      try { garmentSpec = JSON.parse(textParts); } catch (_) { garmentSpec = null; }

      if (!imageCall?.result) {
        return json({ error: "AI не вернул изображение." }, 502, origin);
      }

      return json({
        image: "data:image/png;base64," + imageCall.result,
        source: image ? "Фото + описание" : "Описание",
        garmentSpec
      }, 200, origin);
    } catch (error) {
      console.error(error);
      return json(
        { error: "Не удалось выполнить генерацию. Проверь Worker и API-ключ." },
        500,
        origin
      );
    }
  }
};
