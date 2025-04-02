
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusCircle, History, Settings } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuthStatus } from '@/hooks/useAuthStatus';

const MobileNavigation = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isAuthenticated } = useAuthStatus();
  
  if (!isMobile) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-bottom">
      <div className="grid grid-cols-5 py-2">
        <NavItem 
          icon={<Home size={20} />} 
          label="Home" 
          path="/" 
          isActive={location.pathname === '/'} 
        />
        <NavItem 
          icon={<Search size={20} />} 
          label="Search" 
          path="/search" 
          isActive={location.pathname === '/search'} 
        />
        <NavItem 
          icon={<PlusCircle size={20} />} 
          label="Identify" 
          path="/identify" 
          isActive={location.pathname === '/identify'} 
        />
        <NavItem 
          icon={<Search size={20} />} 
          label="Smart" 
          path="/smart-search" 
          isActive={location.pathname === '/smart-search'} 
        />
        <NavItem 
          icon={isAuthenticated ? <History size={20} /> : <Settings size={20} />} 
          label={isAuthenticated ? "History" : "Account"} 
          path={isAuthenticated ? "/history" : "/auth"} 
          isActive={isAuthenticated ? location.pathname === '/history' : location.pathname === '/auth'} 
        />
      </div>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, path, isActive }) => {
  return (
    <Link 
      to={path} 
      className={`flex flex-col items-center justify-center py-1 px-2 ${
        isActive 
          ? 'text-pharma-600 dark:text-pharma-400' 
          : 'text-gray-500 dark:text-gray-400'
      }`}
    >
      <div className={`${isActive ? 'bg-pharma-50 dark:bg-pharma-900/20 text-pharma-600 dark:text-pharma-400' : ''} p-1.5 rounded-full`}>
        {icon}
      </div>
      <span className="text-xs mt-1">{label}</span>
    </Link>
  );
};

export default MobileNavigation;
