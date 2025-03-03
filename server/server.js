const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const drawingRoutes = require('./routes/drawings');

// Create Express app
const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/drawings', drawingRoutes);

// Socket.io logic
const rooms = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Create a new room
  socket.on('create-room', (data, callback) => {
    const roomId = generateRoomId();
    rooms[roomId] = {
      participants: []
    };
    
    callback({ roomId });
  });

  // Join a room
  socket.on('join-room', ({ roomId, user }) => {
    socket.join(roomId);
    
    // Create room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = {
        participants: []
      };
    }
    
    // Add participant to room
    const participant = {
      socketId: socket.id,
      userId: user.userId,
      name: user.name
    };
    
    rooms[roomId].participants.push(participant);
    
    // Broadcast updated participants list
    io.to(roomId).emit('participants', {
      participants: rooms[roomId].participants
    });
    
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Leave a room
  socket.on('leave-room', ({ roomId }) => {
    if (rooms[roomId]) {
      // Remove participant from room
      rooms[roomId].participants = rooms[roomId].participants.filter(
        (p) => p.socketId !== socket.id
      );
      
      // Broadcast updated participants list
      io.to(roomId).emit('participants', {
        participants: rooms[roomId].participants
      });
      
      // Remove room if empty
      if (rooms[roomId].participants.length === 0) {
        delete rooms[roomId];
      }
    }
    
    socket.leave(roomId);
    console.log(`User ${socket.id} left room ${roomId}`);
  });

  // Drawing events
  socket.on('drawing', (data) => {
    socket.to(data.roomId).emit('drawing', data);
  });
  
  socket.on('element-complete', (data) => {
    socket.to(data.roomId).emit('element-complete', data.element);
  });
  
  socket.on('clear-canvas', (data) => {
    socket.to(data.roomId).emit('clear-canvas');
  });
  
  socket.on('undo', (data) => {
    socket.to(data.roomId).emit('undo');
  });
  
  socket.on('redo', (data) => {
    socket.to(data.roomId).emit('redo');
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove participant from all rooms
    Object.keys(rooms).forEach((roomId) => {
      if (rooms[roomId].participants.some((p) => p.socketId === socket.id)) {
        rooms[roomId].participants = rooms[roomId].participants.filter(
          (p) => p.socketId !== socket.id
        );
        
        // Broadcast updated participants list
        io.to(roomId).emit('participants', {
          participants: rooms[roomId].participants
        });
        
        // Remove room if empty
        if (rooms[roomId].participants.length === 0) {
          delete rooms[roomId];
        }
      }
    });
  });
});

// Generate a random room ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 10);
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });