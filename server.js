import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet'; // 👈 Import helmet for security
import { createServer } from 'http';
import { Server } from 'socket.io';

import connectDB from './config/db.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import userRoutes from './routes/userRoutes.js';
import castingCallRoutes from './routes/castingCallRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

// --- Basic Setup ---
dotenv.config();
connectDB();
const app = express();

// --- Middleware ---

// Get frontend URL from environment variables, with a fallback for development
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
console.log(`CORS allowing connections from: ${FRONTEND_URL}`); // Log the allowed origin

// Configure CORS for Express routes
app.use(cors({
  origin: FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Set security-related HTTP headers
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// Middleware to parse JSON bodies
app.use(express.json());

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/casting-calls', castingCallRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/messages', messageRoutes);


// --- Socket.IO Integration ---
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

let onlineUsers = [];

const addUser = (userId, socketId) => {
  !onlineUsers.some((user) => user.userId === userId) &&
    onlineUsers.push({ userId, socketId });
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return onlineUsers.find((user) => user.userId === userId);
};

// Listen for a new connection
io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Event: A user comes online
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", onlineUsers);
  });

  // Event: A user sends a message
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const receiver = getUser(receiverId);
    if (receiver) {
      io.to(receiver.socketId).emit("getMessage", {
        senderId,
        text,
      });
    }
  });

  // Event: A user disconnects
  socket.on("disconnect", () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    removeUser(socket.id);
    io.emit("getUsers", onlineUsers);
  });
});

// --- Error Handling for Not Found Routes ---
app.use((req, res, next) => {
    res.status(404).json({ message: "API route not found" });
});


// --- Server Listening ---
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () =>
  console.log(`🚀 Server with Socket.IO running on port ${PORT}`)
);
