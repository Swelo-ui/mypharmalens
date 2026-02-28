
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from 'next-themes'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import * as Sentry from '@sentry/react'

// Initialize Sentry crash reporting (only if DSN is configured)
// Get your free DSN from https://sentry.io and add VITE_SENTRY_DSN to .env
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Capture session replay only when an error occurs (privacy-friendly)
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring: capture 10% of transactions
    tracesSampleRate: 0.1,
    // Session Replay: 0% normal sessions, 100% of sessions with errors
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE, // 'development' or 'production'
  });
}

const root = createRoot(document.getElementById("root")!);

// NOTE: All SEO meta tags, PWA tags, favicons, and manifest link
// are defined in index.html for optimal performance (no JS required)
// and to avoid duplicate/conflicting meta tags.

root.render(
  <BrowserRouter future={{ v7_relativeSplatPath: true }}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <App />
      <Toaster position="bottom-right" />
    </ThemeProvider>
  </BrowserRouter>
);
