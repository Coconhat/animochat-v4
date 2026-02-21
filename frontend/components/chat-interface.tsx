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
    <div className="flex flex-col h-dvh w-full bg-ani-bg overflow-hidden">
      <div className="shrink-0 z-10">
        <ChatHeader />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden relative z-0">
        {!isMatched && <StatusIndicator />}

        {/* Messages - Only show when matched */}
        {isMatched && <MessageList />}
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="shrink-0 z-10 bg-white">
        <MessageInput />
      </div>
    </div>
  );
}
