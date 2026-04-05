import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import API_URL from '../config';

function Results() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [topGenres, setTopGenres] = useState([]);
  const [genreScores, setGenreScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/rooms/${code}`,
          authHeader
        );

        const room = res.data;
        setMovies(room.results);

        // Calculate genre vote counts from the votes array
        // Same algorithm as the backend — count how many people picked each genre
        const genreCount = {};
        room.votes.forEach(vote => {
          vote.genres.forEach(genre => {
            genreCount[genre] = (genreCount[genre] || 0) + 1;
          });
        });

        // Sort by vote count descending
        const sorted = Object.entries(genreCount)
          .sort((a, b) => b[1] - a[1]);

        setGenreScores(Object.fromEntries(sorted));
        setTopGenres(sorted.slice(0, 2).map(e => e[0]));
        setLoading(false);

      } catch (err) {
        setError('Failed to load results');
        setLoading(false);
      }
    };

    fetchResults();
  }, [code]);

  const totalVoters = Object.values(genreScores).length > 0
    ? Math.max(...Object.values(genreScores))
    : 1;

  return (
    <div className="results-container">
      <div className="results-header">
        <h1 className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Quorum</h1>
        <button onClick={() => navigate('/home')} className="btn-secondary" style={{ width: 'auto' }}>
          New Room
        </button>
      </div>

      {loading && <p style={{ color: 'var(--muted)' }}>Loading results...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && (
        <div className="results-content">
          <h2>Tonight's picks for Room <span>{code}</span></h2>

          {/* Genre vote breakdown */}
          {Object.keys(genreScores).length > 0 && (
            <div className="genre-breakdown">
              <h3>How the group voted</h3>
              {Object.entries(genreScores).map(([genre, count]) => (
                <div key={genre} className="genre-bar-row">
                  <span className="genre-bar-label">
                    {genre}
                    {topGenres.includes(genre) && (
                      <span className="winner-badge">top pick</span>
                    )}
                  </span>
                  <div className="genre-bar-track">
                    <div
                      className="genre-bar-fill"
                      style={{ width: `${(count / totalVoters) * 100}%` }}
                    />
                  </div>
                  <span className="genre-bar-count">
                    {count} {count === 1 ? 'vote' : 'votes'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Movie results */}
          <div className="movies-section">
            <h3>
              Movies matching <strong>{topGenres.join(' & ')}</strong>
            </h3>
            <div className="movies-grid">
              {movies.map(movie => (
                <div key={movie.id} className="movie-card">
                  {movie.poster && (
                    <img src={movie.poster} alt={movie.title} className="movie-poster" />
                  )}
                  <div className="movie-info">
                    <h3>{movie.title}</h3>
                    <p className="movie-rating">⭐ {movie.rating?.toFixed(1)}</p>
                    <p className="movie-date">{movie.releaseDate?.split('-')[0]}</p>
                    <p className="movie-overview">{movie.overview}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Results;
