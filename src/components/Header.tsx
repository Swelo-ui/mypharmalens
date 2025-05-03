
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { 
  Menu, 
  Search, 
  Sun, 
  Moon, 
  User, 
  LogOut, 
  Settings,
  History,
  Home,
  Pill
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const Header = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuthStatus();
  const [sheetOpen, setSheetOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate('/');
    } catch (error) {
      toast.error("Error during logout");
      console.error("Logout error:", error);
    }
  };

  const menuItems = [
    { name: 'Home', path: '/', icon: <Home className="h-4 w-4 mr-2" /> },
    { name: 'Identify Medication', path: '/identify', icon: <Pill className="h-4 w-4 mr-2" /> },
    { name: 'Help Center', path: '/help', icon: <Settings className="h-4 w-4 mr-2" /> },
    { name: 'Contact Us', path: '/contact', icon: <Settings className="h-4 w-4 mr-2" /> },
  ];

  const userMenuItems = [
    { name: 'Profile', icon: <User className="h-4 w-4 mr-2" />, action: () => navigate('/profile') },
    { name: 'History', icon: <History className="h-4 w-4 mr-2" />, action: () => navigate('/history') },
    { name: 'Logout', icon: <LogOut className="h-4 w-4 mr-2" />, action: handleLogout }
  ];

  // Add padding to the bottom if mobile to accommodate the bottom navigation
  const headerClasses = isMobile 
    ? "fixed top-0 w-full z-40 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800" 
    : "fixed top-0 w-full z-40 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800";

  return (
    <header className={headerClasses}>
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="mr-2">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="flex flex-col py-4">
                  <h2 className="text-lg font-semibold mb-4 px-4">Navigation</h2>
                  <nav className="space-y-2">
                    {menuItems.map((item) => (
                      <Link 
                        key={item.name} 
                        to={item.path} 
                        className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        onClick={() => setSheetOpen(false)}
                      >
                        {item.icon}
                        {item.name}
                      </Link>
                    ))}
                    
                    {isAuthenticated && (
                      <>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                        <Link 
                          to="/history" 
                          className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                          onClick={() => setSheetOpen(false)}
                        >
                          <History className="h-4 w-4 mr-2" />
                          Identification History
                        </Link>
                        <Link 
                          to="/profile" 
                          className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                          onClick={() => setSheetOpen(false)}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </Link>
                      </>
                    )}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
            
            <Link to="/" className="flex items-center">
              <span className="font-bold text-xl">PharmaLens</span>
            </Link>
            
            <nav className="hidden lg:flex ml-8 space-x-2">
              {menuItems.map((item) => (
                <Link key={item.name} to={item.path} className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-pharma-600 dark:hover:text-pharma-400">
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isMobile && (
              <>
                <Button variant="outline" size="icon" className="rounded-full" onClick={() => navigate('/search')}>
                  <Search className="h-[1.2rem] w-[1.2rem]" />
                </Button>
                
                <Button variant="outline" size="icon" className="rounded-full" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? (
                    <Sun className="h-[1.2rem] w-[1.2rem]" />
                  ) : (
                    <Moon className="h-[1.2rem] w-[1.2rem]" />
                  )}
                </Button>
              </>
            )}
            
            {!isMobile && (
              isLoading ? (
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
              ) : isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="rounded-full w-9 h-9 p-0 bg-pharma-50 dark:bg-pharma-900/20">
                      <span className="sr-only">User menu</span>
                      <span className="flex h-full w-full items-center justify-center rounded-full text-pharma-700 dark:text-pharma-300">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex flex-col p-2">
                      <p className="text-sm font-medium">{user?.email}</p>
                      <p className="text-xs text-gray-500 truncate">Signed in</p>
                    </div>
                    <DropdownMenuSeparator />
                    {userMenuItems.map((item) => (
                      <DropdownMenuItem key={item.name} onClick={item.action} className="cursor-pointer">
                        {item.icon}
                        <span>{item.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="default" onClick={() => navigate('/auth')}>
                  Login
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
