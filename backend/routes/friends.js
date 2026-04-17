const express = require('express');
const Friend = require('../models/Friend');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /api/friends — accepted friends + incoming pending requests
router.get('/', requireAuth, async (req, res) => {
  try {
    const [accepted, incoming] = await Promise.all([
      Friend.find({
        status: 'accepted',
        $or: [{ from: req.userId }, { to: req.userId }],
      }).populate('from to', 'username'),

      Friend.find({ to: req.userId, status: 'pending' })
        .populate('from', 'username'),
    ]);

    const friends = accepted.map((f) => {
      const other = f.from._id.toString() === req.userId.toString() ? f.to : f.from;
      return { _id: f._id, user: other };
    });

    const requests = incoming.map((f) => ({ _id: f._id, from: f.from }));

    res.json({ friends, requests });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/friends/request/:userId — send a friend request
router.post('/request/:userId', requireAuth, async (req, res) => {
  if (req.params.userId === req.userId.toString()) {
    return res.status(400).json({ error: 'Cannot add yourself' });
  }
  try {
    // Check for an existing relationship in either direction
    const exists = await Friend.findOne({
      $or: [
        { from: req.userId, to: req.params.userId },
        { from: req.params.userId, to: req.userId },
      ],
    });
    if (exists) return res.status(409).json({ error: 'Request already exists' });

    const req_ = await Friend.create({ from: req.userId, to: req.params.userId });
    res.status(201).json(req_);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/friends/accept/:requestId — accept a pending request
router.post('/accept/:requestId', requireAuth, async (req, res) => {
  try {
    const request = await Friend.findById(req.params.requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.to.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Not your request' });
    }

    request.status = 'accepted';
    await request.save();
    res.json(request);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/friends/:id — remove friend or decline request
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const record = await Friend.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Not found' });

    const uid = req.userId.toString();
    if (record.from.toString() !== uid && record.to.toString() !== uid) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await record.deleteOne();
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
