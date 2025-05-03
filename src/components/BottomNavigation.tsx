
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Camera, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const BottomNavigation = () => {
  const location = useLocation();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/identify', icon: Camera, label: 'Identify' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/auth', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 h-16">
      <div className="flex justify-around items-center h-full">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full",
                isActive ? "text-pharma-600 dark:text-pharma-400" : "text-gray-500 dark:text-gray-400"
              )}
            >
              <div className={cn(
                "relative",
                item.path === '/identify' && "flex items-center justify-center h-12 w-12 bg-pharma-600 rounded-full -mt-6 shadow-lg border-4 border-white dark:border-gray-900"
              )}>
                <item.icon
                  className={cn(
                    item.path === '/identify' ? "h-6 w-6 text-white" : "h-5 w-5",
                  )}
                />
                {item.path === '/identify' && (
                  <span className="sr-only">Identify Medication</span>
                )}
              </div>
              {item.path !== '/identify' && (
                <span className="text-xs mt-1">{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
