
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Camera, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { useLanguage } from '@/contexts/LanguageContext';

const TranslatedBottomNav = () => {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuthStatus();
  const { translate } = useLanguage();

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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden z-20">
      <div className="grid grid-cols-5 h-16">
        {filteredNavItems.map((item, index) => (
          <Link
            key={index}
            to={item.href}
            className={cn(
              "flex flex-col items-center justify-center text-xs font-medium",
              item.active
                ? "text-pharma-600 dark:text-pharma-400"
                : "text-gray-600 dark:text-gray-400 hover:text-pharma-600 dark:hover:text-pharma-400"
            )}
          >
            <item.icon
              className={cn(
                "h-5 w-5 mb-1",
                item.active
                  ? "text-pharma-600 dark:text-pharma-400"
                  : "text-gray-500 dark:text-gray-400"
              )}
            />
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TranslatedBottomNav;
