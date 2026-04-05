import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Home page — logged in users can create or join a room here
function Home() {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Get the username from localStorage to display a greeting
  const username = localStorage.getItem('username');

  // Get the JWT token from localStorage to send with requests
  const token = localStorage.getItem('token');

  // Auth header sent with every protected request
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  // Create a new room and navigate into it
  const handleCreate = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/rooms/create', {}, authHeader);
      navigate(`/room/${res.data.code}`);
    } catch (err) {
      setError('Failed to create room');
    }
  };

  // Join an existing room by code
  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/rooms/join', { code: joinCode }, authHeader);
      navigate(`/room/${res.data.code}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Room not found');
    }
  };

  // Log out — clear localStorage and go back to landing page
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1 className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Quorum</h1>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </div>

      <div className="home-card">
        <h2>Welcome, {username}!</h2>
        <p>Create a room and share the code with your friends, or join an existing one.</p>

        {error && <p className="error">{error}</p>}

        {/* Create Room */}
        <button onClick={handleCreate} className="btn-primary">
          + Create Room
        </button>

        <div className="divider">or</div>

        {/* Join Room */}
        <form onSubmit={handleJoin} className="join-form">
          <input
            type="text"
            placeholder="Enter room code"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            required
          />
          <button type="submit" className="btn-secondary">Join Room</button>
        </form>
      </div>
    </div>
  );
}

export default Home;
