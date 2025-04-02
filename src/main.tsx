
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'

// Use requestIdleCallback to let the browser finish other tasks first
const renderApp = () => {
  const container = document.getElementById("root");
  
  if (!container) {
    console.error("Root element not found");
    return;
  }
  
  const root = createRoot(container);
  
  root.render(
    // Using StrictMode for development but it can cause double-renders
    // Remove this in production if flickering persists
    <StrictMode>
      <App />
    </StrictMode>
  );
};

// Use requestIdleCallback for non-critical rendering
if (window.requestIdleCallback) {
  window.requestIdleCallback(renderApp);
} else {
  // Fallback for browsers that don't support requestIdleCallback
  setTimeout(renderApp, 1);
}
