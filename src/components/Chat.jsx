import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Chat({ messages, onSendMessage, isLoading }) {
  const [input, setInput] = useState('');
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[60vh] lg:h-full bg-gray-900 rounded-xl border border-gray-800 p-4 min-h-0">
      <div className="mb-4 pb-4 border-b border-gray-800">
        <h2 className="font-semibold text-lg flex items-center space-x-2">
           <span>Chat</span>
        </h2>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin"
      >
        {messages.length === 0 ? (
          <div className="text-gray-500 text-sm text-center mt-10">
            Ask questions about the meeting or click a suggestion.
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`p-4 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none max-w-[85%]' 
                  : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700 w-full overflow-hidden'
                }`}
              >
                {msg.role === 'user' ? (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none w-full prose-p:leading-relaxed prose-pre:bg-gray-900 prose-table:block prose-table:overflow-x-auto prose-table:w-full prose-td:min-w-[150px] prose-th:min-w-[150px] prose-td:border-gray-700 prose-th:border-gray-700">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2 relative">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={isLoading}
          className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm rounded-lg pl-4 pr-10 py-3 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
        />
        <button 
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-2 top-2 p-1.5 text-blue-500 hover:text-blue-400 disabled:opacity-50 disabled:hover:text-blue-500 transition-colors"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
