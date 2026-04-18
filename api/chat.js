import { OpenAI } from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const apiKey = req.headers['x-groq-key'];
  if (!apiKey) return res.status(401).json({ error: 'Missing API Key' });

  const { chatHistory, fullTranscript, question, model = 'openai/gpt-oss-120b', chatPrompt } = req.body;

  const systemMessage = `
${chatPrompt || 'You are a helpful meeting assistant with full context of the conversation. Answer in detail. Be specific, cite relevant parts of the transcript.'}

Full transcript so far:
${fullTranscript || '(No transcript yet)'}
`;

  try {
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    const messages = [
      { role: 'system', content: systemMessage },
      ...chatHistory,
      { role: 'user', content: question }
    ];

    const stream = await openai.chat.completions.create({
      model: model,
      messages: messages,
      stream: true,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (e) {
    console.error("Chat error:", e);
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
    res.end();
  }
}
