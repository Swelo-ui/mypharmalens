
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Camera, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMediaQuery } from '@/hooks/use-mobile';

const TranslatedBottomNav = () => {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuthStatus();
  const { translate } = useLanguage();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Set a threshold to avoid flickering due to small scroll changes
      if (currentScrollY > lastScrollY + 20) {
        // Scrolling down - hide the navigation
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY - 10 || currentScrollY <= 10) {
        // Scrolling up or near top - show the navigation
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  const navItems = [
    {
      name: translate('common.home'),
      icon: Home,
      href: '/',
      active: pathname === '/',
      protected: false,
    },
    {
      name: translate('common.search'),
      icon: Search,
      href: '/search',
      active: pathname === '/search',
      protected: false,
    },
    {
      name: translate('common.identify'),
      icon: Camera,
      href: '/identify',
      active: pathname === '/identify',
      protected: false,
      main: true,
    },
    {
      name: translate('common.history'),
      icon: History,
      href: '/history',
      active: pathname === '/history',
      protected: true,
    },
    {
      name: translate('common.profile'),
      icon: User,
      href: '/profile',
      active: pathname === '/profile',
      protected: false,
    },
  ];

  // Filter out protected routes if user is not authenticated
  const filteredNavItems = isAuthenticated
    ? navItems
    : navItems.filter(item => !item.protected);

  // Don't render on desktop
  if (!isMobile) return null;

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-lg rounded-t-3xl z-40 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex justify-around items-center h-16 px-4 max-w-md mx-auto">
        {filteredNavItems.map((item) => (
          item.main ? (
            <Link 
              key={item.name}
              to={item.href} 
              className="flex flex-col items-center -mt-8"
            >
              <div className="bg-[#0384c6] p-4 rounded-full shadow-lg">
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs text-gray-700 dark:text-gray-400 mt-1 font-medium">
                {item.name}
              </span>
            </Link>
          ) : (
            <Link
              key={item.name}
              to={item.href}
              className="flex flex-col items-center space-y-1"
            >
              <item.icon
                className={cn(
                  "h-5 w-5",
                  item.active ? 'text-[#024f7d]' : 'text-gray-700 dark:text-gray-400'
                )}
              />
              <span className={cn(
                "text-xs",
                item.active ? 'text-[#024f7d] font-medium' : 'text-gray-700 dark:text-gray-400'
              )}>
                {item.name}
              </span>
            </Link>
          )
        ))}
      </div>
    </nav>
  );
};

export default TranslatedBottomNav;
