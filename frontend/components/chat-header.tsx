'use client';

import { useChat } from '@/components/chat-context';
import { Users } from 'lucide-react';

export function ChatHeader() {
  const { onlineCount, status } = useChat();
  
  const getStatusText = () => {
    switch (status) {
      case 'finding':
        return 'Finding match...';
      case 'matched':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      default:
        return 'Online';
    }
  };
  
  const getStatusColor = () => {
    switch (status) {
      case 'finding':
        return 'bg-amber-400';
      case 'matched':
        return 'bg-ani-green';
      case 'connecting':
        return 'bg-blue-400';
      default:
        return 'bg-ani-green';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-ani-green to-ani-green-light flex items-center justify-center shadow-card-sm">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="font-display font-bold text-lg text-ani-text">
            AniMoChat
          </span>
        </div>
        
        {/* Online Status */}
        <div className="flex items-center gap-4">
          {/* Online Count - Desktop */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full border border-ani-border">
            <Users className="w-4 h-4 text-ani-muted" />
            <span className="text-sm font-medium text-ani-text">
              {onlineCount.toLocaleString()}
            </span>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full border border-ani-border">
            <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} ${status === 'finding' ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-medium text-ani-text hidden sm:inline">
              {getStatusText()}
            </span>
          </div>
          
          {/* Avatar Stack */}
          <div className="hidden md:flex items-center -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-ani-green to-ani-green-light border-2 border-white flex items-center justify-center"
              >
                <span className="text-xs font-medium text-white">{String.fromCharCode(64 + i)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
