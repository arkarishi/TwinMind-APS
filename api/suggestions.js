import { OpenAI } from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const apiKey = req.headers['x-groq-key'];
  if (!apiKey) return res.status(401).json({ error: 'Missing API Key' });

  // Get the model string, defaulting to a sensible default if the user hasn't overridden
  // Note: The UI settings should default to 'openai/gpt-oss-120b' or user specified
  const { 
    systemPrompt, 
    transcriptChunks, 
    elapsed, 
    model = 'openai/gpt-oss-120b',
    pastTitles = []
  } = req.body;

  if (!transcriptChunks || transcriptChunks.length === 0) {
    return res.status(200).json({ suggestions: [] });
  }

  const prompt = `
${systemPrompt || 'You are a real-time meeting assistant. Given the transcript below, generate exactly 3 suggestions.'}

Choose the RIGHT TYPE for each suggestion:
- QUESTION TO ASK: if the conversation has an unanswered gap
- TALKING POINT: if there's a relevant fact/data point to add  
- ANSWER: if someone just asked something that can be answered
- FACT-CHECK: if a claim was made that may need verification
- CLARIFICATION: if something said was ambiguous

Recent transcript context:
${transcriptChunks.join('\n')}

Current time in conversation: ${elapsed}

Do NOT repeat these previous suggestions: ${pastTitles.join(', ')}

Return JSON EXACTLY matching this schema:
[
  {
    "type": "QUESTION TO ASK" | "TALKING POINT" | "ANSWER" | "FACT-CHECK" | "CLARIFICATION",
    "title": "Short descriptive title",
    "preview": "A standalone useful sentence explaining the suggestion."
  }
]
`;

  try {
    const openai = new OpenAI({
      apiKey: apiKey,
      // If the model is an OpenRouter model, we might need a different base URL
      // We will assume Groq's open AI compatible endpoint unless it's OpenRouter specific.
      // Easiest is to point to Groq and if it fails, the user provided an OpenRouter key instead.
      // But user said "Groq for everything... GPT-OSS 120B... Same model for everyone" 
      // We'll use the user setup config base url if provided, otherwise assume Groq.
      baseURL: 'https://api.groq.com/openai/v1',
    });

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content;
    let suggestions = [];
    
    try {
      // Sometimes models wrap json array in an object when json_object format is enforced.
      // e.g. { "suggestions": [...] }
      const parsed = JSON.parse(responseText);
      if (Array.isArray(parsed)) {
        suggestions = parsed;
      } else if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        suggestions = parsed.suggestions;
      } else {
        // Fallback array extraction
        suggestions = [parsed];
      }
    } catch (e) {
      console.error("JSON parse error:", responseText);
    }
    
    // Ensure exactly 3 format
    res.status(200).json({ suggestions: suggestions.slice(0, 3) });
  } catch (e) {
    console.error("Suggestion error:", e);
    res.status(500).json({ error: e.message || 'Error generating suggestions' });
  }
}
