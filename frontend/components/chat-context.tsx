"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { io, Socket } from "socket.io-client";
import type { Message, ConnectionStatus } from "@/types";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ChatContextType {
  status: ConnectionStatus;
  isConnected: boolean;
  roomId: string | null;
  partnerId: string | null;
  messages: Message[];
  isPartnerTyping: boolean;
  onlineCount: number;
  replyingTo: Message | null;
  SetReplyingTo: (msg: Message | null) => void;
  connect: () => void;
  disconnect: () => void;
  findMatch: () => void;
  cancelMatch: () => void;
  nextMatch: () => void;
  sendMessage: (content: string) => void;
  sendTyping: (isTyping: boolean) => void;
  leaveRoom: () => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Track if we need to search immediately after connecting
  const shouldSearchOnConnect = useRef(false);

  useEffect(() => {
    // Initialize Socket
    const socket = io(BACKEND_URL, {
      autoConnect: false,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("✅ Connected to ID:", socket.id);
      setIsConnected(true);

      // If we clicked "Find Match" while disconnected, do it now
      if (shouldSearchOnConnect.current) {
        socket.emit("match:find");
        shouldSearchOnConnect.current = false;
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected");
      setIsConnected(false);
      setStatus("disconnected");
    });

    socket.on("match:success", (data) => {
      console.log("🤝 Match found:", data);
      setRoomId(data.roomId);
      setStatus("matched");
      setMessages([]);
      setIsPartnerTyping(false);
      setReplyingTo(null);
    });

    socket.on("message:receive", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("partner:typing", ({ isTyping }) => {
      setIsPartnerTyping(isTyping);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, []);

  const findMatch = useCallback(() => {
    setStatus("finding");
    setMessages([]);

    if (socketRef.current?.connected) {
      socketRef.current.emit("match:find");
    } else {
      // Mark flag to search once connected
      shouldSearchOnConnect.current = true;
      socketRef.current?.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    setStatus("disconnected");
    setRoomId(null);
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit("match:skip");
    setMessages([]);
    setStatus("idle");
  }, []);

  const nextMatch = useCallback(() => {
    leaveRoom();
    // Wait a tiny bit for server to process leave, then search
    setTimeout(() => findMatch(), 100);
  }, [leaveRoom, findMatch]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!roomId || !content.trim()) return;

      const msg: Message = {
        id: Date.now().toString(),
        senderId: "me",
        content: content.trim(),
        timestamp: Date.now(),
        type: "text",
        replyTo: replyingTo
          ? {
              id: replyingTo.id,
              content: replyingTo.content,
              senderId: replyingTo.senderId,
            }
          : undefined,
      };
      setMessages((prev) => [...prev, msg]);

      socketRef.current?.emit("message:send", {
        roomId,
        content,
        replyTo: replyingTo,
      });
      setReplyingTo(null);
    },
    [roomId, replyingTo],
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!roomId) return;
      socketRef.current?.emit("user:typing", { roomId, isTyping });
    },
    [roomId],
  );

  // Placeholder values
  const value = {
    status,
    isConnected,
    roomId,
    partnerId: "Stranger",
    messages,
    isPartnerTyping,
    onlineCount: 0, // Implement later
    replyingTo,
    setReplyingTo,
    connect,
    disconnect,
    findMatch,
    cancelMatch: leaveRoom,
    nextMatch,
    sendMessage,
    sendTyping,
    leaveRoom,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat error");
  return context;
}
