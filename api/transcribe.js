import formidable from 'formidable';
import fs from 'fs';
import { OpenAI } from 'openai';

export const config = {
  api: {
    bodyParser: false, // Disallow built-in body parsing
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const form = formidable({ multiples: false });
  
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to parse form data' });
    }
    
    const apiKey = req.headers['x-groq-key'];
    if (!apiKey) return res.status(401).json({ error: 'Missing Groq API Key' });

    const file = Array.isArray(files.file) ? files.file[0] : files.file; 
    if (!file) return res.status(400).json({ error: 'No audio file provided' });

    try {
      const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });

      // Formidable stores files without extensions. Groq requires .webm extension from the filename.
      const webmPath = file.filepath + '.webm';
      fs.renameSync(file.filepath, webmPath);

      // Pass the uploaded file stream into Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(webmPath),
        model: 'whisper-large-v3',
        language: 'en',
      });

      res.status(200).json({ text: transcription.text });
    } catch (e) {
      console.error("Transcription error:", e);
      res.status(500).json({ error: e.message || 'Transcription failed' });
    } finally {
      // Clean up temp files
      const webmPath = file.filepath + '.webm';
      if (fs.existsSync(webmPath)) fs.unlinkSync(webmPath);
      if (fs.existsSync(file.filepath)) fs.unlinkSync(file.filepath);
    }
  });
}
