
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Scan, Activity, User } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-mobile';

const BottomNavigation = () => {
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY) {
        // Scrolling down
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  // Don't render on desktop
  if (!isMobile) return null;
  
  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-lg rounded-t-2xl sm:rounded-t-3xl z-40 transition-transform duration-300 ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="flex justify-around items-center h-14 sm:h-16 px-2 sm:px-4 max-w-md mx-auto">
        <Link to="/" className="flex flex-col items-center space-y-0.5 sm:space-y-1">
          <Home className={`h-4 w-4 sm:h-5 sm:w-5 ${isActive('/') ? 'text-[#024f7d]' : 'text-gray-700 dark:text-gray-400'}`} />
          <span className={`text-[10px] sm:text-xs ${isActive('/') ? 'text-[#024f7d] font-medium' : 'text-gray-700 dark:text-gray-400'}`}>Home</span>
        </Link>
        
        <Link to="/search" className="flex flex-col items-center space-y-0.5 sm:space-y-1">
          <Search className={`h-4 w-4 sm:h-5 sm:w-5 ${isActive('/search') ? 'text-[#024f7d]' : 'text-gray-700 dark:text-gray-400'}`} />
          <span className={`text-[10px] sm:text-xs ${isActive('/search') ? 'text-[#024f7d] font-medium' : 'text-gray-700 dark:text-gray-400'}`}>Search</span>
        </Link>
        
        <Link to="/identify" className="flex flex-col items-center -mt-6 sm:-mt-8">
          <div className="bg-[#0384c6] p-3 sm:p-4 rounded-full shadow-lg">
            <Scan className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <span className="text-[10px] sm:text-xs text-gray-700 dark:text-gray-400 mt-0.5 sm:mt-1 font-medium">Identify</span>
        </Link>
        
        <Link to="/symptom-checker" className="flex flex-col items-center space-y-0.5 sm:space-y-1">
          <Activity className={`h-4 w-4 sm:h-5 sm:w-5 ${isActive('/symptom-checker') ? 'text-[#024f7d]' : 'text-gray-700 dark:text-gray-400'}`} />
          <span className={`text-[10px] sm:text-xs ${isActive('/symptom-checker') ? 'text-[#024f7d] font-medium' : 'text-gray-700 dark:text-gray-400'}`}>Symptoms</span>
        </Link>
        
        <Link to="/profile" className="flex flex-col items-center space-y-0.5 sm:space-y-1">
          <User className={`h-4 w-4 sm:h-5 sm:w-5 ${isActive('/profile') ? 'text-[#024f7d]' : 'text-gray-700 dark:text-gray-400'}`} />
          <span className={`text-[10px] sm:text-xs ${isActive('/profile') ? 'text-[#024f7d] font-medium' : 'text-gray-700 dark:text-gray-400'}`}>Profile</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNavigation;
