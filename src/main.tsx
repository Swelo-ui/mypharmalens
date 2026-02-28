
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from 'next-themes'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import * as Sentry from '@sentry/react'

// Initialize Sentry crash reporting (only if DSN is configured)
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    sendDefaultPii: true, // Enables automatic IP address collection on events
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Session replay only on errors (privacy-friendly)
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring: 10% of transactions
    tracesSampleRate: 0.1,
    // Session Replay: 0% normal, 100% on error
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
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
