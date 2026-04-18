import React from 'react';
import { RefreshCw, MessageCircle } from 'lucide-react';

const TYPE_COLORS = {
  'QUESTION TO ASK': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'TALKING POINT': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'ANSWER': 'bg-green-500/20 text-green-400 border-green-500/30',
  'FACT-CHECK': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'CLARIFICATION': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export default function Suggestions({ 
  batches, 
  isLoading, 
  onRefresh, 
  onSuggestionClick 
}) {
  return (
    <div className="flex flex-col h-[60vh] lg:h-full bg-gray-900 rounded-xl border border-gray-800 p-4 min-h-0 relative">
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-800 shrink-0">
        <h2 className="font-semibold text-lg flex items-center space-x-2">
          <span>Live Suggestions</span>
        </h2>
        <button 
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={isLoading ? "animate-spin text-blue-500" : ""} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pr-2 scrollbar-thin">
        {batches.length === 0 ? (
          <div className="text-gray-500 text-sm text-center mt-10">
            Waiting for conversation context...
          </div>
        ) : (
          batches.map((batch, bIndex) => (
            <div 
              key={bIndex} 
              className={`space-y-3 transition-opacity duration-500 ${bIndex === 0 ? 'opacity-100' : 'opacity-50'}`}
            >
              <div className="text-xs text-gray-500 mb-2 font-mono flex items-center justify-between">
                <span>Batch {batches.length - bIndex}</span>
                <span>{new Date(batch.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {batch.suggestions.map((sug, sIndex) => {
                const colorClass = TYPE_COLORS[sug.type] || 'bg-gray-800 text-gray-400 border-gray-700';
                return (
                  <div 
                    key={sIndex} 
                    onClick={() => onSuggestionClick(sug)}
                    className="p-3 rounded-lg border border-gray-800 cursor-pointer hover:border-gray-600 bg-gray-950/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border ${colorClass}`}>
                        {sug.type}
                      </span>
                      <MessageCircle size={14} className="text-gray-500" />
                    </div>
                    <div className="font-medium text-sm text-gray-200 mb-1 leading-snug">{sug.title}</div>
                    <div className="text-xs text-gray-400 leading-relaxed">{sug.preview}</div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
