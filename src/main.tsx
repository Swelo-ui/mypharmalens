
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from 'next-themes'
import BottomNavigation from './components/BottomNavigation'
import { BrowserRouter } from 'react-router-dom'

const root = createRoot(document.getElementById("root")!);

root.render(
  <BrowserRouter>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <App />
      <BottomNavigation />
    </ThemeProvider>
  </BrowserRouter>
);
