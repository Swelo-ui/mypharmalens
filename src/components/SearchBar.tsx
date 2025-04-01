
import React, { useState } from 'react';
import { Search, X, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface SearchBarProps {
  fullWidth?: boolean;
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  enableExternalSearch?: boolean;
}

const SearchBar = ({ 
  fullWidth = false, 
  placeholder = "Search for medications by name, category, or manufacturer...",
  onSearch,
  className,
  enableExternalSearch = false
}: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showExternal, setShowExternal] = useState(false);
  const navigate = useNavigate();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    if (onSearch) {
      setIsLoading(true);
      // Simulate search delay
      setTimeout(() => {
        onSearch(query);
        setIsLoading(false);
      }, 800);
    } else {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };
  
  const handleExternalSearch = () => {
    // Open drugs.com search in new tab
    const drugsComUrl = `https://www.drugs.com/search.php?searchterm=${encodeURIComponent(query)}`;
    window.open(drugsComUrl, '_blank');
    toast.success("Searching on drugs.com", {
      description: "Opening external database search in a new tab"
    });
  };
  
  const clearSearch = () => {
    setQuery('');
    setShowExternal(false);
  };
  
  // Show external search option when query is 3+ characters
  React.useEffect(() => {
    if (enableExternalSearch && query.length >= 3) {
      setShowExternal(true);
    } else {
      setShowExternal(false);
    }
  }, [query, enableExternalSearch]);

  return (
    <div className="relative">
      <form 
        onSubmit={handleSearch} 
        className={cn(
          "relative transition-all duration-300 group",
          fullWidth ? "w-full" : "max-w-xl mx-auto",
          isFocused 
            ? "scale-[1.01] shadow-lg" 
            : "shadow-md hover:shadow-lg",
          className
        )}
      >
        <div className={cn(
          "flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 rounded-full border",
          isFocused 
            ? "border-pharma-400 ring-2 ring-pharma-100" 
            : "border-gray-200 dark:border-gray-700"
        )}>
          <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none placeholder:text-gray-400 text-sm"
          />
          
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          <button 
            type="submit" 
            disabled={isLoading || !query.trim()} 
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pharma-500",
              query.trim() 
                ? "bg-pharma-600 text-white hover:bg-pharma-700" 
                : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Search"
            )}
          </button>
        </div>
      </form>
      
      {/* External search option */}
      {showExternal && enableExternalSearch && (
        <div className="absolute mt-2 w-full z-10 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={handleExternalSearch}
            className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center">
              <Search className="h-4 w-4 text-pharma-600 mr-2" />
              <div>
                <span className="block text-sm font-medium">Search "{query}" on drugs.com</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">Access comprehensive drug database</span>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
