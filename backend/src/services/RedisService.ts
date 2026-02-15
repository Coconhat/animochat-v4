import { createClient, RedisClientType } from 'redis';
import { User, Room, Message, RedisKeys } from '../types';

export class RedisService {
  private client: RedisClientType;
  private static instance: RedisService;

  private constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  public async connect(): Promise<void> {
    await this.client.connect();
    console.log('Connected to Redis');
  }

  public async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  // User Operations
  public async setUser(user: User): Promise<void> {
    const key = RedisKeys.user(user.id);
    await this.client.hSet(key, {
      id: user.id,
      socketId: user.socketId,
      joinedAt: user.joinedAt.toString(),
      lastActive: user.lastActive.toString(),
      currentRoomId: user.currentRoomId || '',
      lastPartnerId: user.lastPartnerId || '',
      skipCooldownUntil: user.skipCooldownUntil?.toString() || '',
    });
    await this.client.sAdd(RedisKeys.onlineUsers(), user.id);
    await this.client.set(RedisKeys.userSocket(user.socketId), user.id);
  }

  public async getUser(userId: string): Promise<User | null> {
    const key = RedisKeys.user(userId);
    const data = await this.client.hGetAll(key);
    
    if (!data.id) return null;
    
    return {
      id: data.id,
      socketId: data.socketId,
      joinedAt: parseInt(data.joinedAt),
      lastActive: parseInt(data.lastActive),
      currentRoomId: data.currentRoomId || null,
      lastPartnerId: data.lastPartnerId || null,
      skipCooldownUntil: data.skipCooldownUntil ? parseInt(data.skipCooldownUntil) : null,
      matchHistory: await this.getMatchHistory(userId),
    };
  }

  public async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const key = RedisKeys.user(userId);
    const updateData: Record<string, string> = {};
    
    if (updates.socketId) updateData.socketId = updates.socketId;
    if (updates.lastActive) updateData.lastActive = updates.lastActive.toString();
    if (updates.currentRoomId !== undefined) updateData.currentRoomId = updates.currentRoomId || '';
    if (updates.lastPartnerId !== undefined) updateData.lastPartnerId = updates.lastPartnerId || '';
    if (updates.skipCooldownUntil !== undefined) {
      updateData.skipCooldownUntil = updates.skipCooldownUntil?.toString() || '';
    }
    
    if (Object.keys(updateData).length > 0) {
      await this.client.hSet(key, updateData);
    }
  }

  public async removeUser(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      await this.client.del(RedisKeys.userSocket(user.socketId));
    }
    await this.client.del(RedisKeys.user(userId));
    await this.client.sRem(RedisKeys.onlineUsers(), userId);
    await this.client.sRem(RedisKeys.waitingUsers(), userId);
  }

  public async getUserBySocket(socketId: string): Promise<User | null> {
    const userId = await this.client.get(RedisKeys.userSocket(socketId));
    if (!userId) return null;
    return this.getUser(userId);
  }

  // Online Users
  public async getOnlineUsers(): Promise<string[]> {
    return this.client.sMembers(RedisKeys.onlineUsers());
  }

  public async getOnlineCount(): Promise<number> {
    return this.client.sCard(RedisKeys.onlineUsers());
  }

  // Waiting Users (for matchmaking)
  public async addToWaiting(userId: string): Promise<void> {
    await this.client.sAdd(RedisKeys.waitingUsers(), userId);
  }

  public async removeFromWaiting(userId: string): Promise<void> {
    await this.client.sRem(RedisKeys.waitingUsers(), userId);
  }

  public async getWaitingUsers(): Promise<string[]> {
    return this.client.sMembers(RedisKeys.waitingUsers());
  }

  // Room Operations
  public async createRoom(room: Room): Promise<void> {
    const key = RedisKeys.room(room.id);
    await this.client.hSet(key, {
      id: room.id,
      user1Id: room.user1Id,
      user2Id: room.user2Id,
      createdAt: room.createdAt.toString(),
      lastActivity: room.lastActivity.toString(),
    });
  }

  public async getRoom(roomId: string): Promise<Room | null> {
    const key = RedisKeys.room(roomId);
    const data = await this.client.hGetAll(key);
    
    if (!data.id) return null;
    
    return {
      id: data.id,
      user1Id: data.user1Id,
      user2Id: data.user2Id,
      createdAt: parseInt(data.createdAt),
      lastActivity: parseInt(data.lastActivity),
    };
  }

  public async deleteRoom(roomId: string): Promise<void> {
    await this.client.del(RedisKeys.room(roomId));
  }

  // Match History
  public async addToMatchHistory(userId: string, partnerId: string): Promise<void> {
    const key = RedisKeys.matchHistory(userId);
    await this.client.sAdd(key, partnerId);
    // Keep history for 24 hours
    await this.client.expire(key, 24 * 60 * 60);
  }

  public async getMatchHistory(userId: string): Promise<string[]> {
    return this.client.sMembers(RedisKeys.matchHistory(userId));
  }

  public async hasMatchedBefore(userId: string, partnerId: string): Promise<boolean> {
    const key = RedisKeys.matchHistory(userId);
    return this.client.sIsMember(key, partnerId);
  }

  // Cooldown Management
  public async setCooldown(userId: string, durationMs: number): Promise<void> {
    const key = RedisKeys.cooldown(userId);
    await this.client.set(key, Date.now().toString(), {
      PX: durationMs,
    });
  }

  public async isInCooldown(userId: string): Promise<boolean> {
    const key = RedisKeys.cooldown(userId);
    const value = await this.client.get(key);
    return value !== null;
  }

  // Distributed Lock for Matchmaking (prevents race conditions)
  public async acquireLock(lockKey: string, ttlMs: number = 5000): Promise<boolean> {
    const result = await this.client.set(`lock:${lockKey}`, '1', {
      NX: true,
      PX: ttlMs,
    });
    return result === 'OK';
  }

  public async releaseLock(lockKey: string): Promise<void> {
    await this.client.del(`lock:${lockKey}`);
  }

  // Health Check
  public async ping(): Promise<string> {
    return this.client.ping();
  }
}
