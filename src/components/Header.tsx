import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Search, Sun, Moon, LogIn, UserCircle, LogOut, History, Home, Pill, HelpCircle, Info, Mail, Coffee } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useMediaQuery } from '@/hooks/use-mobile';
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
import { playThemeSwitchSound } from '@/utils/audioService';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { setTheme, theme, resolvedTheme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading } = useAuthStatus();

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

  // Handle theme toggle with improved reliability
  const toggleTheme = () => {
    const currentTheme = resolvedTheme || theme;
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    playThemeSwitchSound();
  };

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

  const handleDonation = () => {
    window.open('https://buymeacoffee.com/_himanshusharma', '_blank');
  };

  // Links for navigation
  const mainLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Identify', path: '/identify', icon: Pill },
    { name: 'About', path: '/about', icon: Info },
    { name: 'FAQ', path: '/faq', icon: HelpCircle },
    { name: 'Help', path: '/help', icon: HelpCircle },
    { name: 'Contact', path: '/contact', icon: Mail },
  ];

  // Don't render the full header on specific pages when on mobile
  const isCompactHeader = isMobile && ['/identify', '/search', '/history', '/profile'].includes(location.pathname);

  // If it's a page with bottom navigation on mobile, render a minimal header
  if (isCompactHeader) {
    return (
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 z-50 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <div className="flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 bg-[#0289C8] dark:bg-[#0289C8] text-white rounded-full mr-2">
                <span className="font-bold text-xs sm:text-sm">PL</span>
              </div>
              <span className="font-bold text-lg sm:text-xl text-black dark:text-white">PharmaLens<span className="text-[#0289C8]">.</span></span>
            </Link>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-300 hover:text-pharma-600 dark:hover:text-pharma-400 transition-colors"
                aria-label="Toggle theme"
              >
                {(resolvedTheme || theme) === 'dark' ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 z-50 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <div className="flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 bg-[#0289C8] dark:bg-[#0289C8] text-white rounded-full mr-2">
                <span className="font-bold text-xs sm:text-sm">PL</span>
              </div>
              <span className="font-bold text-lg sm:text-xl text-black dark:text-white">PharmaLens<span className="text-[#0289C8]">.</span></span>
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
              <Link to="/search" className="p-2 text-gray-600 dark:text-gray-300 hover:text-pharma-600 dark:hover:text-pharma-400 transition-colors">
                <Search className="h-5 w-5" />
              </Link>

              <button
                onClick={toggleTheme}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-pharma-600 dark:hover:text-pharma-400 transition-colors"
                aria-label="Toggle theme"
              >
                {(resolvedTheme || theme) === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
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
                          <Link to="/profile" className="flex items-center w-full cursor-pointer">
                            <UserCircle className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/history" className="flex items-center w-full cursor-pointer">
                            <History className="mr-2 h-4 w-4" />
                            <span>History</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDonation} className="flex items-center cursor-pointer">
                          <Coffee className="mr-2 h-4 w-4 text-amber-600" />
                          <span>Buy Me a Coffee</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
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

              {/* Mobile Menu Toggle - Only visible on non-bottom nav screens */}
              {!isMobile && (
                <button
                  className="p-2 text-gray-600 dark:text-gray-300 md:hidden"
                  onClick={() => setIsOpen(!isOpen)}
                  aria-label="Toggle menu"
                >
                  {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 pt-16 transition-colors duration-300">
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
                  
                  <Link
                    to="/profile"
                    className={`text-lg font-medium transition-colors ${
                      location.pathname === '/profile'
                        ? 'text-pharma-600 dark:text-pharma-400'
                        : 'text-gray-800 dark:text-gray-200'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    Profile
                  </Link>
                  
                  <button
                    onClick={() => {
                      handleDonation();
                      setIsOpen(false);
                    }}
                    className="text-lg font-medium text-amber-600 transition-colors flex items-center"
                  >
                    <Coffee className="mr-2 h-5 w-5" />
                    Buy Me a Coffee
                  </button>
                  
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
                    <Link to="/terms" className="text-sm text-gray-500 dark:text-gray-400 hover:text-pharma-600 dark:hover:text-pharma-400">
                      Terms
                    </Link>
                    <Link to="/privacy" className="text-sm text-gray-500 dark:text-gray-400 hover:text-pharma-600 dark:hover:text-pharma-400">
                      Privacy
                    </Link>
                    <Link to="/disclaimer" className="text-sm text-gray-500 dark:text-gray-400 hover:text-pharma-600 dark:hover:text-pharma-400">
                      Disclaimer
                    </Link>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
