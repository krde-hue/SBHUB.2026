module.exports = async function handler(req, res) {
  // Prevent Vercel edge/browser caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      return res.status(200).json({
        content: "⚠️ **Configuration Notice**: `GEMINI_API_KEY` is missing in Vercel.\n\n👉 **Fix**: Go to **Vercel Dashboard → Settings → Environment Variables**, confirm `GEMINI_API_KEY` is added, then click **Redeploy** on your latest build."
      });
    }

    // Parse body safely
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch(e) { body = {}; }
    }
    body = body || {};

    const { messages = [], hubContext, hubData } = body;
    const recentMessages = Array.isArray(messages) ? messages.slice(-10) : [];

    let systemInstructions = `You are Kriztel AI, an authentic, highly intelligent, and versatile AI Copilot.

CORE CAPABILITIES:
- GENERAL AI FIRST: You function as a complete general AI assistant. You can write & debug code, rephrase sentences, write emails, perform math, answer science/history questions, summarize text, and analyze complex topics.
- LIVE WEB RESEARCH: You have live web search tools enabled. Use them automatically whenever you need up-to-date real-world facts, current news, or live sports fixtures.
- SPORTSBOOK HUB INTEGRATION: You are embedded inside Sportsbook Hub. If Hub operational context data is attached below, use it to answer workplace questions when asked. Never restrict your answers or general intelligence to Hub topics alone.`;

    if (hubContext && hubData) {
      systemInstructions += `\n\n[SPORTSBOOK HUB TELEMETRY DATA]:\n${JSON.stringify(hubData, null, 2)}`;
    }

    const contents = recentMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '') }]
    }));

    if (contents.length === 0) {
      return res.status(200).json({ content: 'Please enter a message.' });
    }

    const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError = '';

    for (const rawModel of candidateModels) {
      const model = String(rawModel).trim();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      // Attempt 1: Search Grounding
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

        // Fallback: If Search Grounding is rejected, retry plain completion
        if (!response.ok) {
          const payloadPlain = {
            systemInstruction: { parts: [{ text: systemInstructions }] },
            contents: contents
          };
          response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadPlain)
          });
          data = await response.json();
        }

        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return res.status(200).json({ content: data.candidates[0].content.parts[0].text });
        }

        lastError = data.error?.message || `Status ${response.status}`;
        if (response.status === 401 || response.status === 403) break;
      } catch (fetchErr) {
        lastError = fetchErr.message;
      }
    }

    return res.status(200).json({ content: `⚠️ **Gemini API Error**: ${lastError}` });

  } catch (err) {
    return res.status(200).json({ content: `⚠️ **Server Function Error**: ${err.message}` });
  }
};
