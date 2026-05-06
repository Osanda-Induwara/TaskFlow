const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Board = require('../models/Board');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

const getMemberRole = (board, userId) => {
  const member = (board.members || []).find((entry) => {
    if (!entry) return false;
    if (entry.user) {
      return entry.user.toString() === userId;
    }
    return entry.toString && entry.toString() === userId;
  });

  if (!member) return null;
  if (member.role) return member.role;
  return 'editor';
};

router.post('/', authenticateToken, [
  body('title').notEmpty().withMessage('Title is required'),
  body('boardId').notEmpty().withMessage('Board ID is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, boardId, dueDate, priority } = req.body;

  try {
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const isOwner = board.userId.toString() === req.user.userId;
    const memberRole = getMemberRole(board, req.user.userId);
    const canEdit = isOwner || memberRole === 'editor';

    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to create tasks in this board' });
    }

    const task = new Task({
      title,
      description,
      boardId,
      dueDate,
      priority,
      assignedTo: req.user.userId
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/board/:boardId', authenticateToken, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const isOwner = board.userId.toString() === req.user.userId;
    const memberRole = getMemberRole(board, req.user.userId);
    const canView = isOwner || memberRole === 'editor' || memberRole === 'viewer';

    if (!canView) {
      return res.status(403).json({ message: 'You do not have permission to view tasks in this board' });
    }

    const tasks = await Task.find({ boardId: req.params.boardId })
      .populate('assignedTo', 'name email');

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify user has access to the board this task belongs to
    const board = await Board.findById(task.boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const isOwner = board.userId.toString() === req.user.userId;
    const memberRole = getMemberRole(board, req.user.userId);
    const canEdit = isOwner || memberRole === 'editor';

    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to update this task' });
    }

    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.status = req.body.status || task.status;
    task.dueDate = req.body.dueDate || task.dueDate;
    task.priority = req.body.priority || task.priority;
    task.assignedTo = req.body.assignedTo || task.assignedTo;
    task.updatedAt = Date.now();

    await task.save();
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Verify user has access to the board this task belongs to
    const board = await Board.findById(task.boardId);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const isOwner = board.userId.toString() === req.user.userId;
    const memberRole = getMemberRole(board, req.user.userId);
    const canEdit = isOwner || memberRole === 'editor';

    if (!canEdit) {
      return res.status(403).json({ message: 'You do not have permission to delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
