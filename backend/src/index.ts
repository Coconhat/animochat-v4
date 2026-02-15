import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import cors from "cors";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
// Ensure these match your actual file paths for imports
import { initRedis, pubClient, subClient, redisClient } from "./lib/redis";
import { saveUser, removeUser, getUser, deleteRoom } from "./services/store";

dotenv.config();

const app = express();
app.use(cors());

const httpServer = createServer(app);
const QUEUE_KEY = "queue:waiting";

// Initialize Redis first
initRedis().then(() => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    adapter: createAdapter(pubClient, subClient),
  });

  io.on("connection", async (socket) => {
    console.log(`User connected: ${socket.id}`);

    // 1. Initialize User
    await saveUser(socket.id, {
      userId: socket.id,
      socketId: socket.id,
      isBusy: false,
      connectedAt: Date.now(),
    });

    // 2. Handle Find Match
    socket.on("match:find", async () => {
      console.log(`🔎 ${socket.id} is looking for a match...`);

      // Remove myself from queue first to prevent duplicates
      await redisClient.sRem(QUEUE_KEY, socket.id);

      let partnerId: string | null = null;
      let partnerSocket: any = null;

      // LOOP: Keep popping from Redis until we find a LIVE user
      while (true) {
        partnerId = await redisClient.sPop(QUEUE_KEY);

        if (!partnerId) break; // Queue is empty

        if (partnerId === socket.id) continue; // Skip self

        // Check if user is actually connected
        partnerSocket = io.sockets.sockets.get(partnerId);

        if (partnerSocket) {
          // Found a live user!
          break;
        } else {
          console.log(`👻 Found ghost user ${partnerId}, cleaning up...`);
          // Loop continues to find the next person
        }
      }

      // Handle Result
      if (partnerSocket && partnerId) {
        // --- MATCH FOUND ---
        const roomId = uuidv4();
        console.log(`🎉 MATCH: ${socket.id} + ${partnerId} -> Room ${roomId}`);

        partnerSocket.join(roomId);
        socket.join(roomId);

        // Notify both
        io.to(roomId).emit("match:success", {
          roomId,
          partnerId: "Stranger",
        });
      } else {
        // --- NO MATCH FOUND ---
        // Add myself to the queue and wait
        await redisClient.sAdd(QUEUE_KEY, socket.id);
        console.log(`⏳ ${socket.id} added to queue.`);
      }
    });

    // 3. Handle Send Message
    socket.on("message:send", async (data) => {
      socket.to(data.roomId).emit("message:receive", {
        id: uuidv4(),
        senderId: socket.id,
        content: data.content,
        timestamp: Date.now(),
        type: "text",
      });
    });

    // 4. Handle Typing
    socket.on("user:typing", (data) => {
      socket
        .to(data.roomId)
        .emit("partner:typing", { isTyping: data.isTyping });
    });

    // 5. Handle Skip (Leave Room)
    socket.on("match:skip", async () => {
      const user = await getUser(socket.id);
      if (user && user.currentRoomId) {
        socket.to(user.currentRoomId).emit("partner:left");
        socket.leave(user.currentRoomId);
        await deleteRoom(user.currentRoomId);
      }
    });

    // 6. Handle Disconnect
    socket.on("disconnect", async () => {
      // Remove from queue just in case
      await redisClient.sRem(QUEUE_KEY, socket.id);

      const user = await getUser(socket.id);
      if (user?.currentRoomId) {
        socket.to(user.currentRoomId).emit("partner:left");
        await deleteRoom(user.currentRoomId);
      }
      await removeUser(socket.id);
      console.log(`👋 Disconnected: ${socket.id}`);
    });
  }); // End of io.on("connection")

  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
