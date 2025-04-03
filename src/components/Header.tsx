
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, X, Sun, Moon, User, History, LogOut, PlusCircle, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Toggle } from '@/components/ui/toggle';
import { useTheme } from 'next-themes';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface HeaderProps {
  minimal?: boolean;
}

const Header: React.FC<HeaderProps> = ({ minimal = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStatus();
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate('/');
      closeMenu();
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error("Failed to log out");
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleBuyMeACoffee = () => {
    window.open('https://buymeacoffee.com/_himanshusharma', '_blank');
  };
  
  return (
    <>
      <header className="fixed top-0 left-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2" onClick={closeMenu}>
              <div className="relative h-8 w-8 flex items-center justify-center bg-pharma-500 text-white font-bold text-xl rounded">
                <span>PL</span>
              </div>
              <span className="font-bold text-xl text-pharma-600 dark:text-pharma-400">PharmaLens</span>
            </Link>
            
            <div className="hidden md:flex md:items-center md:space-x-6">
              {!minimal && (
                <>
                  <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-pharma-600 dark:hover:text-pharma-400">
                    Home
                  </Link>
                  <Link to="/identify" className="text-gray-700 dark:text-gray-300 hover:text-pharma-600 dark:hover:text-pharma-400">
                    Identify
                  </Link>
                  <Link to="/about" className="text-gray-700 dark:text-gray-300 hover:text-pharma-600 dark:hover:text-pharma-400">
                    About
                  </Link>
                  <Link to="/contact" className="text-gray-700 dark:text-gray-300 hover:text-pharma-600 dark:hover:text-pharma-400">
                    Contact
                  </Link>
                </>
              )}
              
              <div className="flex items-center space-x-3">
                {isMounted && (
                  <Switch 
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                    aria-label="Toggle dark mode"
                  />
                )}
                {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </div>
              
              {isAuthenticated ? (
                <Button onClick={() => navigate('/history')} size="sm" variant="outline" className="hidden md:flex">
                  <History className="h-4 w-4 mr-2" />
                  History
                </Button>
              ) : (
                <Button onClick={() => navigate('/auth')} className="hidden md:flex">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
            
            <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>
      
      {/* Mobile menu */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transform transition-opacity duration-300 md:hidden ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMenu}
      >
        <div
          className={`absolute right-0 top-0 h-full w-64 bg-white dark:bg-gray-900 transform transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <div className="relative h-8 w-8 flex items-center justify-center bg-pharma-500 text-white font-bold text-xl rounded">
                  <span>PL</span>
                </div>
                <span className="font-bold text-xl text-pharma-600 dark:text-pharma-400">PharmaLens</span>
              </div>
              <Button variant="ghost" size="icon" onClick={closeMenu}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </span>
                <div className="flex items-center space-x-2">
                  {isMounted && (
                    <Switch 
                      checked={theme === 'dark'}
                      onCheckedChange={toggleTheme}
                      aria-label="Toggle dark mode"
                    />
                  )}
                  {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </div>
              </div>
              
              <div className="space-y-3">
                <Link 
                  to="/" 
                  className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={closeMenu}
                >
                  Home
                </Link>
                <Link 
                  to="/identify" 
                  className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={closeMenu}
                >
                  <PlusCircle className="h-4 w-4 mr-3" />
                  Identify Medication
                </Link>
                {isAuthenticated ? (
                  <Link 
                    to="/history" 
                    className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={closeMenu}
                  >
                    <History className="h-4 w-4 mr-3" />
                    Identification History
                  </Link>
                ) : null}
                <Link 
                  to="/about" 
                  className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={closeMenu}
                >
                  About
                </Link>
                <Link 
                  to="/contact" 
                  className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={closeMenu}
                >
                  Contact
                </Link>
                <div 
                  className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  onClick={handleBuyMeACoffee}
                >
                  <Coffee className="h-4 w-4 mr-3" />
                  Buy Me a Coffee
                </div>
              </div>
              
              {isAuthenticated ? (
                <Button 
                  variant="destructive" 
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign Out
                </Button>
              ) : (
                <Button 
                  className="w-full justify-start"
                  onClick={() => {
                    navigate('/auth');
                    closeMenu();
                  }}
                >
                  <User className="h-4 w-4 mr-3" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
