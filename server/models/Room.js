const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  genres: {
    type: [String],
    default: []
  }
});

const RoomSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  votes: {
    type: [VoteSchema],
    default: []
  },
  results: {
    type: [Object],
    default: []
  },
  status: {
    type: String,
    enum: ['waiting', 'voting', 'finished'],
    default: 'waiting'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Room', RoomSchema);
