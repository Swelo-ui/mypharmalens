
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Scan, History, User } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-mobile';

const BottomNavigation = () => {
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Critical routes where the bottom navigation must always be visible
  const criticalRoutes = ['/identify', '/drug'];
  
  useEffect(() => {
    // Always display the navigation for critical routes
    const isCriticalRoute = criticalRoutes.some(route => location.pathname.startsWith(route));
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (isCriticalRoute) {
        // Always show navigation on critical routes
        setIsVisible(true);
        return;
      }
      
      // Set a threshold to avoid flickering due to small scroll changes
      if (currentScrollY > lastScrollY + 10) {
        // Scrolling down
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY - 10) {
        // Scrolling up
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    // Make navigation visible on initial page load
    setIsVisible(true);
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY, location.pathname, criticalRoutes]);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  // Don't render on desktop
  if (!isMobile) return null;
  
  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-lg rounded-t-3xl z-40 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex justify-around items-center h-16 px-4 max-w-md mx-auto">
        <Link to="/" className="flex flex-col items-center space-y-1">
          <Home className={`h-5 w-5 ${isActive('/') ? 'text-[#024f7d]' : 'text-gray-700 dark:text-gray-400'}`} />
          <span className={`text-xs ${isActive('/') ? 'text-[#024f7d] font-medium' : 'text-gray-700 dark:text-gray-400'}`}>Home</span>
        </Link>
        
        <Link to="/search" className="flex flex-col items-center space-y-1">
          <Search className={`h-5 w-5 ${isActive('/search') ? 'text-[#024f7d]' : 'text-gray-700 dark:text-gray-400'}`} />
          <span className={`text-xs ${isActive('/search') ? 'text-[#024f7d] font-medium' : 'text-gray-700 dark:text-gray-400'}`}>Search</span>
        </Link>
        
        <Link to="/identify" className="flex flex-col items-center -mt-8">
          <div className="bg-[#0384c6] p-4 rounded-full shadow-lg">
            <Scan className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs text-gray-700 dark:text-gray-400 mt-1 font-medium">Identify</span>
        </Link>
        
        <Link to="/history" className="flex flex-col items-center space-y-1">
          <History className={`h-5 w-5 ${isActive('/history') ? 'text-[#024f7d]' : 'text-gray-700 dark:text-gray-400'}`} />
          <span className={`text-xs ${isActive('/history') ? 'text-[#024f7d] font-medium' : 'text-gray-700 dark:text-gray-400'}`}>History</span>
        </Link>
        
        <Link to="/profile" className="flex flex-col items-center space-y-1">
          <User className={`h-5 w-5 ${isActive('/profile') ? 'text-[#024f7d]' : 'text-gray-700 dark:text-gray-400'}`} />
          <span className={`text-xs ${isActive('/profile') ? 'text-[#024f7d] font-medium' : 'text-gray-700 dark:text-gray-400'}`}>Profile</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNavigation;
