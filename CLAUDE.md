# CLAUDE.md — Website Rules

_Last updated: 2025-04-16_

## Always Do First

- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## Project Overview

A web application where users can create, find, save, and share quotes.
Users must be logged in to access the main app. The homepage is public-facing only.

## Tech Stack

- Frontend: React
- Backend/Auth/Database: Node + Express
- Styling: Tailwind CSS via CDN

## Pages & Structure

### Public (not logged in)

- **Homepage** (/ or index.html)
  - Hero section with a screenshot/mockup of the dashboard
  - Clear explanation of what the app does
  - 1-2 Column Directional Diagram of how a user finds saves and shares quotes. CLicking on the diagram goes into more depth about that specific feature.
  - clearly placed Login and Register buttons where the user will likely see

### Protected (must be logged in)

- **Dashboard** — default view after login
  - Your Quotes tab: all quotes the user has saved
  - Explorer tab: browse/search/discover quotes from others
  - Create tab: form to write and publish a new quote
  - Socials tab: add friends by username, send messages

## Features Breakdown

### Auth

- Register with email and password
- Login / logout
- Redirect logged-in users away from homepage
- Redirect logged-out users away from dashboard

### Quotes

- Create a quote (text, optional author attribution, optional tags for the quote genre)
- Save/bookmark quotes found in explorer
- Delete own quotes
- View quote details

### Explorer

- Browse all public quotes
- Search by keyword, tag, or author
- Save a quote to your collection

### Socials

- Search for users by username
- Send/accept friend requests
- View friends list
- Basic messaging between friends

## Design Preferences

- Style: clean and modern
- Mobile-first and responsive
- Consistent navigation across all dashboard tabs
- Dashboard should feel like an app, not a webpage

## Rules for Claude

- Always ask which page/feature we are working on before writing code
- Do not build the entire app at once — work one section at a time
- If a decision needs to be made about the stack or structure, ask me first
- Keep code organized — separate files for HTML, CSS, and JS
- Add comments explaining what each section does
- If something I ask for conflicts with how auth or databases work, explain why
- Never store passwords in plain text or skip auth checks on protected pages
- Always tell me what needs to be set up on the backend before the frontend will work

## Current Status

- [ ] Tech stack decided
- [ ] Homepage built
- [ ] Auth working (register/login/logout)
- [ ] Dashboard shell with tabs
- [ ] Your Quotes tab
- [ ] Explorer tab
- [ ] Create tab
- [ ] Socials tab
