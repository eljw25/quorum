import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Landing from './pages/Landing';
import Home from './pages/Home';
import RoomPage from './pages/RoomPage';
import Results from './pages/Results';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<Landing />} />
        <Route path="/home" element={<Home />} />
        <Route path="/room/:code" element={<RoomPage />} />
        <Route path="/results/:code" element={<Results />} />
      </Routes>
    </Router>
  );
}

export default App;
