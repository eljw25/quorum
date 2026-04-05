const mongoose = require('mongoose');

// Defines the structure of each vote inside a room and each participant votes on genres they want to watch
const VoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // References a User document
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  genres: {
    type: [String], // The genres this person voted for e.g. ["Action", "Comedy"]
    default: []
  }
});

// Defines the structure of a Room in MongoDB
const RoomSchema = new mongoose.Schema({
  // The unique 6-character code friends use to join e.g. "ABC123"
  code: {
    type: String,
    required: true,
    unique: true
  },
  // The user who created the room
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // All participants and their genre votes
  votes: {
    type: [VoteSchema],
    default: []
  },
  // The final movie recommendations after voting is complete
  results: {
    type: [Object], // Array of movie objects from TMDB
    default: []
  },
  // Whether the room is still accepting votes or has finished
  status: {
    type: String,
    enum: ['waiting', 'voting', 'finished'], // Only these 3 values allowed
    default: 'waiting'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Room', RoomSchema);
