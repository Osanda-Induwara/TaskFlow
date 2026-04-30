import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import '../styles/CalendarPage.css';

function CalendarPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchAllTasks();
  }, []);

  const fetchAllTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const boardsResponse = await axios.get('/api/boards', {
        headers: { Authorization: `Bearer ${token}` }
      });

      let allTasks = [];
      for (const board of boardsResponse.data) {
        const tasksResponse = await axios.get(`/api/tasks/board/${board._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        allTasks = [...allTasks, ...tasksResponse.data];
      }

      setTasks(allTasks);
    } catch (err) {
      console.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];
    const today = new Date();

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`}></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const isToday = date.getDate() === today.getDate() &&
                      date.getMonth() === today.getMonth() &&
                      date.getFullYear() === today.getFullYear();
      
      const dayTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return (
          taskDate.getDate() === i &&
          taskDate.getMonth() === currentMonth.getMonth() &&
          taskDate.getFullYear() === currentMonth.getFullYear()
        );
      });

      days.push(
        <div key={i} className={`calendar-day ${dayTasks.length > 0 ? 'has-tasks' : ''} ${isToday ? 'today' : ''}`}>
          <div className="day-number">{i}</div>
          <div className="day-tasks">
            {dayTasks.slice(0, 2).map(task => (
              <div key={task._id} className="task-indicator">
                {task.title.substring(0, 10)}...
              </div>
            ))}
            {dayTasks.length > 2 && <div className="more-tasks">+{dayTasks.length - 2}</div>}
          </div>
        </div>
      );
    }

    return days;
  };

  const handleLogout2 = () => {
    onLogout();
    navigate('/');
  };

  if (loading) {
    return <div className="loading">Loading calendar...</div>;
  }

  return (
    <div className="page-layout">
      <header className="header">
        <h1>TaskFlow - Calendar</h1>
        <div className="header-content">
          <form className="search-form">
            <div className="search-input-wrapper">
              <input type="text" className="search-bar" placeholder="Search tasks..." />
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
          <button className="btn btn-danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="app-container">
        <Sidebar user={user} onLogout={handleLogout2} currentPage="calendar" />

        <div className="calendar-container">
              <div className="calendar-header">
                <div>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="btn btn-secondary"
                  >
                    ← Previous
                  </button>
                </div>
                <h2>
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <div>
                  <button
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="btn btn-secondary"
                  >
                    Next →
                  </button>
                </div>
              </div>

              <div className="calendar-wrapper">
                <div className="calendar-weekdays">
                  <div className="weekday">Sun</div>
                  <div className="weekday">Mon</div>
                  <div className="weekday">Tue</div>
                  <div className="weekday">Wed</div>
                  <div className="weekday">Thu</div>
                  <div className="weekday">Fri</div>
                  <div className="weekday">Sat</div>
                </div>

                <div className="calendar-days">
                  {renderCalendar()}
                </div>

                <div className="calendar-legend">
                  <div className="legend-item">
                    <div className="legend-color" style={{background: 'linear-gradient(135deg, var(--primary), var(--secondary))'}}></div>
                    Today
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{background: 'rgba(0, 102, 204, 0.08)'}}></div>
                    With Tasks
                  </div>
                </div>
              </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;
