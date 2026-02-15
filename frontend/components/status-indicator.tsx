'use client';

import { useChat } from '@/components/chat-context';
import { Loader2, Users, AlertCircle } from 'lucide-react';

export function StatusIndicator() {
  const { status, onlineCount } = useChat();
  
  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="w-20 h-20 rounded-3xl bg-ani-green/10 flex items-center justify-center mb-4 animate-bounce-subtle">
          <Users className="w-10 h-10 text-ani-green" />
        </div>
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-ani-text text-center mb-2">
          Start a Chat
        </h2>
        <p className="text-ani-muted text-center max-w-sm mb-2">
          Anonymous. Random. No accounts needed.
        </p>
        <p className="text-sm text-ani-muted/70 text-center">
          {onlineCount.toLocaleString()} people online now
        </p>
      </div>
    );
  }
  
  if (status === 'finding') {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="relative w-20 h-20 rounded-3xl bg-ani-green/10 flex items-center justify-center mb-4">
          <Loader2 className="w-10 h-10 text-ani-green animate-spin" />
          <div className="absolute inset-0 rounded-3xl border-2 border-ani-green/30 animate-pulse-ring" />
        </div>
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-ani-text text-center mb-2">
          Finding Match
        </h2>
        <p className="text-ani-muted text-center max-w-sm">
          Looking for someone to chat with...
        </p>
      </div>
    );
  }
  
  if (status === 'matched') {
    return (
      <div className="flex flex-col items-center justify-center py-4 px-4 border-b border-ani-border/50">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-ani-green animate-pulse" />
          <span className="text-sm font-medium text-ani-green">Connected</span>
        </div>
        <p className="text-xs text-ani-muted">
          You&apos;re chatting with a stranger
        </p>
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="w-20 h-20 rounded-3xl bg-red-100 flex items-center justify-center mb-4">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-ani-text text-center mb-2">
          Oops!
        </h2>
        <p className="text-ani-muted text-center max-w-sm">
          Something went wrong. Please try again.
        </p>
      </div>
    );
  }
  
  return null;
}
