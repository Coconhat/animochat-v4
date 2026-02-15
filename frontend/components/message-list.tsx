"use client";

import { useRef, useEffect } from "react";
import { useChat } from "@/components/chat-context";
import { Shield, Sparkles } from "lucide-react";
import type { Message } from "@/types";

// Utility for clean class merging
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// ------------------------------------------
// 1. Message Group Component
// ------------------------------------------
function MessageGroup({
  messages,
  isOwn,
}: {
  messages: Message[];
  isOwn: boolean;
}) {
  // Only show avatar for the partner
  const showAvatar = !isOwn;

  return (
    <div
      className={cn(
        "flex w-full mb-4 animate-slide-up",
        isOwn ? "justify-end" : "justify-start", // <--- RESTORED LEFT/RIGHT
      )}
    >
      {/* Partner Avatar (Left Side, Bottom Aligned) */}
      {showAvatar && (
        <div className="flex flex-col justify-end mr-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ani-muted to-ani-text flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Messages Column */}
      <div
        className={cn(
          "flex flex-col max-w-[80%] sm:max-w-[70%]",
          isOwn ? "items-end" : "items-start", // <--- ALIGN TEXT TO CORRECT SIDE
        )}
      >
        {messages.map((msg, index) => {
          const isFirst = index === 0;
          const isLast = index === messages.length - 1;

          return (
            <div key={msg.id} className="group relative mb-1 w-fit">
              {/* Bubble */}
              <div
                className={cn(
                  "px-5 py-3 text-sm sm:text-base leading-relaxed shadow-sm break-words transition-all",
                  // Color & Base Shape
                  isOwn
                    ? "bg-gradient-to-br from-ani-green to-ani-green-light text-white"
                    : "bg-white border border-ani-border text-ani-text",

                  // Dynamic Border Radius (Squircle Logic)
                  "rounded-2xl",

                  // 1. Fix the corners where messages stack
                  isOwn && !isFirst && "rounded-tr-md", // Right side stacking
                  isOwn && !isLast && "rounded-br-md",

                  !isOwn && !isFirst && "rounded-tl-md", // Left side stacking
                  !isOwn && !isLast && "rounded-bl-md",

                  // 2. Give the "Tail" to the very last message
                  isOwn && isLast && "rounded-br-sm",
                  !isOwn && isLast && "rounded-bl-sm",
                )}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {/* Timestamp - ONLY SHOW ONCE AT THE BOTTOM OF THE GROUP */}
        <div
          className={cn(
            "text-[10px] text-ani-muted mt-1 opacity-70",
            isOwn ? "text-right" : "text-left",
          )}
        >
          {new Date(messages[messages.length - 1].timestamp).toLocaleTimeString(
            [],
            { hour: "2-digit", minute: "2-digit" },
          )}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------
// 2. System Message Component
// ------------------------------------------
function SystemMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-center my-6 animate-fade-in">
      <div className="flex items-center gap-2 px-4 py-1.5 bg-ani-bg border border-ani-border rounded-full shadow-sm">
        <Shield className="w-3 h-3 text-ani-muted" />
        <span className="text-xs font-medium text-ani-muted uppercase tracking-wide">
          {content}
        </span>
      </div>
    </div>
  );
}

// ------------------------------------------
// 3. Typing Indicator
// ------------------------------------------
function TypingIndicator() {
  return (
    <div className="flex justify-start mb-6 animate-pulse pl-11">
      <div className="bg-white border border-ani-border px-4 py-4 rounded-2xl rounded-bl-sm shadow-sm">
        <div className="flex gap-1.5 items-center h-full">
          <div className="w-1.5 h-1.5 bg-ani-muted rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-1.5 h-1.5 bg-ani-muted rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-1.5 h-1.5 bg-ani-muted rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------
// 4. Main List Component
// ------------------------------------------
export function MessageList() {
  const { messages, isPartnerTyping } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isPartnerTyping]);

  // --- Grouping Logic ---
  const groupedMessages = messages.reduce(
    (acc, msg) => {
      const lastGroup = acc[acc.length - 1];

      // System messages are always their own group
      if (msg.type === "system") {
        acc.push({
          type: "system",
          messages: [msg],
          id: msg.id,
          senderId: "system",
        });
        return acc;
      }

      // If previous group exists AND is the same sender, add to it
      if (
        lastGroup &&
        lastGroup.type !== "system" &&
        lastGroup.senderId === msg.senderId
      ) {
        lastGroup.messages.push(msg);
      } else {
        // Create new group
        acc.push({
          type: "user",
          senderId: msg.senderId,
          messages: [msg],
          id: msg.id,
        });
      }
      return acc;
    },
    [] as Array<{
      type: "user" | "system";
      senderId: string;
      messages: Message[];
      id: string;
    }>,
  );

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-hide"
    >
      <div className="max-w-3xl mx-auto min-h-full flex flex-col justify-end">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <div className="w-16 h-16 bg-ani-muted/10 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-ani-muted" />
            </div>
            <p className="text-ani-muted font-medium">
              Say hello to break the ice!
            </p>
          </div>
        ) : (
          <>
            {groupedMessages.map((group) => {
              if (group.type === "system") {
                return (
                  <SystemMessage
                    key={group.id}
                    content={group.messages[0].content}
                  />
                );
              }

              const isOwn = group.senderId === "me";

              return (
                <MessageGroup
                  key={group.id}
                  messages={group.messages}
                  isOwn={isOwn}
                />
              );
            })}

            {isPartnerTyping && <TypingIndicator />}
          </>
        )}
      </div>
    </div>
  );
}
