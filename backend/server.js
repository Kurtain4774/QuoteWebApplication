require('dotenv').config();
const Sentry = require('@sentry/node');

// Opt-in: only initialize when DSN is provided. Without one, Sentry is a no-op.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  });
}

const dns = require('dns');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pinoHttp = require('pino-http');
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

app.set('trust proxy', 1); // needed for correct client IP behind Vercel's edge
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json({ limit: '10kb' }));
app.use(pinoHttp({
  // Drop noise in test runs
  enabled: process.env.NODE_ENV !== 'test',
  redact: ['req.headers.authorization'],
}));

// Global rate limit — blanket protection against abusive clients.
// In-memory store is per-instance; Vercel serverless containers each have their own,
// so this is burst protection rather than a global quota.
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Strict limiter for auth routes — blocks brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
  skip: () => process.env.NODE_ENV === 'test',
});

if (process.env.NODE_ENV !== 'test') {
  app.use('/api', globalLimiter);
}

// Lazy DB connection — safe for serverless (cold start) and long-running processes.
// Uses mongoose's own readyState so tests that pre-connect to an in-memory server
// aren't double-connected here.
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
    } catch (err) {
      return next(err);
    }
  }
  next();
});

app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth',          authRoutes);
app.use('/api/quotes',        quotesRoutes);
app.use('/api/users',         usersRoutes);
app.use('/api/friends',       friendsRoutes);
app.use('/api/messages',      messagesRoutes);
app.use('/api/stats',         statsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler — logs full error server-side, reports 5xx to Sentry,
// returns a sanitized message to the client.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  req.log?.error({ err }, 'request failed');
  const status = err.status || err.statusCode || 500;
  if (status >= 500 && process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  const message = status >= 500 ? 'Server error' : err.message || 'Request failed';
  res.status(status).json({ error: message });
});

// Start server only when run directly (local dev); Vercel imports this as a module
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
