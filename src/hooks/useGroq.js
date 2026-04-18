import { useCallback } from 'react';

export function useGroq() {
  const transcribeAudio = useCallback(async (audioBlob, apiKey) => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    
    const res = await fetch('/api/transcribe', {
      method: 'POST',
      headers: {
        'x-groq-key': apiKey,
      },
      body: formData,
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Transcription failed');
    }
    const data = await res.json();
    return data.text;
  }, []);

  const getSuggestions = useCallback(async (payload, apiKey) => {
    const res = await fetch('/api/suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-groq-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Suggestions failed');
    }
    const data = await res.json();
    return data.suggestions;
  }, []);

  return { transcribeAudio, getSuggestions };
}
