import React, { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { combinedDrugsData } from '@/data/mockDrugsData';

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
  
  // Generate suggestions based on query
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    
    const searchTerm = query.toLowerCase();
    console.log("Searching for:", searchTerm);
    console.log("Total drugs in data:", combinedDrugsData.length);
    
    // Find matching drugs by name, brand names, generic names, or with similar spelling
    const matchingDrugs = combinedDrugsData
      .filter(drug => {
        // Direct name match
        if (drug.name.toLowerCase().includes(searchTerm)) return true;
        
        // Generic name match
        if (drug.genericName && drug.genericName.toLowerCase().includes(searchTerm)) return true;
        
        // Brand name match (comprehensive check)
        if (drug.brandNames && drug.brandNames.some(brand => 
          brand.toLowerCase().includes(searchTerm))) return true;
        
        // Manufacturer match
        if (drug.manufacturer && drug.manufacturer.toLowerCase().includes(searchTerm)) return true;
        
        // Category match
        if (drug.category && drug.category.toLowerCase().includes(searchTerm)) return true;
        
        // Drug class match
        if (drug.drugClass && drug.drugClass.toLowerCase().includes(searchTerm)) return true;
        
        // Advanced Levenshtein distance for fuzzy matching with improved threshold
        const nameLower = drug.name.toLowerCase();
        // Adjust threshold based on search term length for more accurate fuzzy matching
        const threshold = Math.min(2, Math.max(1, Math.floor(searchTerm.length / 4)));
        if (calculateLevenshteinDistance(searchTerm, nameLower) <= threshold) return true;
        
        return false;
      })
      .slice(0, 10) // Increase to 10 suggestions for better user experience
      .map(drug => drug.name);
    
    console.log("Found matching drugs:", matchingDrugs.length);
    setSuggestions(Array.from(new Set(matchingDrugs))); // Remove duplicates
  }, [query]);
  
  // Enhanced Levenshtein distance implementation for fuzzy matching
  const calculateLevenshteinDistance = (a: string, b: string): number => {
    const matrix = [];
    
    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i-1][j] + 1,      // deletion
          matrix[i][j-1] + 1,      // insertion
          matrix[i-1][j-1] + cost  // substitution
        );
      }
    }
    
    return matrix[b.length][a.length];
  };
  
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
              "focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-pharma-500",
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
