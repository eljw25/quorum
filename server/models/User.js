const mongoose = require('mongoose');

// This defines the structure of a User in MongoDB
// Think of it like a blueprint — every user document will follow this shape
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,    // No two users can have the same username
    trim: true       // Removes accidental spaces
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true  // Always store emails in lowercase
  },
  password: {
    type: String,
    required: true   // We'll hash this with bcrypt before saving
  },
  // The genres this user likes — used for matching
  favoriteGenres: {
    type: [String],  // Array of genre names e.g. ["Action", "Comedy"]
    default: []
  }
}, {
  timestamps: true   // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('User', UserSchema);
