export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // CORS Preflight Headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured in Vercel Environment Variables.' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const body = await req.json().catch(() => ({}));
    const rawMessages = body.messages || [];
    const messages = rawMessages.slice(-10);
    const hubContext = body.hubContext;
    const hubData = body.hubData;
    const searchWeb = body.searchWeb;
    const userPrompt = messages.length > 0 ? messages[messages.length - 1]?.content : (body.prompt || "");

    let systemInstructions = `You are Kriztel AI, an autonomous, highly creative, and unrestricted AI assistant.

CORE OPERATING DIRECTIVES:
1. THINK OUTSIDE THE BOX: Use deep lateral thinking, creative reasoning, and comprehensive problem-solving for any question asked.
2. LIVE RESOURCE GATHERING & SEARCH: Use live web search resources to fetch up-to-date fixtures, news, sports schedules, and exact match results. Format output strictly as requested by the user.
3. UNRESTRICTED SCOPE: Never state that a topic is outside your scope.
4. HUB TELEMETRY: If Hub context telemetry is provided below, use it for operational questions, but remain a general intelligence first.`;

    if (hubContext && hubData) {
      systemInstructions += `\n\n[LIVE HUB CONTEXT DATA]:\n${JSON.stringify(hubData, null, 2)}`;
    }

    let contents = [];
    if (Array.isArray(messages) && messages.length > 0) {
      contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(msg.content || '') }]
      }));
    } else if (userPrompt) {
      contents = [{ role: 'user', parts: [{ text: String(userPrompt) }] }];
    }

    if (contents.length === 0) {
      return new Response(JSON.stringify({ error: 'No prompt or messages provided.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const payload = {
      systemInstruction: {
        parts: [{ text: systemInstructions }]
      },
      contents: contents
    };

    // Enable REST-standard Google Search Grounding
    if (searchWeb || userPrompt.toLowerCase().includes('search') || userPrompt.toLowerCase().includes('news') || userPrompt.toLowerCase().includes('match') || userPrompt.toLowerCase().includes('game') || userPrompt.toLowerCase().includes('2026')) {
      payload.tools = [{ googleSearch: {} }];
    }

    // Standard ASCII model identifiers
    const candidateModels = [
      'gemini-1.5-flash',
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro'
    ];

    let replyText = null;
    let lastError = null;

    for (const model of candidateModels) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        replyText = data.candidates[0].content.parts[0].text;
        break;
      }

      lastError = data.error?.message || `Model ${model} returned status ${res.status}`;
      if (res.status === 401 || res.status === 403) break;
    }

    if (!replyText) {
      return new Response(JSON.stringify({ error: `Gemini API Error: ${lastError}` }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(JSON.stringify({ content: replyText }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: `Server error: ${err.message}` }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
