import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import '../styles/MyBoardsPage.css';

function SharedBoardsPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSharedBoards();
  }, []);

  const fetchSharedBoards = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/boards/shared', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBoards(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch shared boards');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const filteredBoards = boards.filter(board =>
    board.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    board.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Loading boards...</div>;
  }

  return (
    <div className="page-layout">
      <header className="header">
        <h1>TaskFlow</h1>
        <div className="header-content">
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <div className="search-input-wrapper">
              <input
                type="text"
                className="search-bar"
                placeholder="Search shared boards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="search-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>
            </div>
          </form>
        </div>
        <div className="auth-buttons">
          <span className="user-name">Welcome, {user.name}</span>
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="app-container">
        <Sidebar user={user} onLogout={handleLogout} currentPage="shared-boards" />

        <div className="boards-container">
          <div className="boards-header">
            <h2>Shared Boards</h2>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="boards-grid">
            {filteredBoards.length === 0 ? (
              <div className="no-boards">
                <p>📋 {searchTerm ? 'No shared boards match your search.' : 'No shared boards yet.'}</p>
              </div>
            ) : (
              filteredBoards.map(board => (
                <div key={board._id} className="board-card">
                  <h3>{board.title}</h3>
                  <p>{board.description}</p>
                  <div className="board-meta">
                    <span>Owner: {board.userId?.name || 'Unknown'}</span>
                  </div>
                  <div className="board-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/board/${board._id}`)}
                    >
                      Open Board
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SharedBoardsPage;
