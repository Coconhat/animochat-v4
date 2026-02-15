'use client';

import { useChat } from '@/components/chat-context';
import { ChatHeader } from '@/components/chat-header';
import { MessageList } from '@/components/message-list';
import { MessageInput } from '@/components/message-input';
import { StatusIndicator } from '@/components/status-indicator';

export function ChatInterface() {
  const { status } = useChat();
  const isMatched = status === 'matched';
  
  return (
    <div className="flex flex-col h-screen bg-ani-bg">
      {/* Header */}
      <ChatHeader />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col pt-20 pb-4">
        {/* Status Indicator - Only show when not matched */}
        {!isMatched && <StatusIndicator />}
        
        {/* Messages - Only show when matched */}
        {isMatched && <MessageList />}
        
        {/* Input Area */}
        <MessageInput />
      </main>
    </div>
  );
}
