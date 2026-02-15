import { v4 as uuidv4 } from "uuid";
import { redisClient } from "../lib/redis";
import {
  addToQueue,
  removeFromQueue,
  getUser,
  createRoom,
  addMatchHistory,
  hasMatchedRecently,
} from "./store";
import { Server } from "socket.io";

const QUEUE_KEY = "queue:waiting";

/**
 * The Matchmaking Loop
 * 1. User joins queue.
 * 2. We try to pop a RANDOM partner from the queue using SPOP.
 * 3. We check if they are compatible (history check).
 * 4. If compatible -> Match.
 * 5. If not -> Push partner back to queue, try again.
 */
export const findMatch = async (socketId: string, io: Server) => {
  const currentUser = await getUser(socketId);
  if (!currentUser) return;

  // 1. Try to get a candidate from the queue (Atomic operation)
  // We pop the candidate so no one else can grab them while we inspect
  const candidateSocketId = await redisClient.sPop(QUEUE_KEY);

  // 2. Case: Queue is empty
  if (!candidateSocketId) {
    await addToQueue(socketId);
    io.to(socketId).emit("match:waiting");
    return;
  }

  // 3. Case: We popped ourselves (rare race condition or leftover)
  if (candidateSocketId === socketId) {
    await addToQueue(socketId);
    return;
  }

  // 4. Case: History Check (Avoid repetitive matches)
  const matchedBefore = await hasMatchedRecently(socketId, candidateSocketId);
  const partnerMatchedBefore = await hasMatchedRecently(
    candidateSocketId,
    socketId,
  );

  if (matchedBefore || partnerMatchedBefore) {
    // Bad match. Put the candidate back in the pool and put yourself in pool.
    // Note: This puts them back at the "end" essentially.
    await addToQueue(candidateSocketId);

    // Recursive retry?
    // Careful with stack overflow. Better to just wait or try one more time.
    // For simplicity: put self in queue and wait for someone else to pick us.
    await addToQueue(socketId);
    return;
  }

  // 5. VALID MATCH FOUND!
  const roomId = uuidv4();

  // Create room in DB
  await createRoom(roomId, socketId, candidateSocketId);

  // Update History
  await addMatchHistory(socketId, candidateSocketId);
  await addMatchHistory(candidateSocketId, socketId);

  // Socket.IO Join (Remote join works thanks to Redis Adapter)
  const socket1 = io.sockets.sockets.get(socketId);
  const socket2 = io.sockets.sockets.get(candidateSocketId);

  // Note: With horizontal scaling, one socket might be on a different server.
  // The Adapter handles 'io.in(socketId).socketsJoin(roomId)' automatically across nodes.
  await io.in([socketId, candidateSocketId]).socketsJoin(roomId);

  // Notify clients
  io.to(roomId).emit("match:success", {
    roomId,
    partnerId: "stranger", // Keep it anon
  });
};
