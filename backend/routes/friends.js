const express = require('express');
const mongoose = require('mongoose');
const { z } = require('zod');
const Friend = require('../models/Friend');
const requireAuth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const objectIdSchema = z.string().refine(
  (v) => mongoose.Types.ObjectId.isValid(v),
  'Invalid id'
);

const userIdParamsSchema  = z.object({ userId: objectIdSchema });
const requestIdParamsSchema = z.object({ requestId: objectIdSchema });
const idParamsSchema = z.object({ id: objectIdSchema });

// GET /api/friends — accepted friends + incoming pending requests.
// Hard-capped to keep response size predictable; portfolio scale will never approach these.
const FRIENDS_LIMIT = 200;
const REQUESTS_LIMIT = 100;

router.get('/', requireAuth, async (req, res) => {
  const [accepted, incoming] = await Promise.all([
    Friend.find({
      status: 'accepted',
      $or: [{ from: req.userId }, { to: req.userId }],
    })
      .sort({ updatedAt: -1 })
      .limit(FRIENDS_LIMIT)
      .populate('from to', 'username'),

    Friend.find({ to: req.userId, status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(REQUESTS_LIMIT)
      .populate('from', 'username'),
  ]);

  const friends = accepted.map((f) => {
    const other = f.from._id.toString() === req.userId.toString() ? f.to : f.from;
    return { _id: f._id, user: other };
  });

  const requests = incoming.map((f) => ({ _id: f._id, from: f.from }));

  res.json({ friends, requests });
});

// POST /api/friends/request/:userId — send a friend request
router.post('/request/:userId', requireAuth, validate({ params: userIdParamsSchema }), async (req, res) => {
  if (req.params.userId === req.userId.toString()) {
    return res.status(400).json({ error: 'Cannot add yourself' });
  }

  const exists = await Friend.findOne({
    $or: [
      { from: req.userId, to: req.params.userId },
      { from: req.params.userId, to: req.userId },
    ],
  });
  if (exists) return res.status(409).json({ error: 'Request already exists' });

  const record = await Friend.create({ from: req.userId, to: req.params.userId });
  res.status(201).json(record);
});

// POST /api/friends/accept/:requestId — accept a pending request
router.post('/accept/:requestId', requireAuth, validate({ params: requestIdParamsSchema }), async (req, res) => {
  const request = await Friend.findById(req.params.requestId);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.to.toString() !== req.userId.toString()) {
    return res.status(403).json({ error: 'Not your request' });
  }

  request.status = 'accepted';
  await request.save();
  res.json(request);
});

// DELETE /api/friends/:id — remove friend or decline request
router.delete('/:id', requireAuth, validate({ params: idParamsSchema }), async (req, res) => {
  const record = await Friend.findById(req.params.id);
  if (!record) return res.status(404).json({ error: 'Not found' });

  const uid = req.userId.toString();
  if (record.from.toString() !== uid && record.to.toString() !== uid) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  await record.deleteOne();
  res.json({ success: true });
});

module.exports = router;
