# TwinMind AI

TwinMind is a real-time AI meeting assistant featuring Live Transcription, Live AI Suggestions, and a generative Chat interface, leveraging Groq's high-speed inference.

## Features

1. **Live Transcription:** Real-time 30-second chunking using the `MediaRecorder` API. Serverless ingestion using Groq's `whisper-large-v3` model.
2. **Context-Aware Live Suggestions:** Every 30 seconds, the frontend sends a rolling time-window of transcribed chunks. A 120B Open Source model running on Groq (default `openai/gpt-oss-120b`) dynamically figures out what's missing in the conversation and proposes 3 types of insights: Question, Talking Point, Answer, Fact-Check, or Clarification.
3. **Chat Interface:** Click any suggestion or just free-type to chat with the full context of what has been spoken.
4. **Local Configs:** User-provided configurations so API Keys and prompts are safely stored in Local Storage.
5. **Full Export:** Export a JSON blob of the session for offline auditing.

## Tech Stack & Architecture

- **Frontend:** Single Page Application strictly on React + Vite. Styled with Tailwind CSS and React-Markdown for native formatting parsing.
- **Backend:** Node.js Vercel Functions directly under `/api` (`/api/transcribe`, `/api/suggestions`, `/api/chat`).
- **Inference:** OpenAI compatible SDK leveraging `https://api.groq.com/openai/v1`.

### Pre-requisites & Deployment

This application expects deployment via Vercel where the root directory acts as the Frontend via Vite and `/api/` files get hoisted automatically as Vercel APIs. 

If running locally:
```bash
npm install
npm run dev
# Note: Vercel standard CLI (vercel dev) handles routing /api endpoints transparently.
# Use `npx vercel dev` to emulate.
```

## Prompt Engineering Strategy

The core feature lies within `/api/suggestions`. The endpoint dictates structure using JSON mode effectively:

1. **Anti-Repetition Engine:** We pass down previously generated suggestion titles (e.g. `pastTitles.join(',')`) back to the system prompt asking the model to not duplicate.
2. **Event Recognition:** The ruleset guides the model: "FACT-CHECK: if a claim was made". The model looks at the last 2-3 chunks using the *recent transcript*. By providing this short, sliding snapshot along with the exact rule mapping, it correctly tags outputs.
3. **Standalone Preview Output:** We instruct the LLM: `"preview": "A standalone useful sentence explaining..."`. This avoids vague teaser texts and ensures the suggestion is immediately actionable in the Live Suggestions UI without mandating a click.

**Model Enforcement:** As requested, `openai/gpt-oss-120b` nomenclature is set. Because the real Groq cluster may update target nodes, users can reconfigure the precise deployment string directly from the UI's Settings Modal. Model quality governs the generation schema format correctly.
