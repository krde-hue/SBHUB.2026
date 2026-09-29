module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'GEMINI_API_KEY is not configured in Vercel Environment Variables.' 
      });
    }

    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    const messages = body.messages || [];
    const hubContext = body.hubContext;
    const hubData = body.hubData;
    const userPrompt = messages.length > 0 ? messages[messages.length - 1]?.content : (body.prompt || "");

    let systemInstructions = `You are Kriztel AI, an autonomous, highly creative, and versatile AI Copilot.

CORE OPERATING DIRECTIVES:
1. THINK OUTSIDE THE BOX: Use deep lateral thinking, creative reasoning, and comprehensive problem-solving for any question asked.
2. UNRESTRICTED SCOPE: You have expertise across science, technology, programming, literature, math, philosophy, general knowledge, sports, business, and creative brainstorming. NEVER state that a topic is "outside your scope" or "not related to Sportsbook Hub."
3. ADAPTIVE PERSONA: Deliver sharp, engaging, well-structured, and helpful answers tailored to the complexity of the prompt.
4. HUB INTEGRATION: You are embedded inside Sportsbook Hub. If Hub operational context data is provided below, treat it as active real-time telemetry to answer workplace or operational questions when asked, but never let it restrict your general knowledge capabilities.`;

    if (hubContext && hubData) {
      systemInstructions += `\n\n[LIVE SPORTSBOOK HUB TELEMETRY DATA]:\n${JSON.stringify(hubData, null, 2)}`;
    }

    // Format conversation history for Gemini API
    let contents = [];
    if (Array.isArray(messages) && messages.length > 0) {
      contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(msg.content || '') }]
      }));
    } else if (userPrompt) {
      contents = [{
        role: 'user',
        parts: [{ text: String(userPrompt) }]
      }];
    }

    if (contents.length === 0) {
      return res.status(400).json({ error: 'No prompt or messages provided.' });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      systemInstruction: {
        parts: [{ text: systemInstructions }]
      },
      contents: contents
    };

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data.error?.message || 'Gemini API call failed.' 
      });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    return res.status(200).json({ content: replyText });

  } catch (err) {
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
};
