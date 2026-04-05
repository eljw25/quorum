const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();

// Create an HTTP server wrapping Express
// We need this because Socket.io needs to attach to the same server
const server = http.createServer(app);

// Attach Socket.io to the HTTP server
// cors here allows our React frontend to connect to Socket.io
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // React runs on port 3000
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());                  // Allows cross-origin requests from React
app.use(express.json());          // Parses incoming JSON request bodies

// Routes (we'll add these next)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err));

// Socket.io — real-time events
// This is where live voting happens
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins a room by its code
  socket.on('join_room', (roomCode) => {
    socket.join(roomCode);
    console.log(`${socket.id} joined room ${roomCode}`);
  });

  // When a user votes on a genre, broadcast it to everyone in the room
  socket.on('vote', (data) => {
    io.to(data.roomCode).emit('vote_update', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
