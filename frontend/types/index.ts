// AniMoChat Types

export interface User {
  id: string;
  socketId: string;
  joinedAt: number;
  lastActive: number;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  type: 'text' | 'system' | 'typing';
}

export interface ChatRoom {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: number;
  messages: Message[];
}

export type ConnectionStatus = 
  | 'idle' 
  | 'connecting' 
  | 'finding' 
  | 'matched' 
  | 'disconnected' 
  | 'error';

export interface MatchState {
  status: ConnectionStatus;
  partnerId: string | null;
  roomId: string | null;
  partnerLastSeen?: number;
}

export interface TypingState {
  isTyping: boolean;
  lastTyped: number;
}

// Socket Events
export interface ServerToClientEvents {
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'matched': (data: { roomId: string; partnerId: string }) => void;
  'message': (message: Message) => void;
  'partner-typing': (data: { isTyping: boolean }) => void;
  'partner-disconnected': () => void;
  'waiting': () => void;
  'error': (error: { message: string }) => void;
  'online-count': (count: number) => void;
}

export interface ClientToServerEvents {
  'find-match': () => void;
  'cancel-match': () => void;
  'next-match': () => void;
  'send-message': (content: string) => void;
  'typing': (isTyping: boolean) => void;
  'leave-room': () => void;
}
