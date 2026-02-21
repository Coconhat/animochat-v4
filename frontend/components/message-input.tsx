"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useChat } from "@/components/chat-context";
import { Send, Mic, Smile, SkipForward, X } from "lucide-react";

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
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    status,
    sendMessage,
    sendTyping,
    nextMatch,
    findMatch,
    replyingTo,
    setReplyingTo,
  } = useChat();

  const isMatched = status === "matched";
  const isFinding = status === "finding";

  // Auto-focus input when replying
  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyingTo]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!message.trim()) return;

      sendMessage(message);
      setMessage("");
      sendTyping(false);
      setReplyingTo(null); // Clear reply after sending

      // Check if the user is on mobile or pc
      const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

      if (isTouchDevice) {
        // On mobile, blur the input to hide the keyboard after sending
        inputRef.current?.blur();
      } else {
        // On desktop, keep the input focused for faster typing
        inputRef.current?.focus();
      }
    },
    [message, sendMessage, sendTyping, setReplyingTo],
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
        handleSubmit(e);
      }
      // ESC to cancel reply
      if (e.key === "Escape" && replyingTo) {
        setReplyingTo(null);
      }
    },
    [handleSubmit, replyingTo, setReplyingTo],
  );

  // Find Match Button (when not matched)
  if (!isMatched && !isFinding) {
    return (
      <div className="border-t border-ani-border bg-white">
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
      </div>
    );
  }

  // Finding Match State
  if (isFinding) {
    return (
      <div className="border-t border-ani-border bg-white">
        <div className="px-4 sm:px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="w-full bg-white border border-ani-border rounded-2xl py-4 px-6 flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-ani-green border-t-transparent rounded-full animate-spin" />
              <span className="text-ani-muted font-medium">
                Finding someone to chat with...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Matched State - Show Input
  return (
    <div className="border-t border-ani-border bg-white">
      {/* Reply Preview Bar */}
      <ReplyPreviewBar />

      {/* Input Area */}
      <div className="px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 sm:gap-3 bg-white border border-ani-border shadow-card rounded-2xl px-3 sm:px-4 py-2 sm:py-3"
          >
            {/* Emoji Button */}
            <button
              type="button"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-ani-muted hover:bg-ani-bg hover:text-ani-text transition-colors flex-shrink-0"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Voice Button */}
            <button
              type="button"
              onClick={() => setIsRecording(!isRecording)}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
                isRecording
                  ? "bg-red-100 text-red-500"
                  : "text-ani-muted hover:bg-ani-bg hover:text-ani-text"
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
              placeholder={
                replyingTo ? "Type your reply..." : "Type a message..."
              }
              className="flex-1 bg-transparent text-ani-text placeholder:text-ani-muted text-sm sm:text-base outline-none min-w-0"
              autoComplete="off"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!message.trim()}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-ani-green to-ani-green-light text-white flex items-center justify-center hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>

            {/* Next Button */}
            <button
              type="button"
              onClick={nextMatch}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-ani-muted/10 text-ani-muted flex items-center justify-center hover:bg-ani-muted/20 hover:text-ani-text transition-colors flex-shrink-0"
              title="Find new match"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
