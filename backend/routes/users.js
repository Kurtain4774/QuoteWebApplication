const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Quote = require('../models/Quote');
const Friend = require('../models/Friend');
const Message = require('../models/Message');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /api/users/preferences — fetch the current user's theme preferences
router.get('/preferences', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('preferences').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ preferences: user.preferences || {} });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

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

// PUT /api/users/username — change username
router.put('/username', requireAuth, async (req, res) => {
  const { username } = req.body;
  if (!username?.trim()) return res.status(400).json({ error: 'Username is required' });

  try {
    const taken = await User.findOne({ username: username.trim(), _id: { $ne: req.userId } });
    if (taken) return res.status(409).json({ error: 'Username is already taken' });

    const user = await User.findByIdAndUpdate(
      req.userId,
      { username: username.trim() },
      { new: true }
    ).select('-password');

    res.json({ username: user.username });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/password — change password
router.put('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new passwords are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  try {
    const user = await User.findById(req.userId);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: 'Password updated' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/users/preferences — update theme/fontSize
router.put('/preferences', requireAuth, async (req, res) => {
  const { theme, customBg, customText, fontSize } = req.body;

  const update = {};
  if (theme) update['preferences.theme'] = theme;
  if (customBg) update['preferences.customBg'] = customBg;
  if (customText) update['preferences.customText'] = customText;
  if (fontSize) update['preferences.fontSize'] = fontSize;

  try {
    await User.findByIdAndUpdate(req.userId, { $set: update });
    res.json({ message: 'Preferences saved' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/users/account — permanently delete account and all associated data
router.delete('/account', requireAuth, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password is required to delete account' });

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Incorrect password' });

    // Delete all user data
    await Quote.deleteMany({ creator: req.userId });
    await Quote.updateMany(
      { savedBy: req.userId },
      { $pull: { savedBy: req.userId } }
    );
    await Friend.deleteMany({ $or: [{ requester: req.userId }, { recipient: req.userId }] });
    await Message.deleteMany({ $or: [{ sender: req.userId }, { recipient: req.userId }] });
    await User.findByIdAndDelete(req.userId);

    res.json({ message: 'Account deleted' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
