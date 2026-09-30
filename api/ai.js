export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // CORS Preflight
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
    // Cap chat history to last 10 turns to maintain low latency
    const rawMessages = body.messages || [];
    const messages = rawMessages.slice(-10);
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

    const payload = {
      systemInstruction: {
        parts: [{ text: systemInstructions }]
      },
      contents: contents
    };

    // Ultra-fast streaming API endpoint using Gemini 2.0 Flash
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!geminiRes.ok) {
      const errData = await geminiRes.text();
      return new Response(JSON.stringify({ error: `Gemini API error: ${errData}` }), {
        status: geminiRes.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Stream SSE data to client in real-time
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = geminiRes.body.getReader();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.replace('data: ', '').trim();
                if (jsonStr === '[DONE]') continue;
                try {
                  const data = JSON.parse(jsonStr);
                  const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (textChunk) {
                    controller.enqueue(encoder.encode(textChunk));
                  }
                } catch (e) {
                  // Ignore partial SSE JSON frames
                }
              }
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
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
