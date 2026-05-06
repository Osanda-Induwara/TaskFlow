import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/MyBoardsPage.css';

function AcceptInvitePage({ user }) {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetchInvite();
  }, [token]);

  const fetchInvite = async () => {
    try {
      const response = await axios.get(`/api/invites/${token}`);
      setInvite(response.data);
      setError('');
    } catch (err) {
      setError('Invite is invalid or expired');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user) return;

    try {
      setAccepting(true);
      const tokenValue = localStorage.getItem('token');
      const response = await axios.post(
        `/api/invites/${token}/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${tokenValue}` }
        }
      );
      navigate(`/board/${response.data.boardId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invite');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading invite...</div>;
  }

  return (
    <div className="page-layout">
      <header className="header">
        <h1>TaskFlow</h1>
      </header>

      <div className="app-container">
        <div className="boards-container">
          <div className="boards-header">
            <h2>Board Invite</h2>
          </div>

          {error && <div className="error-message">{error}</div>}

          {invite && !error && (
            <div className="new-board-form">
              <p>
                <strong>{invite.invitedBy?.name || 'Someone'}</strong> invited you to join
                <strong> {invite.boardId?.title}</strong> as a <strong>{invite.role}</strong>.
              </p>

              {!user ? (
                <div className="form-buttons">
                  <Link className="btn btn-primary" to={`/login?redirect=/accept-invite/${token}`}>
                    Log in to accept
                  </Link>
                </div>
              ) : (
                <div className="form-buttons">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAccept}
                    disabled={accepting}
                  >
                    {accepting ? 'Accepting...' : 'Accept Invite'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AcceptInvitePage;
