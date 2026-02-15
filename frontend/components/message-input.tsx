'use client';

import { useState, useRef, useCallback } from 'react';
import { useChat } from '@/components/chat-context';
import { Send, Mic, Smile, SkipForward } from 'lucide-react';

export function MessageInput() {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { status, sendMessage, sendTyping, nextMatch, findMatch } = useChat();
  
  const isMatched = status === 'matched';
  const isFinding = status === 'finding';
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    sendMessage(message);
    setMessage('');
    sendTyping(false);
    
    // Focus back on input
    inputRef.current?.focus();
  }, [message, sendMessage, sendTyping]);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    sendTyping(true);
  }, [sendTyping]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);
  
  if (!isMatched && !isFinding) {
    return (
      <div className="px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={findMatch}
            className="w-full bg-gradient-to-br from-ani-green to-ani-green-light text-white font-display font-semibold text-lg py-4 rounded-2xl shadow-card hover:shadow-card-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-3"
          >
            <span>Find a Match</span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    );
  }
  
  if (isFinding) {
    return (
      <div className="px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="w-full bg-white border border-ani-border rounded-2xl py-4 px-6 flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-ani-green border-t-transparent rounded-full animate-spin" />
            <span className="text-ani-muted font-medium">Finding someone to chat with...</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="px-4 sm:px-6 py-4">
      <div className="max-w-3xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 sm:gap-3 bg-white border border-ani-border shadow-card rounded-2xl px-3 sm:px-4 py-2 sm:py-3"
        >
          {/* Emoji Button */}
          <button
            type="button"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-ani-muted hover:bg-ani-bg hover:text-ani-text transition-colors"
          >
            <Smile className="w-5 h-5" />
          </button>
          
          {/* Voice Button */}
          <button
            type="button"
            onClick={() => setIsRecording(!isRecording)}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors ${
              isRecording
                ? 'bg-red-100 text-red-500'
                : 'text-ani-muted hover:bg-ani-bg hover:text-ani-text'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
          
          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-ani-text placeholder:text-ani-muted text-sm sm:text-base outline-none min-w-0"
            autoComplete="off"
          />
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={!message.trim()}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-ani-green to-ani-green-light text-white flex items-center justify-center hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Send className="w-5 h-5" />
          </button>
          
          {/* Next Button */}
          <button
            type="button"
            onClick={nextMatch}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-ani-muted/10 text-ani-muted flex items-center justify-center hover:bg-ani-muted/20 hover:text-ani-text transition-colors"
            title="Find new match"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
