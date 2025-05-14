
import React, { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { searchDrugs } from '@/data/combinedDrugsData';
import { useIsMobile } from '@/hooks/use-mobile';
import { DrugData } from '@/components/DrugCard';

interface SearchBarProps {
  fullWidth?: boolean;
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

const SearchBar = ({ 
  fullWidth = false, 
  placeholder = "Search for medications by name, category, or manufacturer...",
  onSearch,
  className 
}: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Generate suggestions based on query using the optimized searchDrugs function
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    
    console.log("Searching for:", query);
    
    // Find matching drugs using the optimized search function
    const matchingDrugs = searchDrugs(query);
    
    console.log("Found matching drugs:", matchingDrugs.length);
    
    // Extract drug names from the matched drugs
    const drugNames = matchingDrugs.map(drug => drug.name);
    setSuggestions(Array.from(new Set(drugNames))); // Remove duplicates
  }, [query]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    if (onSearch) {
      setIsLoading(true);
      // Simulate search delay
      setTimeout(() => {
        onSearch(query);
        setIsLoading(false);
        setSuggestions([]);
      }, 300);
    } else {
      console.log("Navigating to search with query:", query);
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setSuggestions([]);
    }
  };
  
  const selectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    setSuggestions([]);
    
    if (onSearch) {
      setIsLoading(true);
      setTimeout(() => {
        onSearch(suggestion);
        setIsLoading(false);
      }, 300);
    } else {
      console.log("Selected suggestion:", suggestion);
      navigate(`/search?q=${encodeURIComponent(suggestion)}`);
    }
  };
  
  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <form 
        onSubmit={handleSearch} 
        className={cn(
          "relative transition-all duration-300 group",
          fullWidth ? "w-full" : "max-w-xl mx-auto",
          isFocused 
            ? "scale-[1.01] shadow-md" 
            : "shadow-sm hover:shadow-md",
          className
        )}
      >
        <div className={cn(
          "flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 rounded-full border",
          isFocused 
            ? "border-pharma-400 ring-1 ring-pharma-100" 
            : "border-gray-200 dark:border-gray-700"
        )}>
          <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // Delay hiding focus state to allow clicking on suggestions
              setTimeout(() => setIsFocused(false), 200);
            }}
            placeholder={isMobile ? "Search medications..." : placeholder}
            className="flex-1 bg-transparent border-none outline-none placeholder:text-gray-400 text-sm min-w-0"
          />
          
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          <button 
            type="submit" 
            disabled={isLoading || !query.trim()} 
            className={cn(
              "px-3 sm:px-4 py-1.5 rounded-full text-sm font-medium transition-all flex-shrink-0",
              "focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-pharma-500",
              query.trim() 
                ? "bg-pharma-600 text-white hover:bg-pharma-700" 
                : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span>{isMobile ? "Search" : "Search"}</span>
            )}
          </button>
        </div>
      </form>
      
      {/* Suggestions dropdown */}
      {suggestions.length > 0 && isFocused && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-100 dark:border-gray-800 py-1">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
              onClick={() => selectSuggestion(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
