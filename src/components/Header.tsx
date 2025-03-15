
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Camera, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  // Close menu when location changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300",
      isScrolled 
        ? "glass border-b border-gray-200 dark:border-gray-800 shadow-sm" 
        : "bg-transparent"
    )}>
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="h-10 w-10 rounded-full bg-pharma-600 flex items-center justify-center transition-all group-hover:scale-105">
              <span className="text-white font-semibold text-lg">PL</span>
            </div>
            <span className="text-xl font-semibold transition-colors">
              PharmaLens
              <span className="text-pharma-600">.</span>
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className={cn(
              "text-sm font-medium transition-colors hover:text-pharma-600",
              location.pathname === "/" ? "text-pharma-600" : "text-gray-600 dark:text-gray-300"
            )}>
              Home
            </Link>
            <Link to="/search" className={cn(
              "text-sm font-medium transition-colors hover:text-pharma-600",
              location.pathname === "/search" ? "text-pharma-600" : "text-gray-600 dark:text-gray-300"
            )}>
              Search
            </Link>
            <Link to="/identify" className={cn(
              "text-sm font-medium transition-colors hover:text-pharma-600",
              location.pathname === "/identify" ? "text-pharma-600" : "text-gray-600 dark:text-gray-300"
            )}>
              Identify
            </Link>
            <Link to="/about" className={cn(
              "text-sm font-medium transition-colors hover:text-pharma-600",
              location.pathname === "/about" ? "text-pharma-600" : "text-gray-600 dark:text-gray-300"
            )}>
              About
            </Link>
          </nav>
          
          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/search" className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">
              <Search className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </Link>
            <Link to="/identify" className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">
              <Camera className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </Link>
            <Link to="/search" className="px-4 py-2 rounded-full bg-pharma-600 text-white text-sm font-medium hover:bg-pharma-700 transition-colors shadow-sm">
              Find a Drug
            </Link>
          </div>
          
          {/* Mobile Menu Toggle */}
          <button 
            onClick={toggleMenu}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 p-4 glass rounded-xl border border-gray-200 dark:border-gray-800 animate-fade-in">
            <nav className="flex flex-col space-y-4">
              <Link to="/" className={cn(
                "text-sm font-medium transition-colors hover:text-pharma-600 p-2 rounded-lg",
                location.pathname === "/" ? "bg-gray-100 dark:bg-gray-800 text-pharma-600" : "text-gray-600 dark:text-gray-300"
              )}>
                Home
              </Link>
              <Link to="/search" className={cn(
                "text-sm font-medium transition-colors hover:text-pharma-600 p-2 rounded-lg",
                location.pathname === "/search" ? "bg-gray-100 dark:bg-gray-800 text-pharma-600" : "text-gray-600 dark:text-gray-300"
              )}>
                Search
              </Link>
              <Link to="/identify" className={cn(
                "text-sm font-medium transition-colors hover:text-pharma-600 p-2 rounded-lg",
                location.pathname === "/identify" ? "bg-gray-100 dark:bg-gray-800 text-pharma-600" : "text-gray-600 dark:text-gray-300"
              )}>
                Identify
              </Link>
              <Link to="/about" className={cn(
                "text-sm font-medium transition-colors hover:text-pharma-600 p-2 rounded-lg",
                location.pathname === "/about" ? "bg-gray-100 dark:bg-gray-800 text-pharma-600" : "text-gray-600 dark:text-gray-300"
              )}>
                About
              </Link>
              <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                <Link to="/search" className="w-full py-2.5 rounded-lg bg-pharma-600 text-white text-sm font-medium hover:bg-pharma-700 transition-colors shadow-sm flex items-center justify-center">
                  Find a Drug
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
