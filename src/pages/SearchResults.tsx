
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchBar from '@/components/SearchBar';
import DrugCard, { DrugData } from '@/components/DrugCard';
import { Loader2, Filter, ChevronDown, X, Search } from 'lucide-react';
import { combinedDrugsData } from '@/data/mockDrugsData';
import { fetchDrugs } from '@/integrations/supabase/client';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('q') || '';
  
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<DrugData[]>([]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  // Extract unique categories from combinedDrugsData
  const categories = Array.from(new Set(combinedDrugsData.map(drug => drug.category).filter(Boolean))) as string[];

  useEffect(() => {
    // Reset loading state and scroll to top when search query changes
    setIsLoading(true);
    window.scrollTo(0, 0);
    
    const loadDrugs = async () => {
      try {
        if (searchQuery) {
          // Try to fetch from Supabase first
          const supabaseDrugs = await fetchDrugs({ 
            searchTerm: searchQuery,
            category: activeFilters.length > 0 ? activeFilters[0] : undefined
          });
          
          if (supabaseDrugs && supabaseDrugs.length > 0) {
            // Map Supabase drugs to DrugData format
            const formattedDrugs = supabaseDrugs.map(drug => ({
              id: drug.id,
              name: drug.name,
              genericName: drug.generic_name,
              manufacturer: drug.manufacturer,
              category: drug.category,
              description: drug.description,
              drugClass: drug.drug_class,
              verified: drug.verified,
            }));
            
            setResults(formattedDrugs);
            setIsLoading(false);
            return;
          }
        }
        
        // Fall back to combined data if no Supabase results
        // Enhanced search logic to include brand names and fuzzy matching
        const filtered = searchQuery
          ? combinedDrugsData.filter(drug => {
              const query = searchQuery.toLowerCase();
              const nameMatch = drug.name.toLowerCase().includes(query);
              const genericMatch = drug.genericName && drug.genericName.toLowerCase().includes(query);
              const manufacturerMatch = drug.manufacturer && drug.manufacturer.toLowerCase().includes(query);
              const categoryMatch = drug.category && drug.category.toLowerCase().includes(query);
              const drugClassMatch = drug.drugClass && drug.drugClass.toLowerCase().includes(query);
              
              // Brand name matching
              const brandMatch = drug.brandNames && 
                drug.brandNames.some(brand => brand.toLowerCase().includes(query));
              
              // Simple fuzzy matching for common misspellings
              const fuzzyMatch = calculateLevenshteinDistance(
                query, drug.name.toLowerCase()) <= Math.min(3, Math.floor(drug.name.length / 3));
              
              return nameMatch || genericMatch || manufacturerMatch || 
                     categoryMatch || drugClassMatch || brandMatch || fuzzyMatch;
            })
          : combinedDrugsData;
        
        // Apply category filters if any are active
        const finalResults = activeFilters.length > 0
          ? filtered.filter(drug => drug.category && activeFilters.includes(drug.category))
          : filtered;
        
        setResults(finalResults);
      } catch (error) {
        console.error("Error fetching drugs:", error);
        // Fall back to local data on error with same enhanced search
        const filtered = searchQuery
          ? combinedDrugsData.filter(drug => {
              const query = searchQuery.toLowerCase();
              
              // Check main properties
              if (drug.name.toLowerCase().includes(query)) return true;
              if (drug.genericName && drug.genericName.toLowerCase().includes(query)) return true;
              if (drug.manufacturer && drug.manufacturer.toLowerCase().includes(query)) return true;
              if (drug.category && drug.category.toLowerCase().includes(query)) return true;
              if (drug.drugClass && drug.drugClass.toLowerCase().includes(query)) return true;
              
              // Check brand names
              if (drug.brandNames && drug.brandNames.some(brand => 
                brand.toLowerCase().includes(query))) return true;
              
              // Simple fuzzy matching for common misspellings
              if (calculateLevenshteinDistance(
                query, drug.name.toLowerCase()) <= Math.min(3, Math.floor(drug.name.length / 3))) {
                return true;
              }
              
              return false;
            })
          : combinedDrugsData;
          
        const finalResults = activeFilters.length > 0
          ? filtered.filter(drug => drug.category && activeFilters.includes(drug.category))
          : filtered;
          
        setResults(finalResults);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Simulate API call delay for better UX
    const timer = setTimeout(() => {
      loadDrugs();
    }, 800);
    
    return () => clearTimeout(timer);
  }, [searchQuery, activeFilters]);
  
  // Simple Levenshtein distance implementation for fuzzy matching
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
  
  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };
  
  const toggleFilter = (category: string) => {
    setActiveFilters(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };
  
  const clearFilters = () => {
    setActiveFilters([]);
  };
  
  const handleDrugClick = (drugId: string) => {
    navigate(`/drug/${drugId}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-6">
              {searchQuery ? `Search Results for "${searchQuery}"` : 'All Medications'}
            </h1>
            
            <SearchBar 
              fullWidth 
              onSearch={handleSearch} 
              placeholder="Refine your search..." 
            />
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters - Desktop */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="glass-card p-5 rounded-xl sticky top-24">
                <h2 className="font-medium mb-4 flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFilters.length > 0 && (
                    <button 
                      onClick={clearFilters}
                      className="ml-auto text-xs text-pharma-600 hover:text-pharma-800 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </h2>
                
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-medium mb-3">Categories</h3>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <label 
                          key={category} 
                          className="flex items-center cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={activeFilters.includes(category)}
                            onChange={() => toggleFilter(category)}
                            className="rounded border-gray-300 text-pharma-600 shadow-sm focus:border-pharma-300 focus:ring focus:ring-pharma-200 focus:ring-opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 group-hover:text-pharma-600 transition-colors">
                            {category}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Filters Toggle */}
            <div className="lg:hidden mb-4">
              <button 
                onClick={() => setFiltersVisible(!filtersVisible)}
                className="w-full py-2 px-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 shadow-sm"
              >
                <span className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Filters</span>
                  {activeFilters.length > 0 && (
                    <span className="ml-2 bg-pharma-100 text-pharma-800 text-xs px-2 py-0.5 rounded-full">
                      {activeFilters.length}
                    </span>
                  )}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {/* Mobile Filters Panel */}
              {filtersVisible && (
                <div className="mt-2 p-4 glass-card rounded-xl animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Categories</h3>
                    {activeFilters.length > 0 && (
                      <button 
                        onClick={clearFilters}
                        className="text-xs text-pharma-600 hover:text-pharma-800 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((category) => (
                      <label 
                        key={category} 
                        className="flex items-center cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={activeFilters.includes(category)}
                          onChange={() => toggleFilter(category)}
                          className="rounded border-gray-300 text-pharma-600 shadow-sm focus:border-pharma-300 focus:ring focus:ring-pharma-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 group-hover:text-pharma-600 transition-colors">
                          {category}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Active Filters - Mobile */}
              {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {activeFilters.map((filter) => (
                    <div 
                      key={filter} 
                      className="bg-pharma-100 text-pharma-800 px-2 py-1 rounded-full text-xs font-medium flex items-center"
                    >
                      {filter}
                      <button 
                        onClick={() => toggleFilter(filter)}
                        className="ml-1 rounded-full hover:bg-pharma-200 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Results */}
            <div className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 text-pharma-600 animate-spin mb-2" />
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Searching for medications...
                    </p>
                  </div>
                </div>
              ) : results.length > 0 ? (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {results.length} {results.length === 1 ? 'result' : 'results'} found
                    </p>
                    
                    {/* Active Filters - Desktop */}
                    <div className="hidden lg:flex lg:flex-wrap gap-2">
                      {activeFilters.map((filter) => (
                        <div 
                          key={filter} 
                          className="bg-pharma-100 text-pharma-800 px-2 py-1 rounded-full text-xs font-medium flex items-center"
                        >
                          {filter}
                          <button 
                            onClick={() => toggleFilter(filter)}
                            className="ml-1 rounded-full hover:bg-pharma-200 p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map((drug) => (
                      <div key={drug.id} onClick={() => handleDrugClick(drug.id)} className="cursor-pointer">
                        <DrugCard drug={drug} />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 glass-card rounded-xl p-8">
                  <Search className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No medications found</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                    We couldn't find any medications matching your search criteria.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 rounded-lg bg-pharma-600 text-white text-sm font-medium hover:bg-pharma-700 transition-colors shadow-sm"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SearchResults;
