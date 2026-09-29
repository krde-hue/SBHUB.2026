export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // CORS Preflight & Headers
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
      return new Response(JSON.stringify({ error: 'No prompt or messages provided.' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
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
      return new Response(JSON.stringify({ error: data.error?.message || 'Gemini API call failed.' }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
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
