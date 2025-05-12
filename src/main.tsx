
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from 'next-themes'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

const root = createRoot(document.getElementById("root")!);

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

// Add meta tags for healthcare SEO
const addMetaTags = () => {
  const metaTags = [
    { name: 'description', content: 'PharmaLens - AI-powered medication identification and information app' },
    { name: 'keywords', content: 'medication identifier, pill identifier, drug reference, healthcare app, medicine information' },
    { property: 'og:title', content: 'PharmaLens - Medication Identifier' },
    { property: 'og:description', content: 'Identify medications and get detailed information about prescription and over-the-counter drugs' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'PharmaLens - Medication Identifier' },
    { name: 'twitter:description', content: 'AI-powered medication identification and information' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
    { name: 'apple-mobile-web-app-title', content: 'PharmaLens' },
    { name: 'application-name', content: 'PharmaLens' },
    { name: 'theme-color', content: '#0384c6' }
  ];

  metaTags.forEach(tag => {
    const meta = document.createElement('meta');
    Object.entries(tag).forEach(([key, value]) => {
      meta.setAttribute(key, value);
    });
    document.head.appendChild(meta);
  });

  // Add favicon link
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = '/lovable-uploads/35c191a2-c0d3-435c-980d-755f39e5b1c7.png';
  document.head.appendChild(link);

  // Add apple touch icon
  const appleIcon = document.createElement('link');
  appleIcon.rel = 'apple-touch-icon';
  appleIcon.href = '/lovable-uploads/35c191a2-c0d3-435c-980d-755f39e5b1c7.png';
  document.head.appendChild(appleIcon);
};

// Run the meta tag addition
addMetaTags();

root.render(
  <BrowserRouter>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <App />
      <Toaster position="bottom-right" />
    </ThemeProvider>
  </BrowserRouter>
);
