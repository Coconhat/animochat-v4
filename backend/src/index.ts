import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import cors from "cors";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { initRedis, pubClient, subClient } from "./lib/redis";
import { saveUser, removeUser } from "./services/store";
import {
  findMatch,
  handleLeaveMatch,
  handleDisconnect,
  cleanupGhostUsers,
} from "./services/matchmaking";

dotenv.config();

const app = express();
app.use(cors());
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});
const httpServer = createServer(app);

// Initialize Redis first
initRedis().then(() => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    adapter: createAdapter(pubClient, subClient),
  });

  // Periodic cleanup of ghost users (every 30 seconds)
  setInterval(() => {
    cleanupGhostUsers(io);
  }, 30000);

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
      try {
        await findMatch(socket, io);
      } catch (error) {
        console.error(`Error finding match for ${socket.id}:`, error);
        socket.emit("match:error", {
          message: "Failed to find a match. Please try again.",
        });
      }
    });

    // 3. Handle Send Message
    socket.on("message:send", async (data) => {
      if (!data.roomId || !data.content) {
        console.warn(`Invalid message from ${socket.id}`);
        return;
      }

      socket.to(data.roomId).emit("message:receive", {
        id: uuidv4(),
        senderId: socket.id,
        content: data.content,
        timestamp: Date.now(),
        type: "text",
        replyTo: data.replyTo || null,
      });
    });

    // 4. Handle Typing
    socket.on("user:typing", (data) => {
      if (!data.roomId) return;

      socket.to(data.roomId).emit("partner:typing", {
        isTyping: data.isTyping ?? false,
      });
    });

    // 5. Handle Skip (Leave Room)
    socket.on("match:skip", async () => {
      try {
        await handleLeaveMatch(socket, io);
        socket.emit("match:left");
      } catch (error) {
        console.error(`Error handling skip for ${socket.id}:`, error);
      }
    });

    // 6. Handle Disconnect
    socket.on("disconnect", async () => {
      try {
        await handleDisconnect(socket, io);
        await removeUser(socket.id);
      } catch (error) {
        console.error(`Error handling disconnect for ${socket.id}:`, error);
      }
    });
  }); // End of io.on("connection")

  const PORT = process.env.PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
