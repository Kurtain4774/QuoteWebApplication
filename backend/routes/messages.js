const express = require('express');
const Message = require('../models/Message');
const Friend = require('../models/Friend');
const requireAuth = require('../middleware/auth');

const router = express.Router();

async function areFriends(userA, userB) {
  const record = await Friend.findOne({
    status: 'accepted',
    $or: [
      { from: userA, to: userB },
      { from: userB, to: userA },
    ],
  });
  return !!record;
}

// GET /api/messages/:userId — conversation between current user and :userId
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    if (!(await areFriends(req.userId, req.params.userId))) {
      return res.status(403).json({ error: 'Not friends' });
    }

    const messages = await Message.find({
      $or: [
        { from: req.userId, to: req.params.userId },
        { from: req.params.userId, to: req.userId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    res.json(messages);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/messages/:userId — send a message
router.post('/:userId', requireAuth, async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Message cannot be empty' });

  try {
    if (!(await areFriends(req.userId, req.params.userId))) {
      return res.status(403).json({ error: 'Not friends' });
    }

    const message = await Message.create({
      from: req.userId,
      to: req.params.userId,
      text: text.trim(),
    });
    res.status(201).json(message);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
