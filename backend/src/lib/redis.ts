import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// 1. Main Client for Data (Users, Rooms, Queue)
export const redisClient = createClient({ url: REDIS_URL });

// 2. Pub/Sub Clients for Socket.IO Adapter
export const pubClient = createClient({ url: REDIS_URL });
export const subClient = pubClient.duplicate();

redisClient.on("error", (err) => console.error("Redis Client Error", err));

export const initRedis = async () => {
  await Promise.all([
    redisClient.connect(),
    pubClient.connect(),
    subClient.connect(),
  ]);
  console.log("✅ Redis connected (Data & Pub/Sub)");
};
