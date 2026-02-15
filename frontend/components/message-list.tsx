'use client';

import { useRef, useEffect } from 'react';
import { useChat } from '@/components/chat-context';
import { User, Bot, Shield } from 'lucide-react';
import type { Message } from '@/types';

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const isSystem = message.type === 'system';
  
  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-ani-muted/10 rounded-full">
          <Shield className="w-4 h-4 text-ani-muted" />
          <span className="text-sm text-ani-muted">{message.content}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 animate-slide-up`}>
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ani-muted to-ani-text flex items-center justify-center mr-2 flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div
        className={`max-w-[75%] sm:max-w-[65%] px-4 py-3 rounded-2xl ${
          isOwn
            ? 'bg-gradient-to-br from-ani-green to-ani-green-light text-white rounded-br-md'
            : 'bg-white border border-ani-border shadow-card rounded-bl-md'
        }`}
      >
        <p className={`text-sm sm:text-base leading-relaxed ${isOwn ? 'text-white' : 'text-ani-text'}`}>
          {message.content}
        </p>
        <span
          className={`text-xs mt-1 block ${
            isOwn ? 'text-white/70' : 'text-ani-muted'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
      
      {isOwn && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ani-green to-ani-green-light flex items-center justify-center ml-2 flex-shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ani-muted to-ani-text flex items-center justify-center mr-2 flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-ani-border shadow-card px-4 py-3 rounded-2xl rounded-bl-md">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-ani-muted rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <span className="w-2 h-2 bg-ani-muted rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <span className="w-2 h-2 bg-ani-muted rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}

export function MessageList() {
  const { messages, isPartnerTyping } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const userIdRef = useRef<string>('user_' + Math.random().toString(36).substr(2, 9));
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isPartnerTyping]);
  
  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 scrollbar-hide"
    >
      <div className="max-w-3xl mx-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
            <div className="w-16 h-16 rounded-2xl bg-ani-green/10 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-ani-green" />
            </div>
            <p className="text-ani-muted text-sm">
              Start a conversation...
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === userIdRef.current}
              />
            ))}
            {isPartnerTyping && <TypingIndicator />}
          </>
        )}
      </div>
    </div>
  );
}
