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
  const [showNewBoardForm, setShowNewBoardForm] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [shareBoardId, setShareBoardId] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState('viewer');
  const [shareError, setShareError] = useState('');
  const [shareSuccess, setShareSuccess] = useState('');

  useEffect(() => {
    fetchSharedBoards();
  }, []);

  const fetchSharedBoards = async () => {
    try {
      const token = localStorage.getItem('token');
      const [ownedResponse, sharedResponse] = await Promise.all([
        axios.get('/api/boards', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/boards/shared', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const ownedBoards = Array.isArray(ownedResponse.data) ? ownedResponse.data : [];
      const sharedBoards = Array.isArray(sharedResponse.data) ? sharedResponse.data : [];

      const ownedSharedBoards = ownedBoards
        .filter((board) => board.members && board.members.length > 0)
        .map((board) => ({ ...board, _owned: true }));

      const sharedWithMeBoards = sharedBoards.map((board) => ({ ...board, _owned: false }));

      setBoards([...ownedSharedBoards, ...sharedWithMeBoards]);
      setError('');
    } catch (err) {
      setError('Failed to fetch shared boards');
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

      const newBoard = { ...response.data, _owned: true, _localOnly: true };
      setBoards((prev) => [newBoard, ...prev]);
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
        setBoards((prev) => prev.filter((board) => board._id !== boardId));
      } catch (err) {
        setError('Failed to delete board');
      }
    }
  };

  const handleShareToggle = (boardId) => {
    if (shareBoardId === boardId) {
      setShareBoardId(null);
      setShareEmail('');
      setShareRole('viewer');
      setShareError('');
      setShareSuccess('');
      return;
    }

    setShareBoardId(boardId);
    setShareEmail('');
    setShareRole('viewer');
    setShareError('');
    setShareSuccess('');
  };

  const handleShareSubmit = async (event, boardId) => {
    event.preventDefault();
    setShareError('');
    setShareSuccess('');

    if (!shareEmail.trim()) {
      setShareError('Email is required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/invites',
        {
          boardId,
          email: shareEmail,
          role: shareRole
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setShareSuccess('Invite sent');
      setShareEmail('');
      setShareRole('viewer');
    } catch (err) {
      setShareError(err.response?.data?.message || 'Failed to send invite');
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
    (board.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (board.description || '').toLowerCase().includes(searchTerm.toLowerCase())
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
                    placeholder="Board Title (e.g., Client Handoff)"
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
            {filteredBoards.length === 0 ? (
              <div className="no-boards">
                <p>📋 {searchTerm ? 'No shared boards match your search.' : 'No shared boards yet.'}</p>
              </div>
            ) : (
              filteredBoards.map(board => (
                <div key={board._id} className="board-card">
                  <h3>{board.title}</h3>
                  <p>{board.description || 'No description yet.'}</p>
                  <div className="board-meta">
                    <span>Owner: {board._owned ? 'You' : board.userId?.name || 'Unknown'}</span>
                  </div>
                  {board._owned && shareBoardId === board._id && (
                    <form className="share-form" onSubmit={(event) => handleShareSubmit(event, board._id)}>
                      <input
                        type="email"
                        placeholder="Invitee email"
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                        required
                      />
                      <select value={shareRole} onChange={(e) => setShareRole(e.target.value)}>
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                      <button type="submit" className="btn btn-primary">
                        Send Invite
                      </button>
                    </form>
                  )}
                  {board._owned && shareBoardId === board._id && shareError && (
                    <div className="error-message">{shareError}</div>
                  )}
                  {board._owned && shareBoardId === board._id && shareSuccess && (
                    <div className="success-message">{shareSuccess}</div>
                  )}
                  <div className="board-actions">
                    {board._owned && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleShareToggle(board._id)}
                      >
                        {shareBoardId === board._id ? 'Close Share' : 'Share'}
                      </button>
                    )}
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/board/${board._id}`)}
                    >
                      Open Board
                    </button>
                    {board._owned && (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteBoard(board._id)}
                      >
                        Delete
                      </button>
                    )}
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
