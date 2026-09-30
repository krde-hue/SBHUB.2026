const https = require('https');

function postJSON(urlStr, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const postData = JSON.stringify(data);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, bodyRaw: body });
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(postData);
    req.end();
  });
}

module.exports = async function handler(req, res) {
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
        content: "⚠️ **Configuration Notice**: `GEMINI_API_KEY` was not detected by the server function.\n\n👉 **Fix**: Go to **Vercel Dashboard → Deployments → click `...` → Redeploy** to apply your environment variable." 
      });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch(e) {}
    }
    body = body || {};

    const { messages = [], hubContext, hubData } = body;
    const recentMessages = Array.isArray(messages) ? messages.slice(-10) : [];

    let systemInstructions = `You are Kriztel AI, an authentic, highly intelligent, and versatile AI Copilot. Function as a complete general AI assistant capable of answering any question, coding, writing, research, and general knowledge.`;

    if (hubContext && hubData) {
      systemInstructions += `\n\n[SPORTSBOOK HUB TELEMETRY DATA]:\n${JSON.stringify(hubData, null, 2)}`;
    }

    const contents = recentMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '') }]
    }));

    if (contents.length === 0) {
      return res.status(200).json({ content: 'Please enter a prompt or message.' });
    }

    const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError = '';

    for (const rawModel of candidateModels) {
      const model = String(rawModel).trim();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      // Attempt 1: With Google Search Grounding
      const payloadWithTools = {
        systemInstruction: { parts: [{ text: systemInstructions }] },
        contents: contents,
        tools: [{ googleSearch: {} }]
      };

      let result = await postJSON(url, payloadWithTools);

      // Attempt 2: Fallback to standard request if Search Grounding is rejected by API key
      if (result.status !== 200) {
        const payloadPlain = {
          systemInstruction: { parts: [{ text: systemInstructions }] },
          contents: contents
        };
        result = await postJSON(url, payloadPlain);
      }

      if (result.status === 200 && result.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return res.status(200).json({ content: result.data.candidates[0].content.parts[0].text });
      }

      lastError = result.data?.error?.message || `Model ${model} returned status ${result.status}`;
      if (result.status === 401 || result.status === 403) break;
    }

    return res.status(200).json({ content: `⚠️ **Gemini API Error**: ${lastError}` });

  } catch (err) {
    return res.status(200).json({ content: `⚠️ **Server Function Error**: ${err.message}` });
  }
};
