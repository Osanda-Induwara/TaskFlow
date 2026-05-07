const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Board = require('../models/Board');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

const getIdValue = (value) => {
  if (!value) return null;
  if (value._id) return value._id.toString();
  if (value.toString) return value.toString();
  return String(value);
};

router.post('/', authenticateToken, [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description } = req.body;
  const isShared = req.body.isShared === true;

  try {
    const board = new Board({
      title,
      description,
      userId: req.user.userId,
      members: [],
      isShared
    });

    await board.save();
    res.status(201).json(board);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const boards = await Board.find({ userId: req.user.userId })
      .populate('userId', 'name email');

    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.get('/shared', authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.userId || !mongoose.Types.ObjectId.isValid(req.user.userId)) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const boards = await Board.find({
      userId: { $ne: userId },
      $or: [
        { 'members.user': userId },
        { members: userId }
      ]
    }).populate('userId', 'name email');

    res.json(boards);
  } catch (error) {
    console.error('Shared boards error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('members.user', 'name email');

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const ownerId = getIdValue(board.userId);
    const isOwner = ownerId === req.user.userId;
    const isMember = (board.members || []).some((entry) => {
      if (!entry) return false;
      const memberId = getIdValue(entry.user || entry);
      return memberId === req.user.userId;
    });

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Not authorized to access this board' });
    }

    let currentUserRole = 'viewer';
    if (isOwner) {
      currentUserRole = 'owner';
    } else {
      const member = (board.members || []).find((entry) => {
        if (!entry) return false;
        const memberId = getIdValue(entry.user || entry);
        return memberId === req.user.userId;
      });
      currentUserRole = member && member.role ? member.role : 'editor';
    }

    res.json({ ...board.toObject(), currentUserRole });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.put('/:id/members/:memberId', authenticateToken, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['viewer', 'editor'].includes(role)) {
      return res.status(400).json({ message: 'Role must be viewer or editor' });
    }

    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const ownerId = getIdValue(board.userId);
    if (ownerId !== req.user.userId) {
      return res.status(403).json({ message: 'Only the board owner can update roles' });
    }

    const memberIndex = (board.members || []).findIndex((entry) => {
      if (!entry) return false;
      const memberId = getIdValue(entry.user || entry);
      return memberId === req.params.memberId;
    });

    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const currentMember = board.members[memberIndex];
    if (currentMember.user) {
      currentMember.role = role;
    } else {
      board.members[memberIndex] = { user: currentMember, role };
    }
    board.updatedAt = Date.now();

    await board.save();
    res.json({ message: 'Role updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const ownerId = getIdValue(board.userId);
    if (ownerId !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    board.title = req.body.title || board.title;
    board.description = req.body.description || board.description;
    board.updatedAt = Date.now();

    await board.save();
    res.json(board);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const ownerId = getIdValue(board.userId);
    if (ownerId !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Board.findByIdAndDelete(req.params.id);
    res.json({ message: 'Board deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
