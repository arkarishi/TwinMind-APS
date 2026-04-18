import React, { useEffect, useRef } from 'react';
import { Mic, Square } from 'lucide-react';

export default function MicTranscript({ 
  isRecording, 
  toggleRecording, 
  transcriptChunks 
}) {
  const containerRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcriptChunks]);

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl border border-gray-800 p-4 min-h-0">
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-800">
        <h2 className="font-semibold text-lg flex items-center space-x-2">
          <span>Transcript</span>
        </h2>
        <button
          onClick={toggleRecording}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isRecording 
            ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
            : 'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          {isRecording ? (
            <>
              <Square size={16} className="animate-pulse" />
              <span>Stop Recording</span>
            </>
          ) : (
            <>
              <Mic size={16} />
              <span>Start</span>
            </>
          )}
        </button>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin"
      >
        {transcriptChunks.length === 0 ? (
          <div className="text-gray-500 text-sm text-center mt-10">
            {isRecording ? "Listening..." : "Click start to begin transcribing."}
          </div>
        ) : (
          transcriptChunks.map((chunk, idx) => (
            <div key={idx} className="bg-gray-800/50 p-3 rounded-lg text-sm text-gray-300 leading-relaxed">
               <div className="text-xs text-gray-500 mb-1 font-mono">
                 {new Date(chunk.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
               </div>
               {chunk.text}
            </div>
          ))
        )}
        {isRecording && transcriptChunks.length > 0 && (
          <div className="text-gray-500 text-sm italic animate-pulse">
            Listening...
          </div>
        )}
      </div>
    </div>
  );
}
