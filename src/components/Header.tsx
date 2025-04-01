
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Search, Sun, Moon, LogIn, UserCircle, LogOut, History, Circle } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { setTheme, theme } = useTheme();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading } = useAuthStatus();

  // Force theme system to recognize current setting
  useEffect(() => {
    // This ensures the theme is correctly applied on component mount
    const currentTheme = theme === 'system' ? 
      window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' 
      : theme;
    
    document.documentElement.classList.toggle('dark', currentTheme === 'dark');
  }, [theme]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);
  
  // Handle scroll lock when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error("Failed to sign out");
    }
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    // Force the toggle to apply immediately
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Links for navigation
  const mainLinks = [
    { name: 'Home', path: '/' },
    { name: 'Identify', path: '/identify' },
    { name: 'About', path: '/about' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Help', path: '/help' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 z-50 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-pharma-600 dark:bg-pharma-500 rounded-full flex items-center justify-center text-white">
              <span className="font-bold text-lg">PL</span>
            </div>
            <span className="font-bold text-xl text-pharma-600 dark:text-pharma-400">PharmaLens</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            {mainLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-pharma-600 ${
                  location.pathname === link.path
                    ? 'text-pharma-600 dark:text-pharma-400'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {link.name}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                to="/history"
                className={`text-sm font-medium transition-colors hover:text-pharma-600 ${
                  location.pathname === '/history'
                    ? 'text-pharma-600 dark:text-pharma-400'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                History
              </Link>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            <Link to="/search" className="p-2 text-gray-600 dark:text-gray-300 hover:text-pharma-600 dark:hover:text-pharma-600 transition-colors">
              <Search className="h-5 w-5" />
            </Link>

            <button
              onClick={handleThemeToggle}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-pharma-600 dark:hover:text-pharma-600 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {!isLoading && (
              <>
                {isAuthenticated ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <UserCircle className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        {user?.email}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/history" className="flex items-center w-full cursor-pointer">
                          <History className="mr-2 h-4 w-4" />
                          <span>History</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="hidden md:flex">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                )}
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="p-2 text-gray-600 dark:text-gray-300 md:hidden"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 pt-16">
          <nav className="container mx-auto px-4 py-8 flex flex-col space-y-6">
            {mainLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-lg font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'text-pharma-600 dark:text-pharma-400'
                    : 'text-gray-800 dark:text-gray-200'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            
            {isAuthenticated && (
              <>
                <Link
                  to="/history"
                  className={`text-lg font-medium transition-colors ${
                    location.pathname === '/history'
                      ? 'text-pharma-600 dark:text-pharma-400'
                      : 'text-gray-800 dark:text-gray-200'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  History
                </Link>
                
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsOpen(false);
                  }}
                  className="text-lg font-medium text-red-500 transition-colors flex items-center"
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Sign Out
                </button>
              </>
            )}
            
            {!isAuthenticated && !isLoading && (
              <Link
                to="/auth"
                className="text-lg font-medium text-pharma-600 dark:text-pharma-400 transition-colors flex items-center"
                onClick={() => setIsOpen(false)}
              >
                <LogIn className="mr-2 h-5 w-5" />
                Sign In
              </Link>
            )}
            
            <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mt-6">
              <div className="flex flex-col space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  © {new Date().getFullYear()} PharmaLens. All rights reserved.
                </p>
                <div className="flex space-x-4">
                  <Link to="/terms" className="text-sm text-gray-500 dark:text-gray-400 hover:text-pharma-600 dark:hover:text-pharma-600">
                    Terms
                  </Link>
                  <Link to="/privacy" className="text-sm text-gray-500 dark:text-gray-400 hover:text-pharma-600 dark:hover:text-pharma-600">
                    Privacy
                  </Link>
                  <Link to="/disclaimer" className="text-sm text-gray-500 dark:text-gray-400 hover:text-pharma-600 dark:hover:text-pharma-600">
                    Disclaimer
                  </Link>
                </div>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
