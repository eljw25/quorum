const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();

const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:3000',
  'https://quorum-client.onrender.com'
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err));

io.on('connection', (socket) => {
  socket.on('join_room', (roomCode) => {
    socket.join(roomCode);
  });

  socket.on('vote', (data) => {
    io.to(data.roomCode).emit('vote_update', data);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
