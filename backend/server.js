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

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/auth',     authRoutes);
app.use('/api/quotes',   quotesRoutes);
app.use('/api/users',    usersRoutes);
app.use('/api/friends',  friendsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/stats',    statsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

mongoose
  .connect(process.env.MONGODB_URI, { family: 4 })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
