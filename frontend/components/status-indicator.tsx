"use client";

import { useChat } from "@/components/chat-context";
import { Loader2, Users, AlertCircle } from "lucide-react";

export function StatusIndicator() {
  const { status, onlineCount, partnerHasLeft } = useChat();

  if (status === "finding") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 w-full transition-all duration-500">
        <div className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-br from-ani-green/20 to-ani-green/5 flex items-center justify-center mb-6 border border-ani-green/20 shadow-lg shadow-ani-green/5">
          <Loader2 className="w-12 h-12 text-ani-green animate-spin" />
          <div className="absolute inset-0 rounded-[2rem] border-2 border-ani-green/40 animate-pulse-ring" />
        </div>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-ani-text text-center mb-3 tracking-tight">
          Finding Match
        </h2>
        <p className="text-ani-muted text-center max-w-sm text-lg animate-pulse">
          Looking for someone to chat with...
        </p>
      </div>
    );
  }

  if (status === "matched") {
    if (partnerHasLeft) {
      return null;
    }

    return (
      <div className="flex flex-col items-center justify-center py-3 px-4 bg-gradient-to-b from-ani-green/10 to-transparent border-b border-ani-green/10">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="w-2.5 h-2.5 rounded-full bg-ani-green animate-pulse shadow-[0_0_8px_rgba(var(--ani-green),0.8)]" />
          <span className="text-xs font-bold text-ani-green tracking-widest uppercase">
            Connected
          </span>
        </div>
        <p className="text-xs text-ani-muted font-medium">
          You&apos;re chatting with a stranger
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 w-full transition-all duration-500">
        <div className="w-24 h-24 rounded-[2rem] bg-red-100 flex items-center justify-center mb-6 border border-red-200 shadow-lg shadow-red-500/10">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-ani-text text-center mb-3 tracking-tight">
          Oops!
        </h2>
        <p className="text-ani-muted text-center max-w-sm text-lg">
          Something went wrong. Please try again.
        </p>
      </div>
    );
  }

  return null;
}
