const express = require('express');
const mongoose = require('mongoose');
const { z } = require('zod');
const Message = require('../models/Message');
const Friend = require('../models/Friend');
const requireAuth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const objectIdSchema = z.string().refine(
  (v) => mongoose.Types.ObjectId.isValid(v),
  'Invalid id'
);

const userIdParamsSchema = z.object({ userId: objectIdSchema });
const messageBodySchema  = z.object({
  text: z.string().trim().min(1, 'Message cannot be empty').max(2000),
});

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

// GET /api/messages/:userId — conversation between current user and :userId.
// Returns the most recent N messages, in chronological order, for a finite payload.
const CONVERSATION_LIMIT = 200;

router.get('/:userId', requireAuth, validate({ params: userIdParamsSchema }), async (req, res) => {
  if (!(await areFriends(req.userId, req.params.userId))) {
    return res.status(403).json({ error: 'Not friends' });
  }

  // Sort desc + limit to grab the latest N efficiently using the index,
  // then reverse so the frontend still receives oldest-first.
  const recent = await Message.find({
    $or: [
      { from: req.userId, to: req.params.userId },
      { from: req.params.userId, to: req.userId },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(CONVERSATION_LIMIT)
    .lean();

  res.json(recent.reverse());
});

// POST /api/messages/:userId — send a message
router.post(
  '/:userId',
  requireAuth,
  validate({ params: userIdParamsSchema, body: messageBodySchema }),
  async (req, res) => {
    if (!(await areFriends(req.userId, req.params.userId))) {
      return res.status(403).json({ error: 'Not friends' });
    }

    const message = await Message.create({
      from: req.userId,
      to: req.params.userId,
      text: req.body.text,
    });
    res.status(201).json(message);
  }
);

module.exports = router;
