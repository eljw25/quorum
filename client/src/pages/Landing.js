import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

function Landing() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin ? { email, password } : { username, email, password };
      const res = await axios.post(`${API_URL}${endpoint}`, payload);

      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      navigate('/home');

    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="landing-container">
      <div className="landing-card">
        <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
        <h1 className="logo">Quorum</h1>
        <p className="tagline">Find the movie your group actually agrees on.</p>

        <div className="toggle-row">
          <button className={isLogin ? 'toggle-btn active' : 'toggle-btn'} onClick={() => setIsLogin(true)}>Login</button>
          <button className={!isLogin ? 'toggle-btn active' : 'toggle-btn'} onClick={() => setIsLogin(false)}>Register</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          )}
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn-primary">{isLogin ? 'Login' : 'Create Account'}</button>
        </form>
      </div>
    </div>
  );
}

export default Landing;
