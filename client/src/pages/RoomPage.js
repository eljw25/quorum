import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import API_URL from '../config';

const GENRES = [
  'Action', 'Comedy', 'Drama', 'Horror',
  'Romance', 'Sci-Fi', 'Thriller', 'Animation',
  'Documentary', 'Fantasy'
];

const socket = io(API_URL);

function RoomPage() {
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
    const fetchRoom = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/rooms/${code}`, { headers: { Authorization: `Bearer ${token}` } });
        setVotes(res.data.votes);
      } catch (err) {
        console.error('Failed to fetch room', err);
      }
    };
    fetchRoom();

    socket.emit('join_room', code);

    socket.on('vote_update', (data) => {
      setVotes(prev => {
        const exists = prev.find(v => v.username === data.username);
        if (exists) return prev.map(v => v.username === data.username ? data : v);
        return [...prev, data];
      });
    });

    return () => socket.off('vote_update');
  }, [code]);

  const toggleGenre = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const handleVote = async () => {
    if (selectedGenres.length === 0) {
      setError('Please select at least one genre');
      return;
    }

    try {
      await axios.post(`${API_URL}/api/rooms/${code}/vote`, { genres: selectedGenres }, authHeader);
      socket.emit('vote', { roomCode: code, username, genres: selectedGenres });
      setVoted(true);
      setError('');
    } catch (err) {
      setError('Failed to submit vote');
    }
  };

  const handleGetResults = async () => {
    try {
      await axios.post(`${API_URL}/api/rooms/${code}/results`, {}, authHeader);
      navigate(`/results/${code}`);
    } catch (err) {
      setError('Failed to get results');
    }
  };

  return (
    <div className="room-container">
      <div className="room-header">
        <h1 className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Quorum</h1>
        <div className="room-code-display">Room: <span>{code}</span></div>
      </div>

      <div className="room-card">
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
            <button onClick={handleVote} className="btn-primary">Submit Vote</button>
          </>
        ) : (
          <div className="voted-message">
            <h2>Vote submitted!</h2>
            <p>Waiting for others to vote...</p>
          </div>
        )}

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

        {voted && (
          <button onClick={handleGetResults} className="btn-secondary">Get Movie Recommendations</button>
        )}
      </div>
    </div>
  );
}

export default RoomPage;
