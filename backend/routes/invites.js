const express = require('express');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const Invite = require('../models/Invite');
const Board = require('../models/Board');
const User = require('../models/User');
const authenticateToken = require('../middleware/auth');
const { sendInviteEmail } = require('../utils/emailService');

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

router.post(
  '/',
  authenticateToken,
  [
    body('boardId').notEmpty().withMessage('Board ID is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').optional().isIn(['viewer', 'editor']).withMessage('Role must be viewer or editor')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { boardId, email, role } = req.body;

    try {
      const board = await Board.findById(boardId).populate('userId', 'name email');
      if (!board) {
        return res.status(404).json({ message: 'Board not found' });
      }

      if (board.userId.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'Only the board owner can send invites' });
      }

      const normalizedEmail = email.toLowerCase();
      const existingUser = await User.findOne({ email: normalizedEmail });

      if (existingUser) {
        const existingRole = getMemberRole(board, existingUser._id.toString());
        if (existingRole) {
          return res.status(400).json({ message: 'User is already a member of this board' });
        }
      }

      const token = crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

      const invite = new Invite({
        boardId,
        email: normalizedEmail,
        role: role || 'viewer',
        token,
        invitedBy: req.user.userId,
        expiresAt
      });

      await invite.save();

      const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const inviteLink = `${frontendBaseUrl}/accept-invite/${token}`;

      await sendInviteEmail({
        to: normalizedEmail,
        inviteLink,
        boardTitle: board.title,
        inviterName: board.userId.name || 'A teammate',
        role: invite.role
      });

      res.status(201).json({ message: 'Invite sent', invite });
    } catch (error) {
      console.error('Error creating invite:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

router.get('/:token', async (req, res) => {
  try {
    const invite = await Invite.findOne({ token: req.params.token })
      .populate('boardId', 'title description')
      .populate('invitedBy', 'name email');

    if (!invite) {
      return res.status(404).json({ message: 'Invite not found' });
    }

    if (invite.status !== 'pending' || invite.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invite is no longer valid' });
    }

    res.json(invite);
  } catch (error) {
    console.error('Error fetching invite:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:token/accept', authenticateToken, async (req, res) => {
  try {
    const invite = await Invite.findOne({ token: req.params.token })
      .populate('boardId');

    if (!invite) {
      return res.status(404).json({ message: 'Invite not found' });
    }

    if (invite.status !== 'pending' || invite.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invite is no longer valid' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      return res.status(403).json({ message: 'Invite email does not match your account' });
    }

    const board = invite.boardId;
    const existingRole = getMemberRole(board, user._id.toString());

    if (!existingRole) {
      board.members = board.members || [];
      board.members.push({ user: user._id, role: invite.role || 'viewer' });
      board.updatedAt = Date.now();
      await board.save();
    }

    invite.status = 'accepted';
    await invite.save();

    res.json({ message: 'Invite accepted', boardId: board._id });
  } catch (error) {
    console.error('Error accepting invite:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
