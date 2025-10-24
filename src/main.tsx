
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from 'next-themes'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

const root = createRoot(document.getElementById("root")!);

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
