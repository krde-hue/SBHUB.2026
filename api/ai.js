/**
 * Backend API Route: /api/ai
 * Interfaces with Google Gemini API securely using process.env.GEMINI_API_KEY
 */

export default async function handler(req, res) {
  // 1. CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 2. Validate API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'AI service is not configured. GEMINI_API_KEY is missing in server environment variables.'
      });
    }

    // 3. Extract & Validate Payload
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { messages = [], hubContext, hubData, searchWeb = true } = body;

    // Maintain recent conversation context (last 12 turns) to manage context limits
    const recentMessages = Array.isArray(messages) ? messages.slice(-12) : [];
    const userPrompt = recentMessages.length > 0 
      ? recentMessages[recentMessages.length - 1]?.content 
      : "";

    if (!userPrompt && recentMessages.length === 0) {
      return res.status(400).json({ error: 'No prompt or conversation messages provided.' });
    }

    // 4. System Instruction Setup (Unrestricted General-Purpose Persona)
    let systemInstructions = `You are an authentic, highly capable, and unrestricted AI Assistant.

CORE DIRECTIVES:
1. OPEN-ENDED INTELLIGENCE: You function as a general-purpose AI assistant (like ChatGPT or Gemini). You possess broad expertise across programming, software engineering, mathematics, creative writing, science, philosophy, business strategy, troubleshooting, and general knowledge.
2. ADAPTIVE PERSONA: Provide concise answers for straightforward questions, detailed step-by-step guides for technical/coding problems, and well-structured prose for creative/writing tasks.
3. LIVE RESEARCH: Use live search tools automatically whenever queries require current real-world facts, recent news, or live schedules.
4. UNRESTRICTED SCOPE: Never refuse a query simply because it is unrelated to the host dashboard application. Help the user with whatever topic or task they present.`;

    if (hubContext && hubData) {
      systemInstructions += `\n\n[HOST APPLICATION TELEMETRY CONTEXT]:\n${JSON.stringify(hubData, null, 2)}`;
    }

    // Format payload for Gemini API
    const formattedContents = recentMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(msg.content || '') }]
    }));

    const payload = {
      systemInstruction: {
        parts: [{ text: systemInstructions }]
      },
      contents: formattedContents.length > 0 ? formattedContents : [{
        role: 'user',
        parts: [{ text: String(userPrompt) }]
      }],
      // Google Search Grounding for live web queries
      tools: searchWeb ? [{ googleSearch: {} }] : []
    };

    // 5. Model Fallback Chain (Sanitizes ASCII Hyphens to avoid Unicode en-dash bugs)
    const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let replyText = null;
    let lastError = null;

    for (let rawModel of candidateModels) {
      // Clean model identifier: Replace non-ASCII dashes (en-dash, em-dash) with standard hyphens
      const model = String(rawModel).replace(/[\u2010-\u201F\u2013\u2014]/g, '-').replace(/[^\x00-\x7F]/g, '-');
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          replyText = data.candidates[0].content.parts[0].text;
          break;
        }

        lastError = data.error?.message || `Model ${model} responded with status ${response.status}`;
        
        // Stop retrying if authorization or quota error occurs
        if (response.status === 401 || response.status === 403 || response.status === 429) {
          break;
        }
      } catch (fetchErr) {
        lastError = `Network connection to ${model} failed: ${fetchErr.message}`;
      }
    }

    // 6. Return Response
    if (!replyText) {
      return res.status(500).json({
        error: lastError || 'I couldn\'t process that request right now. Please try again.'
      });
    }

    return res.status(200).json({ content: replyText });

  } catch (err) {
    return res.status(500).json({
      error: `Server Error: ${err.message || 'An unexpected error occurred.'}`
    });
  }
}
