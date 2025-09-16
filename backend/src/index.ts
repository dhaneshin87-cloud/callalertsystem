import "reflect-metadata";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./storage/database";
import authRoutes from "./routes/auth";
import eventRoutes from "./routes/event";
import { setupReminderJob } from "./cron/reminder";

dotenv.config();

const app = express();

// ✅ Allow CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ['GET', 'POST'],
    credentials: true,
  })
);

// ✅ Parse JSON
app.use(express.json());

// ✅ Routes
app.use("/auth", authRoutes);
app.use("/events", eventRoutes);

// ✅ Health check
app.get("/", (req, res) => {
  res.send("Server is up and running 🚀");
});

// ✅ Create HTTP server
const httpServer = createServer(app);

// ✅ Create Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

// ✅ Keep last results in memory
let lastReminderResults: any[] = [];

// ✅ Listen for WebSocket connections
io.on("connection", (socket) => {
  console.log("🌐 New client connected:", socket.id);

  const userId =
    (socket.handshake.auth && socket.handshake.auth.userId) ||
    (socket.handshake.query && (socket.handshake.query.userId as string));
  if (userId) {
    socket.data.userId = userId;
    socket.join(`user:${userId}`);
  }
console.log('userid',userId)
  // Send last known results immediately
  socket.emit("newJobResult", lastReminderResults);
});

const PORT = process.env.PORT || 5000;

// ✅ Connect to database and start server
connectDB().then(() => {
  // Start HTTP+WebSocket server
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server + WebSocket running on port ${PORT}`);
    
    // Setup reminder job with WebSocket integration
    setupReminderJob(io, (results) => {
      lastReminderResults = results;
      console.log("✅ Reminder job result:", JSON.stringify(results, null, 2));
      // Send to all connected clients
      io.emit("newJobResult", results);
    });
  });
});
