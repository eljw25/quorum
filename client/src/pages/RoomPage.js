import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import API_URL from '../config';

// The list of genres users can vote on
const GENRES = [
  'Action', 'Comedy', 'Drama', 'Horror',
  'Romance', 'Sci-Fi', 'Thriller', 'Animation',
  'Documentary', 'Fantasy'
];

// Connect to Socket.io server
// This connection is shared across re-renders using a module-level variable
const socket = io('${API_URL}');

function RoomPage() {
  // Get the room code from the URL e.g. /room/ABC123
  const { code } = useParams();
  const navigate = useNavigate();

  const [selectedGenres, setSelectedGenres] = useState([]);
  const [votes, setVotes] = useState([]);
  const [voted, setVoted] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    // Fetch existing votes from the database when joining the room
    // This ensures late joiners can see votes already submitted
    const fetchRoom = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/rooms/${code}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setVotes(res.data.votes);
      } catch (err) {
        console.error('Failed to fetch room', err);
      }
    };
    fetchRoom();

    // Join the Socket.io room when this page loads
    socket.emit('join_room', code);

    // Listen for vote updates from other users in real-time
    // When anyone votes, this fires and updates the votes display
    socket.on('vote_update', (data) => {
      setVotes(prev => {
        // Update existing vote or add new one
        const exists = prev.find(v => v.username === data.username);
        if (exists) {
          return prev.map(v => v.username === data.username ? data : v);
        }
        return [...prev, data];
      });
    });

    // Clean up the socket listener when component unmounts
    return () => socket.off('vote_update');
  }, [code]);

  // Toggle a genre on or off
  const toggleGenre = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre) // Remove if already selected
        : [...prev, genre]              // Add if not selected
    );
  };

  // Submit vote to backend and emit to Socket.io
  const handleVote = async () => {
    if (selectedGenres.length === 0) {
      setError('Please select at least one genre');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/rooms/${code}/vote`,
        { genres: selectedGenres },
        authHeader
      );

      // Emit the vote to all users in this room via Socket.io
      socket.emit('vote', { roomCode: code, username, genres: selectedGenres });

      setVoted(true);
      setError('');
    } catch (err) {
      setError('Failed to submit vote');
    }
  };

  // Get results — only the host should do this when everyone has voted
  const handleGetResults = async () => {
    try {
      await axios.post(
        `${API_URL}/api/rooms/${code}/results`,
        {},
        authHeader
      );
      navigate(`/results/${code}`);
    } catch (err) {
      setError('Failed to get results');
    }
  };

  return (
    <div className="room-container">
      <div className="room-header">
        <h1 className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Quorum</h1>
        <div className="room-code-display">
          Room: <span>{code}</span>
        </div>
      </div>

      <div className="room-card">
        {/* Genre picker */}
        {!voted ? (
          <>
            <h2>Pick your genres</h2>
            <p>Select all the genres you'd be happy watching tonight.</p>

            <div className="genre-grid">
              {GENRES.map(genre => (
                <button
                  key={genre}
                  className={selectedGenres.includes(genre) ? 'genre-btn selected' : 'genre-btn'}
                  onClick={() => toggleGenre(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>

            {error && <p className="error">{error}</p>}

            <button onClick={handleVote} className="btn-primary">
              Submit Vote
            </button>
          </>
        ) : (
          <div className="voted-message">
            <h2>Vote submitted!</h2>
            <p>Waiting for others to vote...</p>
          </div>
        )}

        {/* Live vote tracker */}
        {votes.length > 0 && (
          <div className="vote-tracker">
            <h3>Votes so far:</h3>
            {votes.map((v, i) => (
              <div key={i} className="vote-item">
                <strong>{v.username}</strong>: {v.genres.join(', ')}
              </div>
            ))}
          </div>
        )}

        {/* Get results button — shows after voting */}
        {voted && (
          <button onClick={handleGetResults} className="btn-secondary">
            Get Movie Recommendations
          </button>
        )}
      </div>
    </div>
  );
}

export default RoomPage;
