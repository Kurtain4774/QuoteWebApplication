# Quoted

A full-stack web app for creating, discovering, saving, and sharing quotes.

**Live demo:** _(add your Vercel URL here once deployed)_

![CI](https://github.com/Kurtain4774/QuoteWebApplication/actions/workflows/ci.yml/badge.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20-339933)
![React](https://img.shields.io/badge/react-19-61DAFB)
![MongoDB](https://img.shields.io/badge/mongodb-atlas-47A248)
![License](https://img.shields.io/badge/license-MIT-blue)

> _Add a hero screenshot or GIF here. Drag an image into GitHub's README editor to upload; it'll generate a `user-images.githubusercontent.com` URL that works in the README._

---

## What it does

- **Write quotes** and optionally attribute an author + tags
- **Explore** a curated feed of famous quotes and community submissions with keyword, tag, and author search
- **Save** any quote to your personal collection
- **Socialize** — find friends by username, send messages, manage requests
- **Customize** — light, dark, or fully custom color themes with font-size preferences

## Tech stack

- **Frontend:** React 19, React Router 7, Tailwind CSS 3, Framer Motion, Axios
- **Backend:** Node.js, Express 5, MongoDB (Atlas), Mongoose
- **Auth:** JWT + bcrypt (12 rounds)
- **Validation:** Zod schemas at every request boundary
- **Security:** Helmet, rate limiting, body-size limits, CORS allowlist
- **Logging:** Pino structured logs with secret redaction
- **Deploy:** Vercel (monorepo — serverless functions for API, static build for frontend)
- **CI:** GitHub Actions (lint, test, build on every push/PR)

## Architectural highlights worth calling out

- **Cursor pagination** on `/api/quotes` using a compound `(createdAt, _id)` cursor — avoids the classic offset-pagination "skipped rows" bug on concurrent writes.
- **Serverless-aware MongoDB connection** that lazily reconnects per cold start and works around Atlas SRV DNS resolution with an explicit Google DNS override.
- **No-flash theming** — a synchronous `<script>` in `index.html` reads the user's theme preference from `localStorage` and applies the correct class to `<body>` _before_ React's first paint, eliminating the dark-mode flash on reload.
- **Express 5 native async error propagation** — routes throw; a single global error handler logs + sanitizes responses, instead of ad-hoc `try/catch` blocks scattered through every handler.
- **In-process stat cache** with a 60s TTL so the homepage's scroll-triggered counters don't hammer the database.

## Run locally

```bash
# clone
git clone https://github.com/Kurtain4774/QuoteWebApplication.git
cd QuoteWebApplication

# backend
cd backend
cp .env.example .env         # then fill in MONGODB_URI and JWT_SECRET
npm install
npm start                    # -> http://localhost:5000

# frontend (in a second terminal)
cd frontend
npm install
npm start                    # -> http://localhost:3000
```

You'll need a MongoDB Atlas cluster (free tier works). Generate a JWT secret with:

```bash
openssl rand -base64 64
```

Optional: seed the famous-quotes feed with `npm run seed:famous` inside `backend/`.

## Running tests

```bash
# backend — jest + supertest against an in-memory MongoDB
cd backend && npm test

# frontend — jest + React Testing Library
cd frontend && npm test
```

## Project layout

```
backend/
  routes/        # /api/auth, /api/quotes, /api/users, /api/friends, /api/messages, /api/stats
  models/        # Mongoose schemas
  middleware/    # auth (JWT), validate (Zod)
  __tests__/     # jest + supertest auth flow
  server.js      # Express 5 app, helmet + rate-limit + pino + global error handler
frontend/
  src/
    pages/       # Home, Login, Register, Dashboard (+ dashboard/ tabs)
    components/  # QuoteCard, QuoteFilterBar, ProtectedRoute, Motion, ...
    context/     # AuthContext, ThemeContext
    utils/       # axios instance with JWT interceptor
```

## License

MIT
