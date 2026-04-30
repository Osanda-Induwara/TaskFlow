import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import TaskModal from '../components/TaskModal';
import '../styles/BoardPage.css';

function BoardPage({ user, onLogout }) {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState({ todo: [], ongoing: [], done: [] });
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    fetchBoard();
    fetchTasks();
    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [boardId]);

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//localhost:5000`;
    
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      const token = localStorage.getItem('token');
      websocket.send(JSON.stringify({
        type: 'JOIN_BOARD',
        boardId,
        payload: { userId: user.id }
      }));
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'TASK_MOVED') {
        updateTasksFromMessage(message.payload);
      }
    };

    setWs(websocket);
  };

  const fetchBoard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/boards/${boardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBoard(response.data);
    } catch (err) {
      setError('Failed to fetch board');
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/tasks/board/${boardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const organized = {
        todo: Array.isArray(response.data) ? response.data.filter(t => t.status === 'todo') : [],
        ongoing: Array.isArray(response.data) ? response.data.filter(t => t.status === 'ongoing') : [],
        done: Array.isArray(response.data) ? response.data.filter(t => t.status === 'done') : []
      };

      setTasks(organized);
      setError('');
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError('Failed to fetch tasks');
      setTasks({ todo: [], ongoing: [], done: [] });
    } finally {
      setLoading(false);
    }
  };

  const updateTasksFromMessage = (payload) => {
    const { taskId, newStatus } = payload;
    setTasks(prev => {
      const newTasks = { ...prev };
      let movedTask = null;

      for (let status in newTasks) {
        const index = newTasks[status].findIndex(t => t._id === taskId);
        if (index !== -1) {
          movedTask = newTasks[status][index];
          newTasks[status].splice(index, 1);
          break;
        }
      }

      if (movedTask) {
        newTasks[newStatus].push(movedTask);
      }

      return newTasks;
    });
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceStatus = source.droppableId;
    const destStatus = destination.droppableId;
    const taskId = draggableId;

    // Ensure source and destination exist in tasks
    if (!tasks[sourceStatus] || !tasks[destStatus]) {
      console.error('Invalid source or destination status');
      return;
    }

    const newTasks = { ...tasks };
    const task = newTasks[sourceStatus][source.index];

    if (!task) {
      console.error('Task not found at index');
      return;
    }

    newTasks[sourceStatus].splice(source.index, 1);
    newTasks[destStatus].splice(destination.index, 0, task);

    setTasks(newTasks);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/tasks/${taskId}`,
        { status: destStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'TASK_MOVED',
          boardId,
          payload: { taskId, newStatus: destStatus }
        }));
      }
    } catch (err) {
      console.error('Failed to update task:', err);
      setError('Failed to update task');
      fetchTasks();
    }
  };

  const handleAddTask = (status) => {
    setSelectedTask(null);
    setShowTaskModal({ status });
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setShowTaskModal({ status: task.status });
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchTasks();
      } catch (err) {
        setError('Failed to delete task');
      }
    }
  };

  const handleSaveTask = async (taskData) => {
    try {
      const token = localStorage.getItem('token');

      if (selectedTask) {
        await axios.put(`/api/tasks/${selectedTask._id}`, taskData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(
          '/api/tasks',
          { ...taskData, boardId },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }

      fetchTasks();
      setShowTaskModal(false);
    } catch (err) {
      setError('Failed to save task');
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  if (loading) {
    return <div className="loading">Loading board...</div>;
  }

  return (
    <div className="page-layout">
      <header className="header">
        <h1>TaskFlow - {board?.title}</h1>
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
        <Sidebar user={user} onLogout={handleLogout} currentPage="boards" />

        <div className="board-container">
          <div className="board-title-section">
            <h2>📊 {board?.title}</h2>
          </div>

          {error && <div className="error-message">{error}</div>}

          {showTaskModal && (
            <TaskModal
              task={selectedTask}
              status={showTaskModal.status}
              onSave={handleSaveTask}
              onClose={() => setShowTaskModal(false)}
            />
          )}

          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="board-columns">
              {['todo', 'ongoing', 'done'].map(status => (
                <div key={status} className="column">
                  <div className="column-header">
                    <h3>
                      {status === 'todo' ? '📝 To Do' : status === 'ongoing' ? '⏳ In Progress' : '✅ Done'}
                      <span className="task-count">{tasks[status]?.length || 0}</span>
                    </h3>
                    <button
                      className="btn btn-small"
                      onClick={() => handleAddTask(status)}
                    >
                      ✚ Add
                    </button>
                  </div>

                  <Droppable droppableId={String(status)} type="TASK">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                      >
                        {(tasks[status] || []).map((task, index) => (
                          <Draggable key={task._id} draggableId={String(task._id)} type="TASK" index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
                              >
                                <div className="task-content">
                                  <h4>{task.title}</h4>
                                  <p>{task.description}</p>
                                </div>
                                <div className="task-meta">
                                  {task.dueDate && (
                                    <div className="task-due-date">
                                      📅 {new Date(task.dueDate).toLocaleDateString()}
                                    </div>
                                  )}
                                  {task.priority && (
                                    <div className={`task-priority priority-${task.priority}`}>
                                      {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'} {task.priority}
                                    </div>
                                  )}
                                </div>
                                <div className="task-actions">
                                  <button
                                    className="btn-edit"
                                    title="Edit task"
                                    onClick={() => handleEditTask(task)}
                                  >
                                    ✎
                                  </button>
                                  <button
                                    className="btn-delete"
                                    title="Delete task"
                                    onClick={() => handleDeleteTask(task._id)}
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
}

export default BoardPage;
