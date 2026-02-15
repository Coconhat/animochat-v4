import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { RedisService } from './RedisService';
import { MatchmakingService } from './MatchmakingService';
import { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  InterServerEvents, 
  SocketData,
  User,
  Message 
} from '../types';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export class SocketService {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
  private redis: RedisService;
  private matchmaking: MatchmakingService;
  
  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });
    
    this.redis = RedisService.getInstance();
    this.matchmaking = MatchmakingService.getInstance();
    
    this.setupHandlers();
  }
  
  private setupHandlers(): void {
    this.io.on('connection', (socket: TypedSocket) => {
      console.log(`Socket connected: ${socket.id}`);
      
      // Create user on connection
      this.handleConnection(socket);
      
      // Setup event handlers
      socket.on('find-match', () => this.handleFindMatch(socket));
      socket.on('cancel-match', () => this.handleCancelMatch(socket));
      socket.on('next-match', () => this.handleNextMatch(socket));
      socket.on('send-message', (content) => this.handleSendMessage(socket, content));
      socket.on('typing', (isTyping) => this.handleTyping(socket, isTyping));
      socket.on('leave-room', () => this.handleLeaveRoom(socket));
      socket.on('disconnect', (reason) => this.handleDisconnect(socket, reason));
    });
  }
  
  /**
   * Handle new connection
   */
  private async handleConnection(socket: TypedSocket): Promise<void> {
    const userId = `user_${this.generateId()}`;
    
    // Store user data in socket
    socket.data.userId = userId;
    socket.data.roomId = null;
    
    // Create user in Redis
    const user: User = {
      id: userId,
      socketId: socket.id,
      joinedAt: Date.now(),
      lastActive: Date.now(),
      currentRoomId: null,
      lastPartnerId: null,
      skipCooldownUntil: null,
      matchHistory: [],
    };
    
    await this.redis.setUser(user);
    
    // Broadcast updated online count
    await this.broadcastOnlineCount();
    
    console.log(`User created: ${userId} for socket: ${socket.id}`);
  }
  
  /**
   * Handle find match request
   */
  private async handleFindMatch(socket: TypedSocket): Promise<void> {
    const userId = socket.data.userId;
    
    if (!userId) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }
    
    console.log(`Find match requested by: ${userId}`);
    
    // Emit waiting state
    socket.emit('waiting');
    
    // Start matchmaking
    const result = await this.matchmaking.findMatch(userId);
    
    if (result.success && result.roomId && result.partnerId) {
      // Get partner's socket
      const partner = await this.redis.getUser(result.partnerId);
      
      if (partner) {
        // Update socket room data
        socket.data.roomId = result.roomId;
        
        // Join socket room
        socket.join(result.roomId);
        
        // Notify this user
        socket.emit('matched', {
          roomId: result.roomId,
          partnerId: result.partnerId,
        });
        
        // Notify partner if online
        const partnerSocket = this.io.sockets.sockets.get(partner.socketId);
        if (partnerSocket) {
          partnerSocket.data.roomId = result.roomId;
          partnerSocket.join(result.roomId);
          partnerSocket.emit('matched', {
            roomId: result.roomId,
            partnerId: userId,
          });
        }
        
        // Send system message to room
        const systemMessage: Message = {
          id: `msg_${this.generateId()}`,
          roomId: result.roomId,
          senderId: 'system',
          content: 'You are now chatting with a stranger. Say hi!',
          timestamp: Date.now(),
          type: 'system',
        };
        
        this.io.to(result.roomId).emit('message', systemMessage);
        
        console.log(`Match created: ${result.roomId} between ${userId} and ${result.partnerId}`);
      }
    } else {
      socket.emit('error', { message: result.error || 'Failed to find match' });
    }
  }
  
  /**
   * Handle cancel match request
   */
  private async handleCancelMatch(socket: TypedSocket): Promise<void> {
    const userId = socket.data.userId;
    
    if (!userId) return;
    
    await this.matchmaking.cancelMatch(userId);
    socket.emit('match-cancelled');
    
    console.log(`Match cancelled by: ${userId}`);
  }
  
  /**
   * Handle next match (skip) request
   */
  private async handleNextMatch(socket: TypedSocket): Promise<void> {
    const userId = socket.data.userId;
    
    if (!userId) {
      socket.emit('error', { message: 'User not authenticated' });
      return;
    }
    
    const currentRoomId = socket.data.roomId;
    
    if (currentRoomId) {
      // Notify partner about disconnection
      socket.to(currentRoomId).emit('partner-disconnected');
      
      // Leave the room
      socket.leave(currentRoomId);
      socket.data.roomId = null;
    }
    
    // Skip and find new match
    const result = await this.matchmaking.skipMatch(userId);
    
    if (result.success && result.roomId && result.partnerId) {
      const partner = await this.redis.getUser(result.partnerId);
      
      if (partner) {
        socket.data.roomId = result.roomId;
        socket.join(result.roomId);
        
        socket.emit('matched', {
          roomId: result.roomId,
          partnerId: result.partnerId,
        });
        
        const partnerSocket = this.io.sockets.sockets.get(partner.socketId);
        if (partnerSocket) {
          partnerSocket.data.roomId = result.roomId;
          partnerSocket.join(result.roomId);
          partnerSocket.emit('matched', {
            roomId: result.roomId,
            partnerId: userId,
          });
        }
        
        const systemMessage: Message = {
          id: `msg_${this.generateId()}`,
          roomId: result.roomId,
          senderId: 'system',
          content: 'You are now chatting with a stranger. Say hi!',
          timestamp: Date.now(),
          type: 'system',
        };
        
        this.io.to(result.roomId).emit('message', systemMessage);
      }
    } else {
      // If no match found, go back to waiting
      socket.emit('waiting');
      
      // Try to find a new match
      const newResult = await this.matchmaking.findMatch(userId);
      
      if (newResult.success && newResult.roomId && newResult.partnerId) {
        const partner = await this.redis.getUser(newResult.partnerId);
        
        if (partner) {
          socket.data.roomId = newResult.roomId;
          socket.join(newResult.roomId);
          
          socket.emit('matched', {
            roomId: newResult.roomId,
            partnerId: newResult.partnerId,
          });
          
          const partnerSocket = this.io.sockets.sockets.get(partner.socketId);
          if (partnerSocket) {
            partnerSocket.data.roomId = newResult.roomId;
            partnerSocket.join(newResult.roomId);
            partnerSocket.emit('matched', {
              roomId: newResult.roomId,
              partnerId: userId,
            });
          }
          
          const systemMessage: Message = {
            id: `msg_${this.generateId()}`,
            roomId: newResult.roomId,
            senderId: 'system',
            content: 'You are now chatting with a stranger. Say hi!',
            timestamp: Date.now(),
            type: 'system',
          };
          
          this.io.to(newResult.roomId).emit('message', systemMessage);
        }
      }
    }
  }
  
  /**
   * Handle send message
   */
  private async handleSendMessage(socket: TypedSocket, content: string): Promise<void> {
    const userId = socket.data.userId;
    const roomId = socket.data.roomId;
    
    if (!userId || !roomId) {
      socket.emit('error', { message: 'Not in a chat room' });
      return;
    }
    
    if (!content.trim()) {
      socket.emit('error', { message: 'Message cannot be empty' });
      return;
    }
    
    const message: Message = {
      id: `msg_${this.generateId()}`,
      roomId,
      senderId: userId,
      content: content.trim(),
      timestamp: Date.now(),
      type: 'text',
    };
    
    // Broadcast to room
    this.io.to(roomId).emit('message', message);
    
    // Update last activity
    await this.redis.updateUser(userId, { lastActive: Date.now() });
    
    console.log(`Message sent in room ${roomId} by ${userId}`);
  }
  
  /**
   * Handle typing indicator
   */
  private async handleTyping(socket: TypedSocket, isTyping: boolean): Promise<void> {
    const userId = socket.data.userId;
    const roomId = socket.data.roomId;
    
    if (!userId || !roomId) return;
    
    // Broadcast typing status to room (except sender)
    socket.to(roomId).emit('partner-typing', { isTyping });
  }
  
  /**
   * Handle leave room
   */
  private async handleLeaveRoom(socket: TypedSocket): Promise<void> {
    const userId = socket.data.userId;
    const roomId = socket.data.roomId;
    
    if (!userId) return;
    
    if (roomId) {
      // Notify partner
      socket.to(roomId).emit('partner-disconnected');
      
      // Leave room
      socket.leave(roomId);
      socket.data.roomId = null;
      
      // Clean up matchmaking
      await this.matchmaking.leaveRoom(userId);
    }
    
    console.log(`User ${userId} left room`);
  }
  
  /**
   * Handle disconnection
   */
  private async handleDisconnect(socket: TypedSocket, reason: string): Promise<void> {
    const userId = socket.data.userId;
    const roomId = socket.data.roomId;
    
    console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    
    if (userId) {
      // If in a room, notify partner
      if (roomId) {
        socket.to(roomId).emit('partner-disconnected');
      }
      
      // Clean up
      await this.matchmaking.handleDisconnect(userId);
      
      // Broadcast updated online count
      await this.broadcastOnlineCount();
    }
  }
  
  /**
   * Broadcast online count to all clients
   */
  private async broadcastOnlineCount(): Promise<void> {
    const count = await this.matchmaking.getOnlineCount();
    this.io.emit('online-count', count);
  }
  
  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Get IO instance (for external use)
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}
