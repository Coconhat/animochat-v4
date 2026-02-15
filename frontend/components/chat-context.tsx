"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { io, Socket } from "socket.io-client"; // Import Socket.IO
import type { Message, ConnectionStatus } from "@/types";

// ============================================
// CONFIGURATION
// ============================================
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ChatContextType {
  status: ConnectionStatus;
  isConnected: boolean;
  roomId: string | null;
  partnerId: string | null;
  messages: Message[];
  isPartnerTyping: boolean;
  onlineCount: number;
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
  // --- State ---
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  // --- Refs ---
  const socketRef = useRef<Socket | null>(null);

  // --- Initialize Socket ---
  useEffect(() => {
    // 1. Initialize connection
    const socket = io(BACKEND_URL, {
      autoConnect: false,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // 2. Setup Event Listeners
    socket.on("connect", () => {
      console.log("Connected to backend:", socket.id);
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from backend");
      setIsConnected(false);
      setStatus("disconnected");
    });

    socket.on("stats:update", (data: { onlineUsers: number }) => {
      setOnlineCount(data.onlineUsers);
    });

    // Match found
    socket.on(
      "match:success",
      (data: { roomId: string; partnerId: string }) => {
        console.log("Match found!", data);
        setRoomId(data.roomId);
        setPartnerId(data.partnerId);
        setStatus("matched");
        setMessages([]); // Clear previous messages
        setIsPartnerTyping(false);
      },
    );

    // Receive message
    socket.on("message:receive", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Partner typing
    socket.on("partner:typing", (data: { isTyping: boolean }) => {
      setIsPartnerTyping(data.isTyping);
    });

    // Partner left
    socket.on("partner:left", () => {
      setStatus("idle");
      setRoomId(null);
      setPartnerId(null);
      // Optional: Add a system message saying partner left
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          senderId: "system",
          content: "Partner has disconnected.",
          timestamp: Date.now(),
          type: "system",
        },
      ]);
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, []);

  // --- Actions ---

  const connect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    setStatus("disconnected");
  }, []);

  const findMatch = useCallback(() => {
    if (!socketRef.current) return;

    // Ensure we are connected first
    if (!socketRef.current.connected) {
      socketRef.current.connect();
    }

    setStatus("finding");
    setMessages([]);
    socketRef.current.emit("match:find");
  }, []);

  const cancelMatch = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit("match:cancel");
    setStatus("idle");
  }, []);

  const leaveRoom = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit("room:leave");
    setRoomId(null);
    setPartnerId(null);
    setMessages([]);
    setStatus("idle");
  }, []);

  const nextMatch = useCallback(() => {
    leaveRoom();
    // Small delay to ensure state creates cleanly, then search again
    setTimeout(() => findMatch(), 100);
  }, [leaveRoom, findMatch]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!socketRef.current || !roomId || !content.trim()) return;

      // Optimistic update: Show message immediately
      const tempMessage: Message = {
        id: Date.now().toString(), // Temporary ID
        senderId: socketRef.current.id || "me",
        content: content.trim(),
        timestamp: Date.now(),
        type: "text",
      };

      setMessages((prev) => [...prev, tempMessage]);

      // Send to backend
      socketRef.current.emit("message:send", { roomId, content });
    },
    [roomId],
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!socketRef.current || !roomId) return;
      socketRef.current.emit("user:typing", { roomId, isTyping });
    },
    [roomId],
  );

  const value: ChatContextType = {
    status,
    isConnected,
    roomId,
    partnerId,
    messages,
    isPartnerTyping,
    onlineCount,
    connect,
    disconnect,
    findMatch,
    cancelMatch,
    nextMatch,
    sendMessage,
    sendTyping,
    leaveRoom,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
