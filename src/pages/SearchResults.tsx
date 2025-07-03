
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchBar from '@/components/SearchBar';
import DrugCard, { DrugData } from '@/components/DrugCard';
import VirtualizedDrugList, { useInfiniteVirtualScroll, useOptimalItemHeight } from '@/components/VirtualizedDrugList';
import { Loader2, Filter, ChevronDown, X, Search } from 'lucide-react';
import { searchDrugsAsync, getAllCategoriesAsync } from '@/data/drugDataLoader';
import { fetchDrugs } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePerformanceMonitor, measureSearchTime, measureRenderTime } from '@/utils/performanceMonitor';
import SEOHead from '@/components/SEOHead';
import SchemaMarkup from '@/components/SchemaMarkup';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('q') || '';
  const isMobile = useIsMobile();
  
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState<DrugData[]>([]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchMetrics, setSearchMetrics] = useState<{time: number, count: number} | null>(null);
  
  // Initialize performance monitoring
  const performance = usePerformanceMonitor();
  
  // Use infinite scroll for better performance with large result sets
  const {
    displayedDrugs,
    loadMore,
    hasMore,
    totalCount,
    displayCount
  } = useInfiniteVirtualScroll(results, 50, 25);
  
  // Calculate optimal item height based on drug data
  const itemHeight = useOptimalItemHeight(displayedDrugs, 180);
  
  // Load categories asynchronously
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const allCategories = await getAllCategoriesAsync();
        setCategories(allCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    // Reset loading state and scroll to top when search query changes
    setIsLoading(true);
    window.scrollTo(0, 0);
    
    const loadDrugs = async () => {
      // Start performance measurement
      performance.start('search-execution', { query: searchQuery, filters: activeFilters });
      
      try {
        // If we have a search query, try to fetch from Supabase first
        if (searchQuery && searchQuery.trim().length > 0) {
          // Try to fetch from Supabase first
          const supabaseDrugs = await measureSearchTime(
            async () => fetchDrugs({ 
              searchTerm: searchQuery,
              category: activeFilters.length > 0 ? activeFilters[0] : undefined,
              limit: 200
            }),
            searchQuery
          );
          
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
              brandNames: Array.isArray(drug.brand_names) ? drug.brand_names : (drug.brand_names ? [drug.brand_names] : []),
            }));
            
            setResults(formattedDrugs);
            setSearchMetrics({
              time: performance.end('search-execution') || 0,
              count: formattedDrugs.length
            });
            setIsLoading(false);
            return;
          }
        }
        
        // For empty search query or if Supabase search failed, load all drugs
        if (!searchQuery || searchQuery.trim().length === 0) {
          // Load all drugs when no search query is provided
          const allDrugs = await measureSearchTime(
            () => import('@/data/combinedDrugsData').then(m => m.combinedDrugsData),
            'all-drugs'
          );
          
          // Apply category filters if any are active
          const finalResults = activeFilters.length > 0
            ? allDrugs.filter(drug => drug.category && activeFilters.includes(drug.category))
            : allDrugs;
          
          setResults(finalResults);
          
          // Record search metrics
          const searchTime = performance.end('search-execution') || 0;
          setSearchMetrics({
            time: searchTime,
            count: finalResults.length
          });
          setIsLoading(false);
          return;
        }
        
        // Use the async search function with performance monitoring for actual searches
        const searchResults = await measureSearchTime(
          () => searchDrugsAsync(searchQuery),
          searchQuery || 'all'
        );
        
        // Apply category filters if any are active
        const finalResults = activeFilters.length > 0
          ? searchResults.filter(drug => drug.category && activeFilters.includes(drug.category))
          : searchResults;
        
        setResults(finalResults);
        
        // Record search metrics
        const searchTime = performance.end('search-execution') || 0;
        setSearchMetrics({
          time: searchTime,
          count: finalResults.length
        });
      } catch (error) {
        console.error("Error fetching drugs:", error);
        performance.start('fallback-search');
        // Fall back to async search on error
        try {
          // If no search query, load all drugs directly
          if (!searchQuery || searchQuery.trim().length === 0) {
            const allDrugs = await measureSearchTime(
              () => import('@/data/combinedDrugsData').then(m => m.combinedDrugsData),
              'fallback-all-drugs'
            );
            
            // Apply category filters if any are active
            const finalResults = activeFilters.length > 0
              ? allDrugs.filter(drug => drug.category && activeFilters.includes(drug.category))
              : allDrugs;
            
            setResults(finalResults);
            
            // Record fallback metrics
            const fallbackTime = performance.end('fallback-search') || 0;
            setSearchMetrics({
              time: fallbackTime,
              count: finalResults.length
            });
            return;
          }
          
          // For actual search queries
          const searchResults = await measureSearchTime(
            () => searchDrugsAsync(searchQuery),
            `fallback-${searchQuery}`
          );
          const finalResults = activeFilters.length > 0
            ? searchResults.filter(drug => drug.category && activeFilters.includes(drug.category))
            : searchResults;
          setResults(finalResults);
          
          // Record fallback metrics
          const fallbackTime = performance.end('fallback-search') || 0;
          setSearchMetrics({
            time: fallbackTime,
            count: finalResults.length
          });
        } catch (fallbackError) {
          console.error("Fallback search also failed:", fallbackError);
          performance.end('fallback-search');
          setResults([]);
          setSearchMetrics({
            time: 0,
            count: 0
          });
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    // Shorter delay for better UX
    const timer = setTimeout(() => {
      loadDrugs();
    }, 200);
    
    return () => clearTimeout(timer);
  }, [searchQuery, activeFilters]);
  
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
  
  const handleDrugClick = (drug: DrugData) => {
    navigate(`/drug/${drug.id}`);
  };

  // Generate SEO data based on search query and results
  const generateSEOData = () => {
    const title = searchQuery 
      ? `${searchQuery} - Search Results | PharmaLens`
      : 'All Medications - PharmaLens Drug Database';
    
    const description = searchQuery
      ? `Find detailed information about ${searchQuery} and related medications. Search results include ${results.length} medications with comprehensive drug information, side effects, and interactions.`
      : `Browse our comprehensive database of medications. Access detailed information on ${results.length} drugs including side effects, dosages, interactions, and more.`;
    
    const keywords = searchQuery
      ? `${searchQuery}, medication search, drug information, ${searchQuery} side effects, ${searchQuery} dosage, pharmaceutical database`
      : 'medication database, drug search, pharmaceutical information, medicine lookup, drug interactions, side effects';
    
    return { title, description, keywords };
  };
  
  const seoData = generateSEOData();
  
  // Generate structured data for search results
  const searchResultsSchema = {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    "name": seoData.title,
    "description": seoData.description,
    "url": `https://pharmalens.tech/search${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": results.length,
      "itemListElement": results.slice(0, 10).map((drug, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Drug",
          "name": drug.name,
          "description": drug.description,
          "url": `https://pharmalens.tech/drug/${drug.id}`
        }
      }))
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* SEO Meta Tags and Structured Data */}
      <SEOHead 
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        canonicalUrl={`/search${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`}
        ogType="website"
      />
      
      {/* Search Results Schema */}
      <SchemaMarkup 
        type="SearchResultsPage"
        data={searchResultsSchema}
      />
      
      {/* Website Schema for search functionality */}
      <SchemaMarkup 
        type="WebSite"
        data={{
          searchAction: {
            target: "https://pharmalens.tech/search?q={search_term_string}",
            queryInput: "required name=search_term_string"
          }
        }}
      />
      
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
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 group-hover:text-pharma-600 transition-colors truncate">
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
                  <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {results.length} {results.length === 1 ? 'result' : 'results'} found
                      </p>
                      
                      {searchMetrics && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                          Search completed in {searchMetrics.time.toFixed(2)}ms
                        </span>
                      )}
                    </div>
                    
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
                  
                  <div className="w-full">
                    <VirtualizedDrugList 
                      drugs={displayedDrugs} 
                      height={600} 
                      itemHeight={itemHeight}
                      onDrugClick={handleDrugClick}
                      className="w-full"
                    />
                    
                    {hasMore && (
                      <div className="flex justify-center mt-6">
                        <button 
                          onClick={loadMore}
                          className="px-4 py-2 bg-pharma-100 hover:bg-pharma-200 text-pharma-800 rounded-lg text-sm font-medium transition-colors"
                        >
                          Load more ({displayCount} of {totalCount})
                        </button>
                      </div>
                    )}
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
