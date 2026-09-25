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
          "Create an original clothing design concept for The Sims 4 CC Forge. " +
          "Focus on the garment, not the person's identity. " +
          "Analyze the reference image when provided and follow the user's description. " +
          "Create a clean studio fashion product concept showing the clothing clearly. " +
          "Include construction details, silhouette, materials, colors and distinctive CC-friendly details. " +
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
          model: "gpt-5.5",
          input: [{ role: "user", content }],
          tools: [{
            type: "image_generation",
            model: "gpt-image-2.5-sunburst",
            action: image ? "edit" : "generate",
            background: "opaque",
            input_fidelity: "high",
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

      const imageCall = (data.output || []).find(
        item => item.type === "image_generation_call"
      );

      if (!imageCall?.result) {
        return json({ error: "AI не вернул изображение." }, 502, origin);
      }

      return json({
        image: "data:image/png;base64," + imageCall.result,
        source: image ? "Фото + описание" : "Описание"
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
