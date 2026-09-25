export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { description = '', image = null } = req.body || {};
    if (!description.trim() && !image) return res.status(400).json({ error: 'Добавьте фото или описание.' });
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY не настроен на сервере.' });

    const content = [{
      type: 'input_text',
      text: 'Create an original fashion clothing concept for The Sims 4 CC Forge. Focus on the garment, not the person. Analyze the reference image when provided and follow the user description. Preserve useful garment construction details while creating an original design. Show the clothing clearly as a clean studio fashion product concept. User description: ' +
        (description.trim() || 'Analyze the reference garment and create a refined original Sims 4 clothing concept.')
    }];

    if (image) content.push({ type: 'input_image', image_url: image, detail: 'high' });

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: 'gpt-5.6-luna',
        input: [{ role: 'user', content }],
        tools: [{
          type: 'image_generation',
          action: image ? 'edit' : 'generate',
          background: 'opaque',
          input_fidelity: 'high',
          size: '1024x1024'
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || 'Ошибка AI.' });

    const imageCall = (data.output || []).find(item => item.type === 'image_generation_call');
    if (!imageCall?.result) return res.status(502).json({ error: 'AI не вернул изображение.' });

    return res.status(200).json({
      image: 'data:image/png;base64,' + imageCall.result,
      source: image ? 'Фото + описание' : 'Описание'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Не удалось связаться с AI-сервисом.' });
  }
}
