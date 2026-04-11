import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import '../styles/HomePage.css';

function HomePage({ user, onLogout }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const featuresRef = useRef(null);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogout = () => {
    onLogout();
  };

  const handleSearch = (e) => {
    e.preventDefault();
  };

  return (
    <div className="page-layout">
      <header className="header">
        <h1>TaskFlow</h1>
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-wrapper">
            <input
              type="text"
              className="search-bar"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
          </div>
        </form>
        <div className="auth-buttons">
          {user ? (
            <>
              <span className="user-name">Welcome, {user.name}</span>
              <button className="btn btn-secondary" onClick={() => navigate('/boards')}>
                My Boards
              </button>
              <button className="btn btn-danger" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      <div className="home-container">
        <section className="hero-section">
          <div className="hero-content">
            <h2>Organize Your Work</h2>
            <p>A beautiful and powerful task management system to help you stay on top of your projects and collaborate seamlessly with your team.</p>
            <div className="cta-buttons">
              {user ? (
                <Link to="/boards" className="btn-lg btn-primary">
                  Go to My Boards
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-lg btn-primary">
                    Get Started
                  </Link>
                  <button onClick={scrollToFeatures} className="btn-lg btn-secondary" style={{ border: 'none', cursor: 'pointer' }}>
                    Learn More
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="features-section" ref={featuresRef}>
          <h3>Features</h3>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <img src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=300&h=300&fit=crop" alt="Kanban Boards" />
              </div>
              <h4>Kanban Boards</h4>
              <p>Visualize your workflow with intuitive drag-and-drop Kanban boards. Organize tasks by status and move them effortlessly.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <img src="https://images.pexels.com/photos/5408818/pexels-photo-5408818.jpeg" alt="Calendar View" />
              </div>
              <h4>Calendar View</h4>
              <p>See all your tasks in a calendar format. Plan ahead and manage deadlines effectively with visual time management.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=300&fit=crop" alt="Collaboration" />
              </div>
              <h4>Collaboration</h4>
              <p>Work together with your team in real-time. Share boards, assign tasks, and stay synchronized on project progress.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default HomePage;
