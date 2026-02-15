import { RedisService } from './RedisService';
import { User, Room, MatchResult } from '../types';

export class MatchmakingService {
  private redis: RedisService;
  private static instance: MatchmakingService;
  
  // Configuration
  private readonly COOLDOWN_DURATION = 5000; // 5 seconds between skips
  private readonly MAX_MATCH_HISTORY = 50; // Maximum users to remember
  private readonly MATCH_TIMEOUT = 30000; // 30 seconds to find a match
  
  private constructor() {
    this.redis = RedisService.getInstance();
  }
  
  public static getInstance(): MatchmakingService {
    if (!MatchmakingService.instance) {
      MatchmakingService.instance = new MatchmakingService();
    }
    return MatchmakingService.instance;
  }
  
  /**
   * Find a match for a user
   * Implements the sophisticated matchmaking algorithm with:
   * - Random selection from valid candidates
   * - Prevention of rematches
   * - Cooldown handling
   * - Race condition protection via distributed locks
   */
  public async findMatch(userId: string): Promise<MatchResult> {
    const startTime = Date.now();
    
    // Get current user
    const user = await this.redis.getUser(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Check if user is already in a room
    if (user.currentRoomId) {
      return { success: false, error: 'Already in a room' };
    }
    
    // Check cooldown
    if (user.skipCooldownUntil && Date.now() < user.skipCooldownUntil) {
      const remainingMs = user.skipCooldownUntil - Date.now();
      return { 
        success: false, 
        error: `Please wait ${Math.ceil(remainingMs / 1000)}s before finding a new match` 
      };
    }
    
    // Add user to waiting pool
    await this.redis.addToWaiting(userId);
    
    // Try to find a match
    while (Date.now() - startTime < this.MATCH_TIMEOUT) {
      const result = await this.attemptMatch(userId);
      
      if (result.success) {
        return result;
      }
      
      // Small delay before retry to prevent CPU spinning
      await this.sleep(100);
    }
    
    // Timeout - remove from waiting pool
    await this.redis.removeFromWaiting(userId);
    return { success: false, error: 'No available matches found. Try again later.' };
  }
  
  /**
   * Attempt to find and lock a match
   */
  private async attemptMatch(userId: string): Promise<MatchResult> {
    const user = await this.redis.getUser(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Get all waiting users
    const waitingUsers = await this.redis.getWaitingUsers();
    
    // Filter valid candidates
    const candidates = await this.filterValidCandidates(userId, waitingUsers);
    
    if (candidates.length === 0) {
      return { success: false, error: 'No valid candidates' };
    }
    
    // Randomly select a candidate
    const candidateId = candidates[Math.floor(Math.random() * candidates.length)];
    
    // Try to acquire lock on both users (prevents race conditions)
    const lockKey = `match:${[userId, candidateId].sort().join(':')}`;
    const lockAcquired = await this.redis.acquireLock(lockKey, 5000);
    
    if (!lockAcquired) {
      return { success: false, error: 'Could not acquire lock' };
    }
    
    try {
      // Double-check candidate is still valid
      const candidate = await this.redis.getUser(candidateId);
      if (!candidate || candidate.currentRoomId) {
        return { success: false, error: 'Candidate no longer available' };
      }
      
      // Create the match
      const result = await this.createMatch(userId, candidateId);
      return result;
      
    } finally {
      // Always release the lock
      await this.redis.releaseLock(lockKey);
    }
  }
  
  /**
   * Filter valid candidates for matching
   * Excludes:
   * - The current user
   * - Users already in a room
   * - Users previously matched (within history window)
   * - Users in cooldown
   */
  private async filterValidCandidates(userId: string, waitingUsers: string[]): Promise<string[]> {
    const user = await this.redis.getUser(userId);
    if (!user) return [];
    
    const candidates: string[] = [];
    
    for (const candidateId of waitingUsers) {
      // Skip self
      if (candidateId === userId) continue;
      
      // Get candidate info
      const candidate = await this.redis.getUser(candidateId);
      if (!candidate) continue;
      
      // Skip if already in a room
      if (candidate.currentRoomId) continue;
      
      // Skip if in cooldown
      if (candidate.skipCooldownUntil && Date.now() < candidate.skipCooldownUntil) continue;
      
      // Skip if previously matched
      const hasMatchedBefore = await this.redis.hasMatchedBefore(userId, candidateId);
      if (hasMatchedBefore) continue;
      
      // Also check reverse
      const hasMatchedReverse = await this.redis.hasMatchedBefore(candidateId, userId);
      if (hasMatchedReverse) continue;
      
      candidates.push(candidateId);
    }
    
    return candidates;
  }
  
  /**
   * Create a match between two users
   */
  private async createMatch(user1Id: string, user2Id: string): Promise<MatchResult> {
    const roomId = `room_${this.generateId()}`;
    const now = Date.now();
    
    const room: Room = {
      id: roomId,
      user1Id,
      user2Id,
      createdAt: now,
      lastActivity: now,
    };
    
    // Create room in Redis
    await this.redis.createRoom(room);
    
    // Update both users
    await this.redis.updateUser(user1Id, {
      currentRoomId: roomId,
      lastPartnerId: user2Id,
      lastActive: now,
    });
    
    await this.redis.updateUser(user2Id, {
      currentRoomId: roomId,
      lastPartnerId: user1Id,
      lastActive: now,
    });
    
    // Add to match history (both directions)
    await this.redis.addToMatchHistory(user1Id, user2Id);
    await this.redis.addToMatchHistory(user2Id, user1Id);
    
    // Remove from waiting pool
    await this.redis.removeFromWaiting(user1Id);
    await this.redis.removeFromWaiting(user2Id);
    
    return {
      success: true,
      roomId,
      partnerId: user2Id,
    };
  }
  
  /**
   * Handle user skipping to next match
   */
  public async skipMatch(userId: string): Promise<MatchResult> {
    const user = await this.redis.getUser(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    if (!user.currentRoomId) {
      return { success: false, error: 'Not in a room' };
    }
    
    // Get room info
    const room = await this.redis.getRoom(user.currentRoomId);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }
    
    const partnerId = room.user1Id === userId ? room.user2Id : room.user1Id;
    
    // Set cooldown for the user who skipped
    await this.redis.updateUser(userId, {
      skipCooldownUntil: Date.now() + this.COOLDOWN_DURATION,
      currentRoomId: null,
    });
    
    // Update partner (they can find new match immediately)
    await this.redis.updateUser(partnerId, {
      currentRoomId: null,
    });
    
    // Delete the room
    await this.redis.deleteRoom(user.currentRoomId);
    
    // Find new match for the user who skipped
    return this.findMatch(userId);
  }
  
  /**
   * Handle user leaving a room
   */
  public async leaveRoom(userId: string): Promise<void> {
    const user = await this.redis.getUser(userId);
    if (!user || !user.currentRoomId) return;
    
    const room = await this.redis.getRoom(user.currentRoomId);
    if (!room) return;
    
    const partnerId = room.user1Id === userId ? room.user2Id : room.user1Id;
    
    // Update both users
    await this.redis.updateUser(userId, { currentRoomId: null });
    await this.redis.updateUser(partnerId, { currentRoomId: null });
    
    // Delete room
    await this.redis.deleteRoom(user.currentRoomId);
  }
  
  /**
   * Handle user disconnection
   */
  public async handleDisconnect(userId: string): Promise<void> {
    const user = await this.redis.getUser(userId);
    if (!user) return;
    
    // If in a room, notify partner and clean up
    if (user.currentRoomId) {
      await this.leaveRoom(userId);
    }
    
    // Remove from waiting pool
    await this.redis.removeFromWaiting(userId);
    
    // Remove user from Redis
    await this.redis.removeUser(userId);
  }
  
  /**
   * Cancel matchmaking for a user
   */
  public async cancelMatch(userId: string): Promise<void> {
    await this.redis.removeFromWaiting(userId);
  }
  
  /**
   * Get online user count
   */
  public async getOnlineCount(): Promise<number> {
    return this.redis.getOnlineCount();
  }
  
  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
