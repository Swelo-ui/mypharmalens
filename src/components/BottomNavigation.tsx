
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Scan, History, User } from 'lucide-react';

const BottomNavigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-lg rounded-t-3xl z-40">
      <div className="flex justify-around items-center h-16 px-4 max-w-md mx-auto">
        <Link to="/" className="flex flex-col items-center space-y-1">
          <Home className={`h-5 w-5 ${isActive('/') ? 'text-[#4285F4]' : 'text-gray-400'}`} />
          <span className={`text-xs ${isActive('/') ? 'text-[#4285F4]' : 'text-gray-400'}`}>Home</span>
        </Link>
        
        <Link to="/search" className="flex flex-col items-center space-y-1">
          <Search className={`h-5 w-5 ${isActive('/search') ? 'text-[#4285F4]' : 'text-gray-400'}`} />
          <span className={`text-xs ${isActive('/search') ? 'text-[#4285F4]' : 'text-gray-400'}`}>Search</span>
        </Link>
        
        <Link to="/identify" className="flex flex-col items-center -mt-8">
          <div className="bg-[#4285F4] p-4 rounded-full shadow-lg">
            <Scan className="h-6 w-6 text-white" />
          </div>
          <span className="text-xs text-gray-400 mt-1">Identify</span>
        </Link>
        
        <Link to="/history" className="flex flex-col items-center space-y-1">
          <History className={`h-5 w-5 ${isActive('/history') ? 'text-[#4285F4]' : 'text-gray-400'}`} />
          <span className={`text-xs ${isActive('/history') ? 'text-[#4285F4]' : 'text-gray-400'}`}>History</span>
        </Link>
        
        <Link to="/profile" className="flex flex-col items-center space-y-1">
          <User className={`h-5 w-5 ${isActive('/profile') ? 'text-[#4285F4]' : 'text-gray-400'}`} />
          <span className={`text-xs ${isActive('/profile') ? 'text-[#4285F4]' : 'text-gray-400'}`}>Profile</span>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNavigation;
