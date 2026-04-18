import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import MicTranscript from './components/MicTranscript';
import Suggestions from './components/Suggestions';
import Chat from './components/Chat';
import Settings from './components/Settings';
import { useMic } from './hooks/useMic';
import { useGroq } from './hooks/useGroq';

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [transcriptChunks, setTranscriptChunks] = useState([]);
  const [suggestionBatches, setSuggestionBatches] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [sessionStartTime] = useState(Date.now());
  
  const [isSugLoading, setIsSugLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const { transcribeAudio, getSuggestions } = useGroq();

  const getSettings = () => {
    const saved = localStorage.getItem('twinmind_settings');
    if (saved) return JSON.parse(saved);
    return {
      apiKey: '',
      model: 'GPT-OSS 120B',
      contextWindow: 5,
      refreshInterval: 30,
      suggestionPrompt: 'You are a real-time meeting assistant. Given the transcript below, generate exactly 3 suggestions.',
      chatPrompt: 'You are a helpful meeting assistant with full context of the conversation. Answer in detail. Be specific, cite relevant parts of the transcript.'
    };
  };

  const handleAudioChunk = async (blob) => {
    const s = getSettings();
    if (!s.apiKey) {
      alert("Please configure your Groq API key in Settings first.");
      stopRecording();
      return;
    }
    try {
      const text = await transcribeAudio(blob, s.apiKey);
      if (text && text.trim()) {
        setTranscriptChunks(prev => [...prev, { text: text.trim(), timestamp: Date.now() }]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const { isRecording, toggleRecording, stopRecording } = useMic({ onAudioChunk: handleAudioChunk });

  // Suggestions loop
  const fetchSuggestions = async () => {
    const s = getSettings();
    if (!s.apiKey || transcriptChunks.length === 0 || isSugLoading) return;
    
    setIsSugLoading(true);
    try {
      // Get last N chunks based on context window
      const recentChunks = transcriptChunks.slice(-1 * s.contextWindow).map(c => c.text);
      const pastTitles = suggestionBatches.flatMap(b => b.suggestions.map(sug => sug.title));
      
      const elapsedMins = Math.floor((Date.now() - sessionStartTime) / 60000);
      
      const sugs = await getSuggestions({
        systemPrompt: s.suggestionPrompt,
        transcriptChunks: recentChunks,
        elapsed: `${elapsedMins}m`,
        model: s.model,
        pastTitles
      }, s.apiKey);
      
      if (sugs && sugs.length > 0) {
        setSuggestionBatches(prev => [{ timestamp: Date.now(), suggestions: sugs }, ...prev]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSugLoading(false);
    }
  };

  useEffect(() => {
    const s = getSettings();
    if (!isRecording || !s.refreshInterval) return;
    
    const interval = setInterval(() => {
      if (transcriptChunks.length > 0) {
        fetchSuggestions();
      }
    }, s.refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [isRecording, transcriptChunks.length, isSugLoading]);

  // Chat Submission
  const handleChatSend = async (question) => {
    const s = getSettings();
    if (!s.apiKey) {
      alert("Please configure your Groq API key in Settings first.");
      return;
    }

    const newHistory = [...chatHistory, { role: 'user', content: question }];
    setChatHistory(newHistory);
    setIsChatLoading(true);

    try {
      // Note: We'll add an empty bot message and stream into it
      setChatHistory(prev => [...prev, { role: 'assistant', content: '' }]);

      const fullTranscript = transcriptChunks.map(c => c.text).join('\n');
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-groq-key': s.apiKey
        },
        body: JSON.stringify({
          chatHistory: newHistory,
          fullTranscript,
          question,
          model: s.model,
          chatPrompt: s.chatPrompt
        })
      });

      if (!res.ok) throw new Error('Chat failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let botMessage = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '');
            if (dataStr === '[DONE]') break;
            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                botMessage += data.text;
                // Update last message
                setChatHistory(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = botMessage;
                  return updated;
                });
              } else if (data.error) {
                console.error("Chat stream error:", data.error);
                botMessage += `\n[Error: ${data.error}]`;
                 setChatHistory(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = botMessage;
                  return updated;
                });
              }
            } catch (e) {
              console.error("Error parsing stream chunk", e, dataStr);
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
      setChatHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1].content = "Sorry, an error occurred: " + e.message;
        return updated;
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSuggestionClick = (sug) => {
    handleChatSend(`[${sug.type}] ${sug.title}\n${sug.preview}`);
  };

  const sessionData = {
    session: {
      startTime: new Date(sessionStartTime).toISOString(),
      transcript: transcriptChunks,
      suggestionBatches,
      chat: chatHistory
    }
  };

  return (
    <div className="h-full flex flex-col mx-auto max-w-[1400px]">
      <header className="flex justify-between items-center px-6 pb-4 border-b border-gray-800 shrink-0">
        <h1 className="text-xl font-semibold tracking-tight">TwinMind</h1>
        <button 
          onClick={() => setShowSettings(true)}
          className="p-2 hover:bg-gray-800 rounded-md transition-colors"
        >
          <SettingsIcon size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-hidden grid grid-cols-3 gap-6 p-6 h-[calc(100vh-80px)]">
        <MicTranscript 
          isRecording={isRecording}
          toggleRecording={toggleRecording}
          transcriptChunks={transcriptChunks}
        />
        <Suggestions 
          batches={suggestionBatches}
          isLoading={isSugLoading}
          onRefresh={fetchSuggestions}
          onSuggestionClick={handleSuggestionClick}
        />
        <Chat 
          messages={chatHistory}
          onSendMessage={handleChatSend}
          isLoading={isChatLoading}
        />
      </main>

      {showSettings && (
        <Settings 
          onClose={() => setShowSettings(false)} 
          sessionData={sessionData}
        />
      )}
    </div>
  );
}
