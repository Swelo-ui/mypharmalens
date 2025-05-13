
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from 'next-themes'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

const root = createRoot(document.getElementById("root")!);

// Register service worker with improved error handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        // Set up auto update checking
        setInterval(() => {
          registration.update();
          console.log('Checking for service worker updates');
        }, 60 * 60 * 1000); // Check every hour
      })
      .catch(error => {
        console.error('ServiceWorker registration failed: ', error);
      });
      
    // Listen for controller change to refresh the page
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('New service worker activated');
      // Use a custom UI to inform the user about new content and offer a refresh
      // For now, we'll just log it
    });
  });
  
  // Handle offline/online events
  window.addEventListener('online', () => {
    console.log('App is online');
    // Modified to check for background sync support before using it
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        // TypeScript safe way to handle sync registration
        if ('sync' in registration) {
          // @ts-ignore - TypeScript doesn't recognize the sync API yet
          registration.sync.register('sync-data').catch(err => {
            console.error('Background sync registration failed:', err);
          });
        }
      });
    }
  });
  
  window.addEventListener('offline', () => {
    console.log('App is offline');
    // Show offline notification if needed
  });
}

// Add meta tags for healthcare SEO and PWA support
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
    { name: 'theme-color', content: '#0289C8' },
    { name: 'msapplication-TileColor', content: '#0289C8' },
    { name: 'msapplication-tap-highlight', content: 'no' },
    { name: 'mobile-web-app-capable', content: 'yes' },
    // Performance optimization meta tags
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0, viewport-fit=cover' },
    { name: 'referrer', content: 'no-referrer-when-downgrade' },
    { 'http-equiv': 'Cache-Control', content: 'public, max-age=31536000' }
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
  link.href = '/lovable-uploads/9e5c4a76-3c90-4e76-a135-a1189527aa61.png';
  document.head.appendChild(link);

  // Add apple touch icon
  const appleIcon = document.createElement('link');
  appleIcon.rel = 'apple-touch-icon';
  appleIcon.href = '/lovable-uploads/9e5c4a76-3c90-4e76-a135-a1189527aa61.png';
  document.head.appendChild(appleIcon);
  
  // Add manifest
  const manifestLink = document.createElement('link');
  manifestLink.rel = 'manifest';
  manifestLink.href = '/manifest.json';
  document.head.appendChild(manifestLink);
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
