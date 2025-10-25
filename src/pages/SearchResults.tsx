
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Filter, X, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DrugData } from '@/components/DrugCard';
import { loadAllDrugs } from '@/data/drugDataLoader';
import { fetchDrugs } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchBar from '@/components/SearchBar';
import DrugCard from '@/components/DrugCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

// Inline Levenshtein distance implementation to avoid missing module error
function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isAuthenticated } = useAuthStatus();
  const { usageStats, getDatabaseSearchLimit } = useSubscription();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('q') || '';
  
  const [isLoading, setIsLoading] = useState(true);
  const [allResults, setAllResults] = useState<DrugData[]>([]);
  const [displayedResults, setDisplayedResults] = useState<DrugData[]>([]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // Show 20 items per page
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  console.log("SearchResults component initialized");
  console.log("Search query:", searchQuery);
  
  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const allDrugs = await loadAllDrugs();
        const uniqueCategories = Array.from(new Set(allDrugs.map(drug => drug.category).filter(Boolean))) as string[];
        setCategories(uniqueCategories);
        console.log("Available categories:", uniqueCategories);
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    };
    loadCategories();
  }, []);

  // Calculate pagination
  const totalPages = Math.ceil(allResults.length / itemsPerPage);
  const startIndex = 0;
  const endIndex = currentPage * itemsPerPage;
  const hasMoreResults = endIndex < allResults.length;

  // Update displayed results when page or results change
  useEffect(() => {
    const newDisplayedResults = allResults.slice(startIndex, endIndex);
    setDisplayedResults(newDisplayedResults);
  }, [allResults, currentPage, itemsPerPage, startIndex, endIndex]);

  useEffect(() => {
    // Reset loading state and scroll to top when search query changes
    setIsLoading(true);
    setCurrentPage(1);
    window.scrollTo(0, 0);

    const loadDrugs = async () => {
      try {
        console.log("Searching for:", searchQuery);
        console.log("Active filters:", activeFilters);
        
        let useLocalData = true;
        
        if (searchQuery) {
          // Try to fetch from Supabase first
          try {
            const databaseSearchLimit = getDatabaseSearchLimit();
            const supabaseDrugs = await fetchDrugs({ 
              searchTerm: searchQuery,
              category: activeFilters.length > 0 ? activeFilters[0] : undefined,
              limit: 200, // Increase limit to get more results
              userSubscriptionLimit: databaseSearchLimit
            });
            
            if (supabaseDrugs && supabaseDrugs.length > 0) {
              console.log("Found drugs in Supabase:", supabaseDrugs.length);
              // Map Supabase drugs to DrugData format using correct DB fields
              const formattedDrugs: DrugData[] = supabaseDrugs.map(drug => ({
                id: drug.id,
                name: drug.generic_name || 'Unknown',
                genericName: drug.generic_name || undefined,
                manufacturer: drug.manufacturer || undefined,
                category: drug.category || undefined,
                description: drug.description || undefined,
                brandNames: Array.isArray(drug.brand_names) ? drug.brand_names : (drug.brand_names ? [drug.brand_names] : []),
              }));
              
              setAllResults(formattedDrugs);
              useLocalData = false; // Don't use local data if Supabase found results
            } else {
              console.log("No results found in Supabase, falling back to local data");
            }
          } catch (supabaseError) {
            console.log("Supabase search failed, falling back to local data:", supabaseError);
          }
        }
        
        if (useLocalData) {
          const allDrugs = await loadAllDrugs();
          console.log("Searching local data with total entries:", allDrugs.length);
          // Fall back to combined data if no Supabase results
          // Enhanced search logic to include brand names and fuzzy matching
          const filtered = searchQuery
            ? allDrugs.filter(drug => {
                const query = searchQuery.toLowerCase();
                
                // Direct matches
                const nameMatch = drug.name.toLowerCase().includes(query);
                const genericMatch = drug.genericName && drug.genericName.toLowerCase().includes(query);
                const manufacturerMatch = drug.manufacturer && drug.manufacturer.toLowerCase().includes(query);
                const categoryMatch = drug.category && drug.category.toLowerCase().includes(query);
                const drugClassMatch = drug.drugClass && drug.drugClass.toLowerCase().includes(query);
                
                // Brand name matching with comprehensive check
                const brandMatch = drug.brandNames && 
                  drug.brandNames.some(brand => brand.toLowerCase().includes(query));
                
                // Improved fuzzy matching for common misspellings
                // Adjust threshold based on query length for better accuracy
                const threshold = Math.min(3, Math.max(1, Math.floor(query.length / 3)));
                const fuzzyMatch = calculateLevenshteinDistance(
                  query, drug.name.toLowerCase()) <= threshold;

                // For very short queries, be more strict about fuzzy matching
                const shouldUseFuzzy = query.length > 3;
                
                return nameMatch || genericMatch || manufacturerMatch || 
                       categoryMatch || drugClassMatch || brandMatch || 
                       (shouldUseFuzzy && fuzzyMatch);
              })
            : allDrugs;
          
          console.log(`Found ${filtered.length} drugs in local data`);
          
          // Apply category filters if any are active
          const finalResults = activeFilters.length > 0
            ? filtered.filter(drug => drug.category && activeFilters.includes(drug.category))
            : filtered;
          
          console.log(`After filtering: ${finalResults.length} drugs`);
          setAllResults(finalResults);
        }
      } catch (error) {
        console.error("Error fetching drugs:", error);
        // Fall back to local data on error with same enhanced search
        try {
          const allDrugs = await loadAllDrugs();
          const filtered = searchQuery
            ? allDrugs.filter(drug => {
                const query = searchQuery.toLowerCase();
                
                // Check main properties
                if (drug.name.toLowerCase().includes(query)) return true;
                if (drug.genericName && drug.genericName.toLowerCase().includes(query)) return true;
                if (drug.manufacturer && drug.manufacturer.toLowerCase().includes(query)) return true;
                if (drug.category && drug.category.toLowerCase().includes(query)) return true;
                if (drug.drugClass && drug.drugClass.toLowerCase().includes(query)) return true;

                // Check brand names with improved matching
                if (drug.brandNames && drug.brandNames.some(brand => 
                  brand.toLowerCase().includes(query))) return true;
                
                // Improved fuzzy matching for common misspellings
                const threshold = Math.min(3, Math.max(1, Math.floor(query.length / 3)));
                if (calculateLevenshteinDistance(
                  query, drug.name.toLowerCase()) <= threshold) {
                  return true;
                }
                
                return false;
              })
            : allDrugs;
            
          console.log(`Found ${filtered.length} drugs in local data after error`);
          
          const finalResults = activeFilters.length > 0
            ? filtered.filter(drug => drug.category && activeFilters.includes(drug.category))
            : filtered;
            
          setAllResults(finalResults);
        } catch (fallbackError) {
          console.error("Error loading fallback data:", fallbackError);
          setAllResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadDrugs();
  }, [searchQuery, activeFilters]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    setCurrentPage(prev => prev + 1);
    setIsLoadingMore(false);
  };

  const toggleFilter = (category: string) => {
    setActiveFilters(prev => {
      const newFilters = prev.includes(category)
        ? prev.filter(f => f !== category)
        : [...prev, category];
      
      // Reset to first page when filters change
      setCurrentPage(1);
      return newFilters;
    });
  };

  const clearFilters = () => {
    setActiveFilters([]);
    setCurrentPage(1);
  };

  const handleSearch = (query: string) => {
    const params = new URLSearchParams();
    if (query) {
      params.set('q', query);
    }
    navigate(`/search?${params.toString()}`);
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
                  
                  <div className="grid grid-cols-1 gap-3">
                    {categories.map((category) => (
                      <label 
                        key={category} 
                        className="flex items-start cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={activeFilters.includes(category)}
                          onChange={() => toggleFilter(category)}
                          className="rounded border-gray-300 text-pharma-600 shadow-sm focus:border-pharma-300 focus:ring focus:ring-pharma-200 focus:ring-opacity-50 mt-0.5 flex-shrink-0"
                        />
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 group-hover:text-pharma-600 transition-colors leading-relaxed">
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
            
            {/* Results Section */}
            <div className="flex-1">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Results Header */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {searchQuery ? (
                        <>
                          Showing {displayedResults.length} of {allResults.length} results for "{searchQuery}"
                          {activeFilters.length > 0 && (
                            <span className="ml-2">
                              (filtered by: {activeFilters.join(', ')})
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          Showing {displayedResults.length} of {allResults.length} medications
                          {activeFilters.length > 0 && (
                            <span className="ml-2">
                              (filtered by: {activeFilters.join(', ')})
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Mobile Filter Toggle */}
                    {isMobile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFiltersVisible(!filtersVisible)}
                        className="flex items-center gap-2"
                      >
                        <Filter className="h-4 w-4" />
                        Filters
                      </Button>
                    )}
                  </div>

                  {/* Database Search Usage Display */}
                  {isAuthenticated && (
                    <div className="mb-6 p-4 bg-pharma-50 dark:bg-pharma-900/20 rounded-lg border border-pharma-200 dark:border-pharma-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-pharma-700 dark:text-pharma-300">
                            <span className="font-medium">Database Search Limit:</span> {getDatabaseSearchLimit()} results per search
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/pricing')}
                          className="text-pharma-600 border-pharma-300 hover:bg-pharma-100 dark:text-pharma-400 dark:border-pharma-600 dark:hover:bg-pharma-900/30"
                        >
                          Upgrade Plan
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Results Grid */}
                  {displayedResults.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {displayedResults.map((result) => (
                          <DrugCard
                            key={result.id}
                            drug={result}
                            onClick={() => handleDrugClick(result.id)}
                          />
                        ))}
                      </div>

                      {/* Load More Button */}
                      {hasMoreResults && (
                        <div className="flex justify-center">
                          <Button
                            onClick={handleLoadMore}
                            disabled={isLoadingMore}
                            className="flex items-center gap-2 px-8 py-3"
                            variant="outline"
                          >
                            {isLoadingMore ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                Loading...
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4" />
                                Load More ({allResults.length - displayedResults.length} remaining)
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* Results Summary */}
                      {!hasMoreResults && allResults.length > itemsPerPage && (
                        <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                          Showing all {allResults.length} results
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-500 dark:text-gray-400 mb-4">
                        {searchQuery ? (
                          <>
                            No medications found for "{searchQuery}"
                            {activeFilters.length > 0 && (
                              <span className="block mt-2">
                                Try removing some filters or search for a different term
                              </span>
                            )}
                          </>
                        ) : (
                          "No medications found"
                        )}
                      </div>
                      {activeFilters.length > 0 && (
                        <Button
                          onClick={clearFilters}
                          variant="outline"
                          size="sm"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  )}
                </>
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