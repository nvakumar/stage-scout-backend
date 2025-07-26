import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

import connectDB from './config/db.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import userRoutes from './routes/userRoutes.js';
import castingCallRoutes from './routes/castingCallRoutes.js';
// import notificationRoutes from './routes/notificationRoutes.js'; // This route is not defined in your project
import groupRoutes from './routes/groupRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

// --- Basic Setup ---
dotenv.config();
connectDB();
const app = express();

// Get frontend URL from environment variables, with a fallback for development
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
console.log(`CORS allowing connections from: ${FRONTEND_URL}`); // Log the allowed origin

// Configure CORS for Express routes
app.use(cors({
  origin: FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE"], // Ensure all necessary methods are allowed for Express
  credentials: true
}));
app.use(express.json());

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/casting-calls', castingCallRoutes);
// app.use('/api/notifications', notificationRoutes); // This route is not defined in your project
app.use('/api/groups', groupRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/messages', messageRoutes);

// --- Socket.IO Integration ---
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL, // Use the dynamic FRONTEND_URL
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // 👈 Allow all common HTTP methods for Socket.IO handshake
    credentials: true
  },
  // Add transports for better compatibility, although default is usually fine
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
    io.emit("getUsers", onlineUsers); // Send the list of online users to everyone
  });

  // Event: A user sends a message
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const receiver = getUser(receiverId);
    if (receiver) {
      // If the receiver is online, send the message directly to their socket
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


// --- Server Listening ---
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () =>
  console.log(`🚀 Server with Socket.IO running on port ${PORT}`)
);
