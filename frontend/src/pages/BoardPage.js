import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, PointerSensor, closestCenter, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [currentRole, setCurrentRole] = useState('viewer');
  const [members, setMembers] = useState([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const sensors = useSensors(useSensor(PointerSensor));
  const statuses = useMemo(() => ['todo', 'ongoing', 'done'], []);

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
      setMembers(Array.isArray(response.data.members) ? response.data.members : []);
      setCurrentRole(response.data.currentUserRole || 'viewer');
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

  const findStatusByTaskId = (taskId) => {
    for (const status of statuses) {
      if ((tasks[status] || []).some(t => String(t._id) === String(taskId))) {
        return status;
      }
    }
    return null;
  };

  const getTaskIndex = (status, taskId) => {
    return (tasks[status] || []).findIndex(t => String(t._id) === String(taskId));
  };

  const handleDragEnd = async (event) => {
    if (!canEdit) return;
    const { active, over } = event;

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const sourceStatus = findStatusByTaskId(activeId);
    const destStatus = overId.startsWith('column-')
      ? overId.replace('column-', '')
      : findStatusByTaskId(overId);

    if (!sourceStatus || !destStatus) return;

    const sourceIndex = getTaskIndex(sourceStatus, activeId);
    if (sourceIndex === -1) return;

    const destIndex = overId.startsWith('column-')
      ? (tasks[destStatus] || []).length
      : getTaskIndex(destStatus, overId);

    const newTasks = {
      ...tasks,
      [sourceStatus]: [...(tasks[sourceStatus] || [])],
      [destStatus]: [...(tasks[destStatus] || [])]
    };

    const [movedTask] = newTasks[sourceStatus].splice(sourceIndex, 1);
    if (!movedTask) return;

    const insertIndex = destIndex === -1 ? newTasks[destStatus].length : destIndex;
    newTasks[destStatus].splice(insertIndex, 0, movedTask);

    setTasks(newTasks);

    if (sourceStatus === destStatus) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/tasks/${activeId}`,
        { status: destStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'TASK_MOVED',
          boardId,
          payload: { taskId: activeId, newStatus: destStatus }
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
        console.error('Delete task error:', err.response?.data || err.message);
        const errorMessage = err.response?.data?.message || 'Failed to delete task';
        setError(errorMessage);
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
      console.error('Save task error:', err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || 'Failed to save task';
      setError(errorMessage);
    }
  };

  const handleInviteSubmit = async (event) => {
    event.preventDefault();
    setInviteError('');
    setInviteSuccess('');

    if (!inviteEmail.trim()) {
      setInviteError('Email is required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/invites',
        {
          boardId,
          email: inviteEmail,
          role: inviteRole
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setInviteEmail('');
      setInviteRole('viewer');
      setInviteSuccess('Invite sent');
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Failed to send invite');
    }
  };

  const handleRoleChange = async (memberId, role) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/boards/${boardId}/members/${memberId}`,
        { role },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMembers((prev) =>
        prev.map((member) => {
          const currentId = member.user?._id || member.user || member._id;
          if (String(currentId) !== String(memberId)) return member;
          return { ...member, role };
        })
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Search is handled by filtering the displayed tasks
  };

  const filterTasksBySearch = (taskList) => {
    return taskList.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const stopPropagation = (event) => {
    event.stopPropagation();
  };

  if (loading) {
    return <div className="loading">Loading board...</div>;
  }

  const isOwner = currentRole === 'owner';
  const canEdit = isOwner || currentRole === 'editor';
  const activeSensors = canEdit ? sensors : [];

  const SortableTask = ({ task, hidden }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging
    } = useSortable({ id: String(task._id), disabled: !canEdit });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`task-card ${isDragging ? 'dragging' : ''} ${hidden ? 'hidden-by-search' : ''}`}
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
        {canEdit && (
          <div className="task-actions">
            <button
              className="btn-edit"
              title="Edit task"
              onPointerDown={stopPropagation}
              onClick={(event) => {
                stopPropagation(event);
                handleEditTask(task);
              }}
            >
              ✎
            </button>
            <button
              className="btn-delete"
              title="Delete task"
              onPointerDown={stopPropagation}
              onClick={(event) => {
                stopPropagation(event);
                handleDeleteTask(task._id);
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  };

  const ColumnDroppable = ({ status, children }) => {
    const { isOver, setNodeRef } = useDroppable({ id: `column-${status}` });

    return (
      <div
        ref={setNodeRef}
        className={`task-list ${isOver ? 'dragging-over' : ''}`}
      >
        {children}
      </div>
    );
  };

  return (
    <div className="page-layout">
      <header className="header">
        <h1>TaskFlow - {board?.title}</h1>
        <div className="header-content">
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <div className="search-input-wrapper">
              <input
                type="text"
                className="search-bar"
                placeholder="Search tasks..."
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

          {isOwner && (
            <div className="board-share-panel">
              <div className="share-panel-header">
                <h3>Share Board</h3>
                <button
                  className="btn btn-small"
                  onClick={() => setShowInviteForm(!showInviteForm)}
                >
                  {showInviteForm ? 'Hide' : 'Invite'}
                </button>
              </div>

              {showInviteForm && (
                <form className="share-form" onSubmit={handleInviteSubmit}>
                  <input
                    type="email"
                    placeholder="Invitee email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button type="submit" className="btn btn-primary">
                    Send Invite
                  </button>
                </form>
              )}

              {inviteError && <div className="error-message">{inviteError}</div>}
              {inviteSuccess && <div className="success-message">{inviteSuccess}</div>}

              <div className="member-list">
                <h4>Members</h4>
                {(members || []).length === 0 ? (
                  <p className="empty-members">No members yet</p>
                ) : (
                  (members || []).map((member) => {
                    const memberUser = member.user || {};
                    const memberId = memberUser._id || member.user || member._id;
                    const memberName = memberUser.name || 'Member';
                    const memberEmail = memberUser.email || '';
                    const memberRole = member.role || 'editor';

                    return (
                      <div key={memberId} className="member-row">
                        <div className="member-info">
                          <span className="member-name">{memberName}</span>
                          {memberEmail && <span className="member-email">{memberEmail}</span>}
                        </div>
                        <select
                          value={memberRole}
                          onChange={(e) => handleRoleChange(memberId, e.target.value)}
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {showTaskModal && (
            <TaskModal
              task={selectedTask}
              status={showTaskModal.status}
              onSave={handleSaveTask}
              onClose={() => setShowTaskModal(false)}
            />
          )}

          <DndContext sensors={activeSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="board-columns">
              {statuses.map(status => (
                <div key={status} className="column">
                  <div className="column-header">
                    <h3>
                      {status === 'todo' ? '📝 To Do' : status === 'ongoing' ? '⏳ In Progress' : '✅ Done'}
                      <span className="task-count">{(tasks[status] || []).length}</span>
                    </h3>
                    {canEdit && (
                      <button
                        className="btn btn-small"
                        onClick={() => handleAddTask(status)}
                      >
                        ✚ Add
                      </button>
                    )}
                  </div>

                  <SortableContext
                    items={(tasks[status] || []).map(task => String(task._id))}
                    strategy={verticalListSortingStrategy}
                  >
                    <ColumnDroppable status={status}>
                      {(tasks[status] || []).length === 0 ? (
                        <div className="no-tasks-message">No tasks</div>
                      ) : (
                        (tasks[status] || []).map((task) => {
                          const matchesSearch = !searchTerm || task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            task.description.toLowerCase().includes(searchTerm.toLowerCase());

                          return (
                            <SortableTask
                              key={task._id}
                              task={task}
                              hidden={!matchesSearch}
                            />
                          );
                        })
                      )}
                    </ColumnDroppable>
                  </SortableContext>
                </div>
              ))}
            </div>
          </DndContext>
        </div>
      </div>
    </div>
  );
}

export default BoardPage;
