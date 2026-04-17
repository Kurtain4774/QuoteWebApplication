const express = require('express');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /api/users/search?username=x — find users by username (excludes self)
router.get('/search', requireAuth, async (req, res) => {
  const { username } = req.query;
  if (!username?.trim()) return res.json([]);

  try {
    const users = await User.find({
      username: { $regex: username.trim(), $options: 'i' },
      _id: { $ne: req.userId },
    })
      .select('username')
      .limit(10)
      .lean();

    res.json(users);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
