import React, { useState, useEffect } from 'react';
import { X, Save, Download } from 'lucide-react';

export default function Settings({ onClose, sessionData }) {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('twinmind_settings');
    if (saved) return JSON.parse(saved);
    return {
      apiKey: '',
      model: 'openai/gpt-oss-120b',
      contextWindow: 5, // Last N chunks
      refreshInterval: 30, // seconds
      suggestionPrompt: 'You are a real-time meeting assistant. Given the transcript below, generate exactly 3 suggestions.',
      chatPrompt: 'You are a helpful meeting assistant with full context of the conversation. Answer in detail. Be specific, cite relevant parts of the transcript.'
    };
  });

  const [savedStatus, setSavedStatus] = useState(false);

  const handleSave = () => {
    localStorage.setItem('twinmind_settings', JSON.stringify(settings));
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(sessionData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `twinmind-session-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-5 border-b border-gray-800">
          <h2 className="text-xl font-bold">Settings & Export</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-md text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">API Configuration</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Groq API Key</label>
              <input 
                type="password" 
                value={settings.apiKey}
                onChange={e => setSettings({...settings, apiKey: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="gsk_..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Model Name</label>
              <input 
                type="text" 
                value={settings.model}
                onChange={e => setSettings({...settings, model: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Default: openai/gpt-oss-120b</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Prompts & Tuning</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Live Suggestion System Prompt</label>
              <textarea 
                value={settings.suggestionPrompt}
                onChange={e => setSettings({...settings, suggestionPrompt: e.target.value})}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Chat System Prompt</label>
              <textarea 
                value={settings.chatPrompt}
                onChange={e => setSettings({...settings, chatPrompt: e.target.value})}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Context Size (chunks)</label>
                <input 
                  type="number" 
                  value={settings.contextWindow}
                  onChange={e => setSettings({...settings, contextWindow: parseInt(e.target.value) || 1})}
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Auto-refresh (seconds)</label>
                <input 
                  type="number" 
                  value={settings.refreshInterval}
                  onChange={e => setSettings({...settings, refreshInterval: parseInt(e.target.value) || 30})}
                  className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-gray-800 bg-gray-900 rounded-b-xl flex justify-between items-center">
          <button 
            onClick={handleExport}
            className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
          >
            <Download size={16} />
            <span>Export Session JSON</span>
          </button>
          <div className="flex items-center space-x-4">
            {savedStatus && <span className="text-green-500 text-sm">Saved!</span>}
            <button 
              onClick={handleSave}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-medium transition-colors"
            >
              <Save size={16} />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
