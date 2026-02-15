import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import cors from "cors";
import dotenv from "dotenv";
import { initRedis, pubClient, subClient } from "./lib/redis";
import {
  saveUser,
  removeUser,
  getUser,
  getRoom,
  deleteRoom,
} from "./services/store";
import { findMatch } from "./services/matchmaker";

dotenv.config();

const app = express();
app.use(cors());

const httpServer = createServer(app);

// Initialize Redis first
initRedis().then(() => {
  // Setup Socket.IO with Redis Adapter for Scaling
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Adjust for production
      methods: ["GET", "POST"],
    },
    adapter: createAdapter(pubClient, subClient),
  });

  io.on("connection", async (socket) => {
    console.log(`User connected: ${socket.id} on PID: ${process.pid}`);

    // 1. Initialize User
    await saveUser(socket.id, {
      userId: socket.id, // Using socketId as userId for anonymity
      socketId: socket.id,
      isBusy: false,
      connectedAt: Date.now(),
    });

    // 2. Handle Find Match
    socket.on("match:find", async () => {
      // Logic: remove from current room if any, then find match
      const user = await getUser(socket.id);
      if (user?.currentRoomId) {
        // Leave logic handled below, but let's ensure cleanup
        socket.leave(user.currentRoomId);
      }
      await findMatch(socket.id, io);
    });

    // 3. Handle Send Message
    socket.on(
      "message:send",
      async (data: { content: string; roomId: string }) => {
        const room = await getRoom(data.roomId);
        if (room && room.participants.includes(socket.id)) {
          // Broadcast to everyone in room EXCEPT sender (optional, or send to all)
          socket.to(data.roomId).emit("message:receive", {
            id: Date.now().toString(),
            senderId: socket.id,
            content: data.content,
            timestamp: Date.now(),
            type: "text",
          });
        }
      },
    );

    // 4. Handle Typing
    socket.on("user:typing", (data: { roomId: string; isTyping: boolean }) => {
      socket
        .to(data.roomId)
        .emit("partner:typing", { isTyping: data.isTyping });
    });

    // 5. Handle Skip/Next
    socket.on("match:skip", async () => {
      const user = await getUser(socket.id);
      if (!user || !user.currentRoomId) return;

      const roomId = user.currentRoomId;

      // Notify partner
      socket.to(roomId).emit("partner:left");

      // Cleanup Room
      await deleteRoom(roomId);

      // Make user available again and search
      await saveUser(socket.id, { isBusy: false, currentRoomId: null });
      socket.leave(roomId);

      // Trigger new search
      await findMatch(socket.id, io);
    });

    // 6. Handle Disconnect
    socket.on("disconnect", async () => {
      const user = await getUser(socket.id);
      if (user?.currentRoomId) {
        // Notify partner that user disconnected
        socket.to(user.currentRoomId).emit("partner:left");
        await deleteRoom(user.currentRoomId);
      }

      await removeUser(socket.id);
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (PID: ${process.pid})`);
  });
});
