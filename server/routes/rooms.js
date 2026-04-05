const express = require('express');
const router = express.Router();
const axios = require('axios');
const Room = require('../models/Room');
const auth = require('../middleware/auth');

// Generates a random 6-character room code like "ABC123"
const generateCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// ===== CREATE ROOM =====
// POST /api/rooms/create
// auth middleware runs first — only logged in users can create rooms
router.post('/create', auth, async (req, res) => {
  try {
    // Keep generating codes until we find one that's not already taken
    let code = generateCode();
    let existing = await Room.findOne({ code });
    while (existing) {
      code = generateCode();
      existing = await Room.findOne({ code });
    }

    // Create the room with the host set to the logged in user
    const room = new Room({
      code,
      host: req.user.userId, // comes from the JWT token via auth middleware
      votes: [],
      status: 'waiting'
    });

    await room.save();
    res.status(201).json({ code: room.code });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ===== JOIN ROOM =====
// POST /api/rooms/join
router.post('/join', auth, async (req, res) => {
  const { code } = req.body;

  try {
    // Find the room by its code
    const room = await Room.findOne({ code: code.toUpperCase() });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.status === 'finished') {
      return res.status(400).json({ message: 'This room has already finished' });
    }

    res.json({ code: room.code, status: room.status, votes: room.votes });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ===== SUBMIT VOTE =====
// POST /api/rooms/:code/vote
router.post('/:code/vote', auth, async (req, res) => {
  const { genres } = req.body;

  try {
    const room = await Room.findOne({ code: req.params.code });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if this user already voted — if so update their vote
    const existingVote = room.votes.find(
      v => v.userId.toString() === req.user.userId
    );

    if (existingVote) {
      existingVote.genres = genres; // Update existing vote
    } else {
      // Add a new vote entry for this user
      room.votes.push({
        userId: req.user.userId,
        username: req.user.username,
        genres
      });
    }

    room.status = 'voting';
    await room.save();

    res.json({ votes: room.votes });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ===== GET RESULTS =====
// POST /api/rooms/:code/results
// This is where the matching algorithm runs
router.post('/:code/results', auth, async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // ===== MATCHING ALGORITHM =====
    // Count how many people voted for each genre
    const genreCount = {};
    room.votes.forEach(vote => {
      vote.genres.forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });

    // Sort genres by how many people voted for them (most popular first)
    const sortedGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    // Take the top 2 genres that got the most votes
    const topGenres = sortedGenres.slice(0, 2);

    // TMDB genre ID mapping
    const genreMap = {
      'Action': 28, 'Comedy': 35, 'Drama': 18, 'Horror': 27,
      'Romance': 10749, 'Sci-Fi': 878, 'Thriller': 53,
      'Animation': 16, 'Documentary': 99, 'Fantasy': 14
    };

    // Convert genre names to TMDB genre IDs
    const genreIds = topGenres
      .map(g => genreMap[g])
      .filter(Boolean)
      .join(',');

    // Fetch movies from TMDB matching the top genres
    const tmdbRes = await axios.get(
      `https://api.themoviedb.org/3/discover/movie`, {
        params: {
          api_key: process.env.TMDB_API_KEY,
          with_genres: genreIds,
          sort_by: 'popularity.desc',
          page: 1
        }
      }
    );

    // Take the top 5 movie results
    const movies = tmdbRes.data.results.slice(0, 5).map(movie => ({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      rating: movie.vote_average,
      releaseDate: movie.release_date
    }));

    // Save results and mark room as finished
    room.results = movies;
    room.status = 'finished';
    await room.save();

    res.json({ movies, topGenres });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ===== GET ROOM =====
// GET /api/rooms/:code
router.get('/:code', auth, async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
