import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Sidebar.css';

function Sidebar({ user, onLogout, currentPage }) {
  const navigate = useNavigate();

  const handleProtectedNavigation = (path) => {
    if (!user) {
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  return (
    <div className="sidebar">
      <Link
        to="/"
        className={`sidebar-item ${currentPage === 'home' ? 'active' : ''}`}
      >
        Home
      </Link>
      <button
        className={`sidebar-item ${currentPage === 'boards' ? 'active' : ''}`}
        onClick={() => handleProtectedNavigation('/boards')}
      >
        My Boards
      </button>
      <button
        className={`sidebar-item ${currentPage === 'calendar' ? 'active' : ''}`}
        onClick={() => handleProtectedNavigation('/calendar')}
      >
        Calendar
      </button>
    </div>
  );
}

export default Sidebar;
