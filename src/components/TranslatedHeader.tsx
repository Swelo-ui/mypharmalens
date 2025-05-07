
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Search, User, LogOut } from 'lucide-react';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const TranslatedHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { translate } = useLanguage();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStatus();
  const { toast } = useToast();

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        type: "error",
      });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-30 shadow-sm">
      <div className="container mx-auto h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <div className="text-2xl font-bold text-pharma-700 dark:text-pharma-500 flex items-center">
            <span className="bg-pharma-600 text-white rounded-md p-1.5 mr-2 text-xl">PL</span>
            <span>PharmaLens</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2">
          <Link to="/search" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-pharma-600 dark:hover:text-pharma-400 rounded-md text-md font-medium">
            {translate('common.search')}
          </Link>
          <Link to="/identify" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-pharma-600 dark:hover:text-pharma-400 rounded-md text-md font-medium">
            {translate('common.identify')}
          </Link>
          {isAuthenticated && (
            <Link to="/history" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-pharma-600 dark:hover:text-pharma-400 rounded-md text-md font-medium">
              {translate('common.history')}
            </Link>
          )}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-3">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <Link to="/profile">
                <Button variant="ghost" size="sm" className="text-gray-700 dark:text-gray-300 text-md">
                  <User className="w-5 h-5 mr-2" />
                  {translate('common.profile')}
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-700 dark:text-gray-300 text-md"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-2" />
                {translate('common.logout')}
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button variant="primary" size="sm" className="text-md px-6 py-2">
                {translate('common.login')}
              </Button>
            </Link>
          )}
          <Link to="/search">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Search className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-gray-700 dark:text-gray-300 focus:outline-none"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 shadow-lg overflow-hidden border-b border-gray-200 dark:border-gray-800">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex flex-col space-y-3">
              <Link to="/search" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-pharma-600 dark:hover:text-pharma-400 rounded-md font-medium text-lg">
                {translate('common.search')}
              </Link>
              <Link to="/identify" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-pharma-600 dark:hover:text-pharma-400 rounded-md font-medium text-lg">
                {translate('common.identify')}
              </Link>
              {isAuthenticated && (
                <Link to="/history" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-pharma-600 dark:hover:text-pharma-400 rounded-md font-medium text-lg">
                  {translate('common.history')}
                </Link>
              )}
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-pharma-600 dark:hover:text-pharma-400 rounded-md font-medium text-lg">
                    {translate('common.profile')}
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:text-pharma-600 dark:hover:text-pharma-400 rounded-md font-medium text-lg"
                  >
                    {translate('common.logout')}
                  </button>
                </>
              ) : (
                <Link to="/auth" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-pharma-600 dark:hover:text-pharma-400 rounded-md font-medium text-lg">
                  {translate('common.login')}
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default TranslatedHeader;
