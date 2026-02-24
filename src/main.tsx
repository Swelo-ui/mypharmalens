
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from 'next-themes'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

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
