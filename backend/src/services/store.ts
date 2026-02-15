import { redisClient } from "../lib/redis";
import { User, Room } from "../types";

const USER_PREFIX = "user:";
const ROOM_PREFIX = "room:";
const QUEUE_KEY = "queue:waiting";
const HISTORY_PREFIX = "history:"; // For preventing repeats

const HISTORY_TTL = 60 * 60; // Remember matches for 1 hour

// --- User Operations ---

export const saveUser = async (socketId: string, userData: Partial<User>) => {
  const key = `${USER_PREFIX}${socketId}`;
  // Store flat object in Redis hash
  await redisClient.hSet(key, Object.entries(userData).flat() as any);
  await redisClient.expire(key, 86400); // Cleanup after 24h if stuck
};

export const getUser = async (socketId: string): Promise<User | null> => {
  const data = await redisClient.hGetAll(`${USER_PREFIX}${socketId}`);
  if (!data || Object.keys(data).length === 0) return null;

  return {
    userId: data.userId,
    socketId: data.socketId,
    isBusy: data.isBusy === "true",
    currentRoomId: data.currentRoomId || null,
    connectedAt: parseInt(data.connectedAt),
  };
};

export const removeUser = async (socketId: string) => {
  await redisClient.del(`${USER_PREFIX}${socketId}`);
  await removeFromQueue(socketId);
};

// --- Queue Operations ---

export const addToQueue = async (socketId: string) => {
  await redisClient.sAdd(QUEUE_KEY, socketId);
};

export const removeFromQueue = async (socketId: string) => {
  await redisClient.sRem(QUEUE_KEY, socketId);
};

// --- History Operations (The Scoring System) ---

export const addMatchHistory = async (
  userSocket: string,
  partnerSocket: string,
) => {
  // We track who you matched with to avoid them for a while
  const key = `${HISTORY_PREFIX}${userSocket}`;
  await redisClient.sAdd(key, partnerSocket);
  await redisClient.expire(key, HISTORY_TTL);
};

export const hasMatchedRecently = async (
  userSocket: string,
  partnerSocket: string,
): Promise<boolean> => {
  return await redisClient.sIsMember(
    `${HISTORY_PREFIX}${userSocket}`,
    partnerSocket,
  );
};

// --- Room Operations ---

export const createRoom = async (
  roomId: string,
  socketId1: string,
  socketId2: string,
) => {
  const room: Room = {
    roomId,
    participants: [socketId1, socketId2],
    createdAt: Date.now(),
  };

  const key = `${ROOM_PREFIX}${roomId}`;
  await redisClient.set(key, JSON.stringify(room));

  // Mark users as busy
  await saveUser(socketId1, { currentRoomId: roomId, isBusy: true });
  await saveUser(socketId2, { currentRoomId: roomId, isBusy: true });
};

export const getRoom = async (roomId: string): Promise<Room | null> => {
  const data = await redisClient.get(`${ROOM_PREFIX}${roomId}`);
  return data ? JSON.parse(data) : null;
};

export const deleteRoom = async (roomId: string) => {
  await redisClient.del(`${ROOM_PREFIX}${roomId}`);
};
