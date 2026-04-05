import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Landing page — the first thing users see
// Handles both login and register in one page
function Landing() {
  // Toggle between login and register form
  const [isLogin, setIsLogin] = useState(true);

  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // useNavigate lets us redirect to another page after login
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents page refresh on form submit
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

      const payload = isLogin
        ? { email, password }
        : { username, email, password };

      const res = await axios.post(`http://localhost:5000${endpoint}`, payload);

      // Save the JWT token and username to localStorage
      // This keeps the user logged in even if they refresh the page
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);

      // Redirect to home page after successful login/register
      navigate('/home');

    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="landing-container">
      <div className="landing-card">
        {/* Logo */}
        <button className="back-btn" onClick={() => navigate('/')}>← Back</button>
        <h1 className="logo">Quorum</h1>
        <p className="tagline">Find the movie your group actually agrees on.</p>

        {/* Toggle between Login and Register */}
        <div className="toggle-row">
          <button
            className={isLogin ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            className={!isLogin ? 'toggle-btn active' : 'toggle-btn'}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Only show username field on register */}
          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          {/* Show error message if something went wrong */}
          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn-primary">
            {isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Landing;
