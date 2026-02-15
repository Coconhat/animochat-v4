import { redisClient } from "../lib/redis";
import { User, Room } from "../types";

const USER_PREFIX = "user:";
const ROOM_PREFIX = "room:";
const QUEUE_KEY = "queue:waiting";
const HISTORY_PREFIX = "history:";

const HISTORY_TTL = 60 * 60; // 1 hour

// --- User Operations ---

export const saveUser = async (socketId: string, userData: Partial<User>) => {
  const key = `${USER_PREFIX}${socketId}`;

  // FIX: Redis only accepts strings. We must convert Booleans/Numbers to Strings.
  const processedData: Record<string, string> = {};

  Object.entries(userData).forEach(([field, value]) => {
    // Convert boolean/number to string safely
    processedData[field] = String(value);
  });

  // Now we pass an object of strings, which is valid for hSet
  await redisClient.hSet(key, processedData);
  await redisClient.expire(key, 86400); // Cleanup after 24h
};

export const getUser = async (socketId: string): Promise<User | null> => {
  const data = await redisClient.hGetAll(`${USER_PREFIX}${socketId}`);
  if (!data || Object.keys(data).length === 0) return null;

  return {
    userId: data.userId,
    socketId: data.socketId,
    // Convert back from String to Boolean/Number
    isBusy: data.isBusy === "true",
    currentRoomId:
      data.currentRoomId === "null" ? null : data.currentRoomId || null,
    connectedAt: parseInt(data.connectedAt || "0"),
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

// --- History Operations ---

export const addMatchHistory = async (
  userSocket: string,
  partnerSocket: string,
) => {
  const key = `${HISTORY_PREFIX}${userSocket}`;
  await redisClient.sAdd(key, partnerSocket);
  await redisClient.expire(key, HISTORY_TTL);
};

export const hasMatchedRecently = async (
  userSocket: string,
  partnerSocket: string,
): Promise<boolean> => {
  // redisClient.sIsMember returns 1 (true) or 0 (false), so convert to boolean
  const result = await redisClient.sIsMember(
    `${HISTORY_PREFIX}${userSocket}`,
    partnerSocket,
  );
  return result === 1;
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
  // JSON.stringify handles the conversion for .set(), so this was already fine
  await redisClient.set(key, JSON.stringify(room));

  // Update users to be busy
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
