
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Filter, X, ChevronDown, ChevronUp, Loader2, AlertCircle, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DrugData } from '@/components/DrugCard';
import { loadAllDrugs } from '@/data/drugDataLoader';
import { fetchDrugs, supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchBar from '@/components/SearchBar';
import DrugCard from '@/components/DrugCard';
import SearchLimitBar from '@/components/SearchLimitBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { hasReachedSearchLimit } from '@/utils/searchUsageTracker';
import { searchOfflineDrugs, isOfflineDataAvailable, DrugOfflineData } from '@/services/offlineDrugStorage';
import { Link } from 'react-router-dom';

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
  const { isAuthenticated, user } = useAuthStatus();
  const { usageStats, getDatabaseSearchLimit } = useSubscription();
  const { isOnline } = useOfflineDetection();
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
  const [usingOfflineData, setUsingOfflineData] = useState(false);
  const [hasOfflineData, setHasOfflineData] = useState<boolean | null>(null);

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

  // Check if offline data is available
  useEffect(() => {
    const checkOfflineData = async () => {
      try {
        const available = await isOfflineDataAvailable();
        setHasOfflineData(available);
      } catch (error) {
        console.error('Error checking offline data:', error);
        setHasOfflineData(false);
      }
    };
    checkOfflineData();
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
        console.log("Is online:", isOnline);

        // Reset offline data indicator
        setUsingOfflineData(false);

        // Check if we're offline and have offline data available
        if (!isOnline) {
          console.log("Device is offline, checking for offline data...");
          const offlineAvailable = await isOfflineDataAvailable();

          if (offlineAvailable) {
            console.log("Offline data available, using IndexedDB search");
            setUsingOfflineData(true);

            // Search offline data
            const offlineResults = await searchOfflineDrugs(searchQuery || '');
            console.log("Found offline results:", offlineResults.length);

            // Convert DrugOfflineData to DrugData format
            const formattedDrugs: DrugData[] = offlineResults.map((drug: DrugOfflineData) => ({
              id: drug.id,
              name: drug.name || 'Unknown',
              genericName: drug.genericName || undefined,
              category: drug.category || undefined,
              description: drug.description || undefined,
              brandNames: drug.brandNames || [],
            }));

            // Apply category filters if any are active
            const finalResults = activeFilters.length > 0
              ? formattedDrugs.filter(drug => drug.category && activeFilters.includes(drug.category))
              : formattedDrugs;

            setAllResults(finalResults);
            setIsLoading(false);

            if (finalResults.length > 0) {
              toast.info('📴 Showing offline results', {
                description: `Found ${finalResults.length} medicines from downloaded data`,
                duration: 3000
              });
            }
            return;
          } else {
            console.log("No offline data available");
            toast.warning('📴 You are offline', {
              description: 'Download offline data from Profile to search without internet',
              duration: 5000
            });
            setAllResults([]);
            setIsLoading(false);
            return;
          }
        }

        // Check limit only; decrement handled by RPC in handleSearch
        if (user && searchQuery) {
          const limitReached = await hasReachedSearchLimit(user.id);
          if (limitReached) {
            toast.error('Search limit reached', {
              description: 'You\'ve reached your monthly search limit. Please upgrade your plan to continue searching.'
            });
            setAllResults([]);
            setIsLoading(false);
            return;
          }
        }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeFilters, isOnline]);

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

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    // Check search limit before performing search
    if (isAuthenticated && user) {
      try {
        // Try to call search limit function, fallback to simple check
        try {
          const { data } = await supabase.rpc('check_and_decrement_search_limit', {
            p_user_id: user.id
          }) as { data: { can_search: boolean; searches_used: number; searches_limit: number; message?: string } | null };

          if (data && !data.can_search) {
            toast.error(data.message || 'Search limit reached! Upgrade your plan to continue searching.');
            return;
          }
        } catch (funcError) {
          console.log('Search limit function not available, allowing search');
        }
      } catch (error) {
        console.error('Error checking search limit:', error);
      }
    }

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
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {searchQuery ? 'Search Medications' : 'All Medications'}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
                  {searchQuery
                    ? `Showing results for "${searchQuery}".`
                    : 'Browse and search the complete PharmaLens medication database.'}
                </p>
              </div>
            </div>

            <SearchBar
              fullWidth
              onSearch={handleSearch}
              placeholder="Search medications..."
            />

            {/* Offline Data Download Banner - only show if user doesn't have offline data */}
            {hasOfflineData === false && (
              <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-700 rounded-xl shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg flex-shrink-0">
                    <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                      Enable offline search
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                      Download medicine data to search without internet.
                    </p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <Link
                    to="/profile?tab=offline"
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    Download now →
                  </Link>
                </div>
              </div>
            )}
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
                      <div className="flex items-center gap-2 flex-wrap">
                        {usingOfflineData && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 flex items-center gap-1">
                            <WifiOff className="h-3 w-3" />
                            Offline Mode
                          </Badge>
                        )}
                        {searchQuery ? (
                          <span>
                            Showing {displayedResults.length} of {allResults.length} results for "{searchQuery}"
                            {activeFilters.length > 0 && (
                              <span className="ml-2">
                                (filtered by: {activeFilters.join(', ')})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span>
                            Showing {displayedResults.length} of {allResults.length} medications
                            {activeFilters.length > 0 && (
                              <span className="ml-2">
                                (filtered by: {activeFilters.join(', ')})
                              </span>
                            )}
                          </span>
                        )}
                      </div>
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

                  {/* Search Limit Bar */}
                  {isAuthenticated && (
                    <div className="mb-6">
                      <SearchLimitBar onLimitReached={() => toast.error('Search limit reached! Upgrade your plan to continue.')} />
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
