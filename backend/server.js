require('dotenv').config();
const dns = require('dns');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// System DNS refuses SRV queries — use Google's resolvers instead
dns.setServers(['8.8.8.8', '8.8.4.4']);

const authRoutes     = require('./routes/auth');
const quotesRoutes   = require('./routes/quotes');
const usersRoutes    = require('./routes/users');
const friendsRoutes  = require('./routes/friends');
const messagesRoutes = require('./routes/messages');
const statsRoutes    = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());

// Lazy DB connection — safe for both serverless and long-running processes
let dbConnected = false;
app.use(async (req, res, next) => {
  if (!dbConnected) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
      dbConnected = true;
    } catch (err) {
      return res.status(500).json({ error: 'Database unavailable' });
    }
  }
  next();
});

app.use('/api/auth',     authRoutes);
app.use('/api/quotes',   quotesRoutes);
app.use('/api/users',    usersRoutes);
app.use('/api/friends',  friendsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/stats',    statsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Start server only when run directly (local dev); Vercel imports this as a module
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
