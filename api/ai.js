export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing in Vercel Environment Variables.' });
    }

    const { messages = [], hubContext, hubData } = req.body || {};
    const recentMessages = messages.slice(-10);

    let systemInstructions = `You are Kriztel AI, an authentic, highly intelligent, and versatile AI Copilot.

CORE CAPABILITIES:
- GENERAL AI FIRST: You function as a complete general AI assistant. You can write & debug code, rephrase sentences, write emails, perform math, answer science/history questions, summarize text, and analyze complex topics.
- LIVE WEB RESEARCH: You have live web search tools enabled. Use them automatically whenever you need up-to-date real-world facts, current news, or live sports fixtures.
- SPORTSBOOK HUB INTEGRATION: You are embedded inside Sportsbook Hub. If Hub operational context data is attached below, use it to answer workplace questions when asked. Never restrict your answers or general intelligence to Hub topics alone.
- USER INSTRUCTIONS: Follow formatting instructions, code syntax requests, or tone adjustments strictly as requested by the user.`;

    if (hubContext && hubData) {
      systemInstructions += `\n\n[SPORTSBOOK HUB TELEMETRY DATA]:\n${JSON.stringify(hubData, null, 2)}`;
    }

    const payload = {
      systemInstruction: { parts: [{ text: systemInstructions }] },
      contents: recentMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.content || '') }]
      })),
      tools: [{ googleSearch: {} }]
    };

    const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    let lastError = '';

    for (const rawModel of candidateModels) {
      const model = rawModel.replace(/[\u2010-\u2015]/g, '-');
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return res.status(200).json({ content: data.candidates[0].content.parts[0].text });
      }

      lastError = data.error?.message || `Status ${response.status}`;
      if (response.status === 401 || response.status === 403) break;
    }

    return res.status(500).json({ error: `Gemini API Error: ${lastError}` });
  } catch (err) {
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}
