const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const requireAuth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

const registerSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters').max(30),
  email:    z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});

const loginSchema = z.object({
  email:    z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// POST /api/auth/register
router.post('/register', validate({ body: registerSchema }), async (req, res) => {
  const { username, email, password } = req.body;

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    const field = existing.email === email ? 'Email' : 'Username';
    return res.status(409).json({ error: `${field} is already taken` });
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({ username, email, password: hashed });
  const token = signToken(user._id);

  res.status(201).json({
    token,
    user: { id: user._id, username: user.username, email: user.email, preferences: user.preferences },
  });
});

// POST /api/auth/login
router.post('/login', validate({ body: loginSchema }), async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken(user._id);
  res.json({
    token,
    user: { id: user._id, username: user.username, email: user.email, preferences: user.preferences },
  });
});

// GET /api/auth/me  (protected)
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select('-password');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

module.exports = router;
