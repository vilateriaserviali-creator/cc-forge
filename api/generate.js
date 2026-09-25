// Legacy Vercel endpoint kept for compatibility.
// CC Forge production AI requests now use the Cloudflare Worker in src/index.js.
// Do not place an API key in this file.
export default async function handler(req, res) {
  return res.status(410).json({
    error: "CC Forge AI API has moved to Cloudflare Workers."
  });
}
