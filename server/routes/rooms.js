const express = require('express');
const router = express.Router();
const axios = require('axios');
const Room = require('../models/Room');
const auth = require('../middleware/auth');

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

router.post('/create', auth, async (req, res) => {
  try {
    let code = generateCode();
    let existing = await Room.findOne({ code });
    while (existing) {
      code = generateCode();
      existing = await Room.findOne({ code });
    }

    const room = new Room({
      code,
      host: req.user.userId,
      votes: [],
      status: 'waiting'
    });

    await room.save();
    res.status(201).json({ code: room.code });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/join', auth, async (req, res) => {
  const { code } = req.body;

  try {
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

router.post('/:code/vote', auth, async (req, res) => {
  const { genres } = req.body;

  try {
    const room = await Room.findOne({ code: req.params.code });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const existingVote = room.votes.find(v => v.userId.toString() === req.user.userId);

    if (existingVote) {
      existingVote.genres = genres;
    } else {
      room.votes.push({ userId: req.user.userId, username: req.user.username, genres });
    }

    room.status = 'voting';
    await room.save();

    res.json({ votes: room.votes });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/:code/results', auth, async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const genreCount = {};
    room.votes.forEach(vote => {
      vote.genres.forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });

    const topGenres = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(entry => entry[0]);

    const genreMap = {
      'Action': 28, 'Comedy': 35, 'Drama': 18, 'Horror': 27,
      'Romance': 10749, 'Sci-Fi': 878, 'Thriller': 53,
      'Animation': 16, 'Documentary': 99, 'Fantasy': 14
    };

    const genreIds = topGenres.map(g => genreMap[g]).filter(Boolean).join(',');

    const tmdbRes = await axios.get(`https://api.themoviedb.org/3/discover/movie`, {
      params: {
        api_key: process.env.TMDB_API_KEY,
        with_genres: genreIds,
        sort_by: 'popularity.desc',
        page: 1
      }
    });

    const movies = await Promise.all(
      tmdbRes.data.results.slice(0, 5).map(async (movie) => {
        let streamingOn = [];
        try {
          const providerRes = await axios.get(
            `https://api.themoviedb.org/3/movie/${movie.id}/watch/providers`,
            { params: { api_key: process.env.TMDB_API_KEY } }
          );
          const us = providerRes.data.results?.US;
          if (us?.flatrate) {
            streamingOn = us.flatrate.slice(0, 4).map(p => ({
              name: p.provider_name,
              logo: `https://image.tmdb.org/t/p/w45${p.logo_path}`
            }));
          }
        } catch (e) {}

        return {
          id: movie.id,
          title: movie.title,
          overview: movie.overview,
          poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
          rating: movie.vote_average,
          releaseDate: movie.release_date,
          streamingOn
        };
      })
    );

    room.results = movies;
    room.status = 'finished';
    await room.save();

    res.json({ movies, topGenres });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

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
