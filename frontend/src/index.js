import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';

// Opt-in: only initialize when a DSN is provided via build-time env var.
// Without a DSN, Sentry is dead code — no network, no overhead.
if (process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
  // Expose for ErrorBoundary's componentDidCatch
  window.Sentry = Sentry;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
