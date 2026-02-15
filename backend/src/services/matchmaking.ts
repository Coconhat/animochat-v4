import { v4 as uuidv4 } from "uuid";
import { Server, Socket } from "socket.io";
import { redisClient } from "../lib/redis";
import { getUser, saveUser, deleteRoom } from "./store";

// Multiple waiting rooms for distribution
const QUEUE_ROOMS = ["queue:room1", "queue:room2", "queue:room3"];
const MATCH_HISTORY_PREFIX = "match:history:";
const MATCH_COUNT_PREFIX = "match:count:";
const MATCH_HISTORY_EXPIRY = 60 * 60 * 3;
const MAX_RETRY_ATTEMPTS = 8;

interface MatchResult {
  matched: boolean;
  roomId?: string;
  partnerId?: string;
}

/**
 * Get a random queue room
 */
function getRandomQueue(): string {
  return QUEUE_ROOMS[Math.floor(Math.random() * QUEUE_ROOMS.length)];
}

/**
 * Get how many times two users have matched
 */
async function getMatchCount(
  userId: string,
  partnerId: string,
): Promise<number> {
  const key = `${MATCH_COUNT_PREFIX}${userId}:${partnerId}`;
  const count = await redisClient.get(key);
  return count ? parseInt(count) : 0;
}

/**
 * Calculate compatibility score based on match history
 * Returns a number between 0-100 (100 = perfect match, 0 = avoid)
 */
async function calculateCompatibility(
  userId: string,
  partnerId: string,
): Promise<number> {
  const matchCount = await getMatchCount(userId, partnerId);

  switch (matchCount) {
    case 0:
      return 100;
    case 1:
      return 60;
    case 2:
      return 30;
    case 3:
      return 15;
    default:
      return 5;
  }
}

/**
 * Decide if two users should match based on compatibility
 */
async function shouldMatch(
  userId: string,
  partnerId: string,
): Promise<boolean> {
  const compatibility = await calculateCompatibility(userId, partnerId);

  // Random roll against compatibility score
  const roll = Math.random() * 100;
  const shouldMatch = roll <= compatibility;

  console.log(
    `🎲 Compatibility: ${userId} + ${partnerId} = ${compatibility}% | Roll: ${roll.toFixed(1)} | Match: ${shouldMatch}`,
  );

  return shouldMatch;
}

/**
 * Record a match between two users
 */
async function recordMatch(userId: string, partnerId: string): Promise<void> {
  const key1 = `${MATCH_COUNT_PREFIX}${userId}:${partnerId}`;
  const key2 = `${MATCH_COUNT_PREFIX}${partnerId}:${userId}`;

  // Increment match count for both directions
  await Promise.all([
    redisClient.incr(key1),
    redisClient.incr(key2),
    redisClient.expire(key1, MATCH_HISTORY_EXPIRY),
    redisClient.expire(key2, MATCH_HISTORY_EXPIRY),
  ]);
}

/**
 * Check if a socket is alive
 */
function isSocketAlive(io: Server, socketId: string): boolean {
  const socket = io.sockets.sockets.get(socketId);
  return socket !== undefined && socket.connected;
}

/**
 * Clean up ghost user
 */
async function cleanupGhostUser(
  socketId: string,
  queueKey: string,
): Promise<void> {
  console.log(`👻 Cleaning up ghost user: ${socketId} from ${queueKey}`);
  await redisClient.sRem(queueKey, socketId);
}

/**
 * Try to find a partner from a specific queue
 */
async function tryQueue(
  io: Server,
  currentUserId: string,
  queueKey: string,
): Promise<string | null> {
  const candidateId = await redisClient.sPop(queueKey);

  if (!candidateId) return null; // Queue empty
  if (candidateId === currentUserId) return null; // Skip self

  // Check if candidate is alive
  if (!isSocketAlive(io, candidateId)) {
    await cleanupGhostUser(candidateId, queueKey);
    return null;
  }

  // Check compatibility with probability
  const compatible = await shouldMatch(currentUserId, candidateId);

  if (!compatible) {
    // Put them back in a DIFFERENT random queue to spread them out
    const newQueue = getRandomQueue();
    await redisClient.sAdd(newQueue, candidateId);
    console.log(`🔄 ${candidateId} moved to ${newQueue} (incompatible)`);
    return null;
  }

  // Compatible match!
  return candidateId;
}

/**
 * Find a compatible partner across all queues
 */
async function findCompatiblePartner(
  io: Server,
  currentUserId: string,
  attempts: number = 0,
): Promise<string | null> {
  if (attempts >= MAX_RETRY_ATTEMPTS) {
    console.log(`⚠️ Max retry attempts reached for ${currentUserId}`);
    return null;
  }

  // Try all queues in random order
  const shuffledQueues = [...QUEUE_ROOMS].sort(() => Math.random() - 0.5);

  for (const queueKey of shuffledQueues) {
    const partnerId = await tryQueue(io, currentUserId, queueKey);

    if (partnerId) {
      return partnerId; // Found a match!
    }
  }

  // No match found in any queue, try again
  return findCompatiblePartner(io, currentUserId, attempts + 1);
}

/**
 * Create a match between two users
 */
