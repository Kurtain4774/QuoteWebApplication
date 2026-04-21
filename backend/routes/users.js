const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const User = require('../models/User');
const Quote = require('../models/Quote');
const Friend = require('../models/Friend');
const Message = require('../models/Message');
const requireAuth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

const usernameSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters').max(30),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .max(128)
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color like #abcdef');
const preferencesSchema = z.object({
  theme:      z.enum(['light', 'dark', 'custom']).optional(),
  customBg:   hexColor.optional(),
  customText: hexColor.optional(),
  fontSize:   z.enum(['small', 'medium', 'large']).optional(),
});

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required to delete account'),
});

// GET /api/users/preferences
router.get('/preferences', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select('preferences').lean();
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ preferences: user.preferences || {} });
});

// GET /api/users/search?username=x
router.get('/search', requireAuth, async (req, res) => {
  const { username } = req.query;
  if (typeof username !== 'string' || !username.trim()) return res.json([]);

  const users = await User.find({
    username: { $regex: escapeRegex(username.trim()), $options: 'i' },
    _id: { $ne: req.userId },
  })
    .select('username')
    .limit(10)
    .lean();

  res.json(users);
});

// PUT /api/users/username
router.put('/username', requireAuth, validate({ body: usernameSchema }), async (req, res) => {
  const { username } = req.body;

  const taken = await User.findOne({ username, _id: { $ne: req.userId } });
  if (taken) return res.status(409).json({ error: 'Username is already taken' });

  const user = await User.findByIdAndUpdate(req.userId, { username }, { new: true }).select('-password');
  res.json({ username: user.username });
});

// PUT /api/users/password
router.put('/password', requireAuth, validate({ body: passwordSchema }), async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.userId);
  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) return res.status(401).json({ error: 'Current password is incorrect' });

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  res.json({ message: 'Password updated' });
});

// PUT /api/users/preferences
router.put('/preferences', requireAuth, validate({ body: preferencesSchema }), async (req, res) => {
  const { theme, customBg, customText, fontSize } = req.body;

  const update = {};
  if (theme) update['preferences.theme'] = theme;
  if (customBg) update['preferences.customBg'] = customBg;
  if (customText) update['preferences.customText'] = customText;
  if (fontSize) update['preferences.fontSize'] = fontSize;

  await User.findByIdAndUpdate(req.userId, { $set: update });
  res.json({ message: 'Preferences saved' });
});

// DELETE /api/users/account
router.delete('/account', requireAuth, validate({ body: deleteAccountSchema }), async (req, res) => {
  const { password } = req.body;

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Incorrect password' });

  await Quote.deleteMany({ createdBy: req.userId });
  await Quote.updateMany(
    { savedBy: req.userId },
    { $pull: { savedBy: req.userId } }
  );
  await Friend.deleteMany({ $or: [{ requester: req.userId }, { recipient: req.userId }] });
  await Message.deleteMany({ $or: [{ sender: req.userId }, { recipient: req.userId }] });
  await User.findByIdAndDelete(req.userId);

  res.json({ message: 'Account deleted' });
});

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = router;
