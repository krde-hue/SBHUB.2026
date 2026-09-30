export default async function handler(req, res) {
  // Always enforce JSON content type and disable CDN caching
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ content: 'Method not allowed' });

  try {
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      return res.status(200).json({
        content: "⚠️ **Configuration Notice**: `GEMINI_API_KEY` is missing in Vercel. Please check **Vercel Settings → Environment Variables** and redeploy."
      });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch(e) { body = {}; }
    }
    body = body || {};

    const { messages = [], hubContext, hubData } = body;
    const recentMessages = Array.isArray(messages) ? messages.slice(-10) : [];

    let systemInstructions = `You are Kriztel AI, an authentic, highly intelligent, and versatile AI Copilot. Function as a complete general AI assistant capable of writing code, research, math, writing, and answering questions.`;

    if (hubContext && hubData) {
      systemInstructions += `\n\n[SPORTSBOOK HUB TELEMETRY DATA]:\n${JSON.stringify(hubData, null, 2)}`;
    }

    const contents = recentMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '') }]
    }));

    if (contents.length === 0) {
      return res.status(200).json({ content: 'Please enter a prompt.' });
    }

    const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError = '';

    for (const rawModel of candidateModels) {
      const model = String(rawModel).trim();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const payloadWithSearch = {
        systemInstruction: { parts: [{ text: systemInstructions }] },
        contents: contents,
        tools: [{ googleSearch: {} }]
      };

      try {
        let response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadWithSearch)
        });

        let data = await response.json();

        // Fallback if Google Search grounding is not allowed on key
        if (!response.ok) {
          const plainPayload = {
            systemInstruction: { parts: [{ text: systemInstructions }] },
            contents: contents
          };
          response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(plainPayload)
          });
          data = await response.json();
        }

        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return res.status(200).json({ content: data.candidates[0].content.parts[0].text });
        }

        lastError = data.error?.message || `Status ${response.status}`;
        if (response.status === 401 || response.status === 403) break;
      } catch (err) {
        lastError = err.message;
      }
    }

    return res.status(200).json({ content: `⚠️️ **Gemini API Error**: ${lastError}` });

  } catch (err) {
    return res.status(200).json({ content: `⚠️ **Server Function Error**: ${err.message}` });
  }
}
