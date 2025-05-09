
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from 'next-themes'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'

const root = createRoot(document.getElementById("root")!);

// Enhanced service worker registration with better error handling and offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service worker registered:', registration);
        
        // Setup update handling
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, prompt user for reload or auto-reload
                console.info('New content is available, reloading...');
                
                // Automatically apply the update
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            });
          }
        });
        
        // Setup offline/online detection
        window.addEventListener('online', () => {
          console.log('Application is online. Syncing data...');
          // Use background sync if available
          if ('SyncManager' in window) {
            navigator.serviceWorker.ready.then(reg => {
              // Type assertion to allow sync registration
              const swRegistration = reg as unknown as {sync: {register: (tag: string) => Promise<void>}};
              
              // Only attempt to register sync if the attribute exists
              if (swRegistration.sync) {
                swRegistration.sync.register('deferred-operations')
                  .catch(err => console.error('Sync registration failed:', err));
              } else {
                console.log('SyncManager available but reg.sync is not');
              }
            });
          }
        });
        
        window.addEventListener('offline', () => {
          console.log('Application is offline. Some features may be limited.');
        });
      })
      .catch(error => {
        console.error('Service worker registration failed:', error);
      });
      
    // Check if app is being launched from installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('Application launched as PWA');
      // You could set specific behaviors for PWA mode here
    }
  });
}

// Capture errors to provide better user experience
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  
  // For API errors in production, we could log them to the server
  if (event.error?.message?.includes('API') || event.error?.message?.includes('network')) {
    console.log('API error detected, could be logged or handled specially');
  }
});

root.render(
  <BrowserRouter>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <App />
      <Toaster position="bottom-center" richColors />
    </ThemeProvider>
  </BrowserRouter>
);
