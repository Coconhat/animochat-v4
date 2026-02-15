export interface User {
  userId: string;
  socketId: string;
  isBusy: boolean;
  currentRoomId: string | null;
  connectedAt: number;
}

export interface Room {
  roomId: string;
  participants: string[]; // Array of socketIds
  createdAt: number;
}
