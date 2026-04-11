import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

function Home() {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const username = localStorage.getItem('username');
  const token = localStorage.getItem('token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const handleCreate = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/rooms/create`, {}, authHeader);
      navigate(`/room/${res.data.code}`);
    } catch (err) {
      setError('Failed to create room');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/rooms/join`, { code: joinCode }, authHeader);
      navigate(`/room/${res.data.code}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Room not found');
    }
  };

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

        <button onClick={handleCreate} className="btn-primary">+ Create Room</button>

        <div className="divider">or</div>

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
