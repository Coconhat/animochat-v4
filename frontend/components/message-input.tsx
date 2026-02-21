"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useChat } from "@/components/chat-context";
import { Send, SkipForward, X, Search, Loader2 } from "lucide-react";

// ------------------------------------------
// Reply Preview Bar Component
// ------------------------------------------
function ReplyPreviewBar() {
  const { replyingTo, setReplyingTo } = useChat();

  if (!replyingTo) return null;

  return (
    <div className="border-t border-ani-border bg-white px-4 sm:px-6 py-2 animate-slide-up">
      <div className="max-w-3xl mx-auto flex items-center gap-3">
        {/* Left accent line */}
        <div className="w-1 h-10 bg-ani-green rounded-full flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-ani-green mb-0.5">
            Replying to {replyingTo.senderId === "me" ? "yourself" : "Stranger"}
          </div>
          <div className="text-sm text-ani-text/70 truncate">
            {replyingTo.content}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => setReplyingTo(null)}
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          aria-label="Cancel reply"
        >
          <X className="w-4 h-4 text-ani-muted" />
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------
// Main Message Input Component
// ------------------------------------------
export function MessageInput() {
  const [message, setMessage] = useState("");
  const [confirmSkip, setConfirmSkip] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    status,
    sendMessage,
    sendTyping,
    nextMatch,
    findMatch,
    replyingTo,
    setReplyingTo,
    partnerHasLeft,
  } = useChat();

  // ✅ Clean state booleans
  const isIdle = status === "idle";
  const isFinding = status === "finding";
  const isActive = status === "matched" && !partnerHasLeft;
  const isEnded = status === "matched" && partnerHasLeft;

  // Auto-focus input when replying
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  // Handle confirm skip timeout
  useEffect(() => {
    if (confirmSkip) {
      const timer = setTimeout(() => {
        setConfirmSkip(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmSkip]);

  const handleSkipClick = useCallback(() => {
    if (confirmSkip) {
      nextMatch();
      setConfirmSkip(false);
    } else {
      setConfirmSkip(true);
    }
  }, [confirmSkip, nextMatch]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Route the button click based on current state
      if (isIdle) return findMatch();
      if (isEnded) return nextMatch();
      if (isFinding) return; // Do nothing while loading

      // Normal send message flow
      if (!message.trim()) return;

      sendMessage(message);
      setMessage("");
      sendTyping(false);
      setReplyingTo(null);

      const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
      if (isTouchDevice) {
        inputRef.current?.blur();
      } else {
        inputRef.current?.focus();
      }
    },
    [
      isIdle,
      isEnded,
      isFinding,
      message,
      findMatch,
      nextMatch,
      sendMessage,
      sendTyping,
      setReplyingTo,
    ],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMessage(e.target.value);
      sendTyping(true);
    },
    [sendTyping],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
      if (e.key === "Escape" && replyingTo) {
        setReplyingTo(null);
      }
    },
    [handleSubmit, replyingTo, setReplyingTo],
  );

  return (
    <div className="border-t border-ani-border bg-white">
      {/* Only show reply bar if actively chatting */}
      {isActive && <ReplyPreviewBar />}

      {/* Smart Input Area */}
      <div className="px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 sm:gap-3 bg-white border border-ani-border shadow-card rounded-2xl px-3 sm:px-4 py-2 sm:py-3 transition-all duration-300"
          >
            {isActive && (
              <button
                type="button"
                onClick={handleSkipClick}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0 ${
                  confirmSkip
                    ? "bg-red-500 text-white shadow-md scale-105"
                    : "bg-ani-muted/10 text-ani-muted hover:bg-ani-muted/20 hover:text-ani-text"
                }`}
                title={confirmSkip ? "Are you sure?" : "Find new match"}
              >
                {confirmSkip ? (
                  <X className="w-5 h-5" />
                ) : (
                  <SkipForward className="w-5 h-5" />
                )}
              </button>
            )}

            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={!isActive}
              placeholder={
                isIdle
                  ? "Tap button to start a chat →"
                  : isFinding
                    ? "Searching for a stranger..."
                    : isEnded
                      ? "Chat ended. Tap button for next →"
                      : replyingTo
                        ? "Type your reply..."
                        : "Type a message..."
              }
              className={`flex-1 bg-transparent text-ani-text placeholder:text-ani-muted text-sm sm:text-base outline-none min-w-0 transition-opacity ${
                !isActive ? "opacity-60 cursor-not-allowed select-none" : ""
              }`}
              autoComplete="off"
            />

            {/* 3. Primary Action Button - Morphs based on state */}
            <button
              type="submit"
              disabled={isFinding || (isActive && !message.trim())}
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                isFinding
                  ? "bg-ani-muted/10 text-ani-muted cursor-not-allowed"
                  : isIdle || isEnded
                    ? "bg-gray-800 hover:bg-black text-white hover:scale-105 hover:shadow-lg"
                    : "bg-gradient-to-br from-ani-green to-ani-green-light text-white hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              }`}
            >
              {isIdle ? (
                <Search className="w-5 h-5" />
              ) : isFinding ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isEnded ? (
                <SkipForward className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>

            {/* 4. Right Next Button - Only show during active chat */}
            {isActive && (
              <button
                type="button"
                onClick={nextMatch}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-ani-muted/10 text-ani-muted flex items-center justify-center hover:bg-ani-muted/20 hover:text-ani-text transition-colors flex-shrink-0"
                title="Find new match"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
