"use client";

import { useChat } from "@/components/chat-context";
import { ChatHeader } from "@/components/chat-header";
import { MessageList } from "@/components/message-list";
import { MessageInput } from "@/components/message-input";
import { StatusIndicator } from "@/components/status-indicator";

export function ChatInterface() {
  const { status } = useChat();
  const isMatched = status === "matched";

  return (
    <div className="flex flex-col h-screen bg-ani-bg">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0">
        <ChatHeader />
      </div>

      {/* Main Content - Scrollable middle section */}
      <div className="flex-1 overflow-hidden">
        {/* Status Indicator - Only show when not matched */}
        {!isMatched && <StatusIndicator />}

        {/* Messages - Only show when matched */}
        {isMatched && <MessageList />}
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="flex-shrink-0">
        <MessageInput />
      </div>
    </div>
  );
}
