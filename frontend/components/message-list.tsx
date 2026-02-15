"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@/components/chat-context";
import { Shield, Sparkles, Reply } from "lucide-react";
import type { Message } from "@/types";

// Utility for clean class merging
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// ------------------------------------------
// 1. Swipeable Message Bubble Wrapper
// ------------------------------------------
function SwipeableMessage({
  message,
  isOwn,
  isFirst,
  isLast,
  children,
}: {
  message: Message;
  isOwn: boolean;
  isFirst: boolean;
  isLast: boolean;
  children: React.ReactNode;
}) {
  const { setReplyingTo } = useChat();

  // Touch State
  const [dragX, setDragX] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const isDragging = useRef(false);
  const threshold = 50; // Pixels to trigger reply

  // --- Touch Handlers (Mobile) ---
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    isDragging.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current || !isDragging.current) return;

    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - touchStartX.current;

    // Only allow dragging to the right (positive diff) and clamp it
    if (diff > 0 && diff < 100) {
      setDragX(diff);
    }
  };

  const onTouchEnd = () => {
    if (dragX > threshold) {
      // Trigger Reply
      setReplyingTo(message);
      // Haptic feedback if available
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
    // Reset
    setDragX(0);
    touchStartX.current = null;
    isDragging.current = false;
  };

  // --- Render ---
  return (
    <div
      className="relative group w-fit"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Reply Icon Indicator (Mobile Swipe) */}
      <div
        className="absolute left-[-40px] top-1/2 -translate-y-1/2 flex items-center justify-center transition-opacity duration-200"
        style={{
          opacity: dragX > 20 ? 1 : 0,
          transform: `translateX(${dragX > threshold ? 10 : 0}px)`,
        }}
      >
        <div className="bg-ani-muted/20 p-1.5 rounded-full">
          <Reply className="w-4 h-4 text-ani-muted" />
        </div>
      </div>

      {/* Reply Button (Desktop Hover) */}
      <div
        className={cn(
          "absolute top-1/2 -translate-y-1/2 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer p-2",
          isOwn ? "left-[-40px]" : "right-[-40px]",
        )}
        onClick={() => setReplyingTo(message)}
        title="Reply"
      >
        <Reply className="w-4 h-4 text-ani-muted hover:text-ani-text transition-colors" />
      </div>

      {/* The Actual Bubble content, moved by drag */}
      <div
        className="transition-transform duration-200 ease-out will-change-transform"
        style={{ transform: `translateX(${dragX}px)` }}
      >
        {children}
      </div>
    </div>
  );
}

// ------------------------------------------
// 2. Message Group Component
// ------------------------------------------
function MessageGroup({
  messages,
  isOwn,
}: {
  messages: Message[];
  isOwn: boolean;
}) {
  const showAvatar = !isOwn;

  return (
    <div
      className={cn(
        "flex w-full mb-4 animate-slide-up",
        isOwn ? "justify-end" : "justify-start",
      )}
    >
      {/* Partner Avatar */}
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
          isOwn ? "items-end" : "items-start",
        )}
      >
        {messages.map((msg, index) => {
          const isFirst = index === 0;
          const isLast = index === messages.length - 1;

          return (
            <div key={msg.id} className="mb-1">
              <SwipeableMessage
                message={msg}
                isOwn={isOwn}
                isFirst={isFirst}
                isLast={isLast}
              >
                <div
                  className={cn(
                    "px-5 py-3 text-sm sm:text-base leading-relaxed shadow-sm break-words transition-all relative",
                    // Colors
                    isOwn
                      ? "bg-gradient-to-br from-ani-green to-ani-green-light text-white"
                      : "bg-white border border-ani-border text-ani-text",
                    // Shapes
                    "rounded-2xl",
                    isOwn && !isFirst && "rounded-tr-md",
                    isOwn && !isLast && "rounded-br-md",
                    !isOwn && !isFirst && "rounded-tl-md",
                    !isOwn && !isLast && "rounded-bl-md",
                    isOwn && isLast && "rounded-br-sm",
                    !isOwn && isLast && "rounded-bl-sm",
                  )}
                >
                  {/* --- RENDER QUOTED REPLY IF EXISTS --- */}
                  {msg.replyTo && (
                    <div
                      className={cn(
                        "mb-2 text-xs p-2 rounded-md bg-black/10 border-l-2",
                        isOwn
                          ? "border-white/50 text-white/90"
                          : "border-ani-green/50 text-ani-text/80 bg-ani-bg",
                      )}
                    >
                      <div className="font-bold opacity-70 mb-0.5">
                        {msg.replyTo.senderId === "me" ? "You" : "Stranger"}
                      </div>
                      <div className="truncate opacity-90">
                        {msg.replyTo.content}
                      </div>
                    </div>
                  )}

                  {msg.content}
                </div>
              </SwipeableMessage>
            </div>
          );
        })}

        {/* Timestamp */}
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
// 3. System Message Component (Unchanged)
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
// 4. Typing Indicator (Unchanged)
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
// 5. Main List Component
// ------------------------------------------
export function MessageList() {
  const { messages, isPartnerTyping } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isPartnerTyping]);

  const groupedMessages = messages.reduce(
    (acc, msg) => {
      const lastGroup = acc[acc.length - 1];
      if (msg.type === "system") {
        acc.push({
          type: "system",
          messages: [msg],
          id: msg.id,
          senderId: "system",
        });
        return acc;
      }
      if (
        lastGroup &&
        lastGroup.type !== "system" &&
        lastGroup.senderId === msg.senderId
      ) {
        lastGroup.messages.push(msg);
      } else {
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
      className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-hide overflow-x-hidden"
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