async function createMatch(
  io: Server,
  socket: Socket,
  partnerId: string,
): Promise<string> {
  const roomId = uuidv4();
  const partnerSocket = io.sockets.sockets.get(partnerId);

  if (!partnerSocket) {
    throw new Error("Partner socket not found");
  }

  // Join both sockets to room
  await socket.join(roomId);
  await partnerSocket.join(roomId);

  // Update user records
  await Promise.all([
    saveUser(socket.id, {
      userId: socket.id,
      socketId: socket.id,
      isBusy: true,
      currentRoomId: roomId,
      connectedAt: Date.now(),
    }),
    saveUser(partnerId, {
      userId: partnerId,
      socketId: partnerId,
      isBusy: true,
      currentRoomId: roomId,
      connectedAt: Date.now(),
    }),
  ]);

  // Record match history
  await recordMatch(socket.id, partnerId);

  console.log(`🎉 MATCH: ${socket.id} + ${partnerId} -> Room ${roomId}`);

  return roomId;
}

/**
 * Add user to a random queue after match ends
 */
async function addToRandomQueue(userId: string): Promise<string> {
  const queueKey = getRandomQueue();
  await redisClient.sAdd(queueKey, userId);
  console.log(`➕ ${userId} added to ${queueKey}`);
  return queueKey;
}

/**
 * Remove user from all queues
 */
async function removeFromAllQueues(userId: string): Promise<void> {
  await Promise.all(
    QUEUE_ROOMS.map((queue) => redisClient.sRem(queue, userId)),
  );
}

/**
 * Main matchmaking function
 */
export async function findMatch(
  socket: Socket,
  io: Server,
): Promise<MatchResult> {
  const userId = socket.id;

  console.log(`🔎 ${userId} is looking for a match...`);

  // Remove from all queues first
  await removeFromAllQueues(userId);

  // Mark as searching
  await saveUser(userId, {
    userId,
    socketId: userId,
    isBusy: false,
    connectedAt: Date.now(),
  });

  try {
    // Try to find a compatible partner
    const partnerId = await findCompatiblePartner(io, userId);

    if (partnerId) {
      // Match found!
      const roomId = await createMatch(io, socket, partnerId);

      // Notify both users
      io.to(roomId).emit("match:success", {
        roomId,
        partnerId: "Stranger",
      });

      return { matched: true, roomId, partnerId };
    } else {
      // No match found - add to random queue
      const queueKey = await addToRandomQueue(userId);
      console.log(`⏳ ${userId} waiting in ${queueKey}...`);

      socket.emit("match:waiting");

      return { matched: false };
    }
  } catch (error) {
    console.error(`❌ Error in matchmaking for ${userId}:`, error);
    await addToRandomQueue(userId);
    throw error;
  }
}

/**
 * Handle user leaving a match
 * Put both users in DIFFERENT random queues to avoid immediate re-match
 */
export async function handleLeaveMatch(
  socket: Socket,
  io: Server,
): Promise<void> {
  const user = await getUser(socket.id);

  if (user?.currentRoomId) {
    const roomId = user.currentRoomId;

    // Notify partner
    socket.to(roomId).emit("partner:left");

    // Leave room
    socket.leave(roomId);

    // Get partner and put them in a different queue
    const socketsInRoom = await io.in(roomId).fetchSockets();
    for (const partnerSocket of socketsInRoom) {
      if (partnerSocket.id !== socket.id) {
        await saveUser(partnerSocket.id, {
          userId: partnerSocket.id,
          socketId: partnerSocket.id,
          isBusy: false,
          currentRoomId: undefined,
          connectedAt: Date.now(),
        });
        // Don't auto-add partner to queue - let them manually search again
      }
    }

    // Clean up room
    await deleteRoom(roomId);

    // Update current user
    await saveUser(socket.id, {
      userId: socket.id,
      socketId: socket.id,
      isBusy: false,
      currentRoomId: undefined,
      connectedAt: Date.now(),
    });

    console.log(`👋 ${socket.id} left room ${roomId}`);
  }
}

/**
 * Handle disconnect
 */
export async function handleDisconnect(
  socket: Socket,
  io: Server,
): Promise<void> {
  const userId = socket.id;

  // Remove from all queues
  await removeFromAllQueues(userId);

  // Handle room cleanup
  await handleLeaveMatch(socket, io);

  console.log(`👋 Disconnected: ${userId}`);
}

/**
 * Periodic cleanup of ghost users
 */
export async function cleanupGhostUsers(io: Server): Promise<void> {
  for (const queueKey of QUEUE_ROOMS) {
    const members = await redisClient.sMembers(queueKey);

    for (const socketId of members) {
      if (!isSocketAlive(io, socketId)) {
        await cleanupGhostUser(socketId, queueKey);
      }
    }

    const count = await redisClient.sCard(queueKey);
    console.log(`🧹 ${queueKey}: ${count} users`);
  }
}

/**
 * Get queue stats (useful for debugging/admin)
 */
export async function getQueueStats(): Promise<Record<string, number>> {
  const stats: Record<string, number> = {};

  for (const queueKey of QUEUE_ROOMS) {
    stats[queueKey] = await redisClient.sCard(queueKey);
  }

  return stats;
}
