import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import '../styles/MyBoardsPage.css';

function MyBoardsPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewBoardForm, setShowNewBoardForm] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/boards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBoards(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch boards');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();

    if (!newBoardTitle.trim()) {
      setError('Board title is required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/boards',
        {
          title: newBoardTitle,
          description: newBoardDescription
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setBoards([...boards, response.data]);
      setNewBoardTitle('');
      setNewBoardDescription('');
      setShowNewBoardForm(false);
    } catch (err) {
      setError('Failed to create board');
    }
  };

  const handleDeleteBoard = async (boardId) => {
    if (window.confirm('Are you sure you want to delete this board?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/boards/${boardId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBoards(boards.filter(b => b._id !== boardId));
      } catch (err) {
        setError('Failed to delete board');
      }
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  if (loading) {
    return <div className="loading">Loading boards...</div>;
  }

  return (
    <div className="page-layout">
      <header className="header">
        <h1>TaskFlow</h1>
        <div className="header-content">
          <form className="search-form">
            <div className="search-input-wrapper">
              <input type="text" className="search-bar" placeholder="Search boards..." />
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
        <Sidebar user={user} onLogout={handleLogout} currentPage="boards" />
        
        <div className="boards-container">
          <div className="boards-header">
            <h2>My Boards</h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowNewBoardForm(!showNewBoardForm)}
            >
              ✚ New Board
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {showNewBoardForm && (
            <div className="new-board-form">
              <form onSubmit={handleCreateBoard}>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Board Title (e.g., Q4 Project)"
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <textarea
                    placeholder="Board Description (optional)"
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                  />
                </div>
                <div className="form-buttons">
                  <button type="submit" className="btn btn-primary">
                    Create Board
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowNewBoardForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="boards-grid">
            {boards.length === 0 ? (
              <div className="no-boards">
                <p>📋 No boards yet. Create one to get started.</p>
              </div>
            ) : (
              boards.map(board => (
                <div key={board._id} className="board-card">
                  <h3>{board.title}</h3>
                  <p>{board.description}</p>
                  <div className="board-meta">
                    <span>Last updated: Today</span>
                  </div>
                  <div className="board-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/board/${board._id}`)}
                    >
                      Open Board
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteBoard(board._id)}
                    >
                      Delete
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

export default MyBoardsPage;
