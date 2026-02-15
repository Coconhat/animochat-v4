// lib/redis.ts
import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const pubClient = createClient({ url: REDIS_URL });
export const subClient = pubClient.duplicate();
export const redisClient = pubClient.duplicate(); // <--- Make sure you export this!

export async function initRedis() {
  await Promise.all([
    pubClient.connect(),
    subClient.connect(),
    redisClient.connect(),
  ]);
  console.log("✅ Redis Connected");
}
