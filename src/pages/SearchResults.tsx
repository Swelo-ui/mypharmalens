
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchBar from '@/components/SearchBar';
import DrugCard, { DrugData } from '@/components/DrugCard';
import { Loader2, Filter, ChevronDown, X, Search } from 'lucide-react';
import { combinedDrugsData, searchDrugs } from '@/data/combinedDrugsData';
import { fetchDrugs } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

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
  
  console.log("SearchResults component initialized");
  console.log("Search query:", searchQuery);
  console.log("Total drugs in combinedDrugsData:", combinedDrugsData.length);
  
  // Extract unique categories from combinedDrugsData
  const categories = Array.from(new Set(combinedDrugsData.map(drug => drug.category).filter(Boolean))) as string[];
  console.log("Available categories:", categories);

  useEffect(() => {
    // Reset loading state and scroll to top when search query changes
    setIsLoading(true);
    window.scrollTo(0, 0);
    
    const loadDrugs = async () => {
      try {
        console.log("Searching for:", searchQuery);
        console.log("Active filters:", activeFilters);
        
        if (searchQuery) {
          // Try to fetch from Supabase first
          const supabaseDrugs = await fetchDrugs({ 
            searchTerm: searchQuery,
            category: activeFilters.length > 0 ? activeFilters[0] : undefined,
            limit: 200 // Increase limit to get more results
          });
          
          if (supabaseDrugs && supabaseDrugs.length > 0) {
            console.log("Found drugs in Supabase:", supabaseDrugs.length);
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
            setIsLoading(false);
            return;
          } else {
            console.log("No results found in Supabase, falling back to local data");
          }
        }
        
        console.log("Searching local data using searchDrugs function");
        // Fall back to combined data using the optimized searchDrugs function
        const filtered = searchQuery ? await searchDrugs(searchQuery) : combinedDrugsData;
        
        console.log(`Found ${filtered.length} drugs in local data`);
        
        // Apply category filters if any are active
        const finalResults = activeFilters.length > 0
          ? filtered.filter(drug => drug.category && activeFilters.includes(drug.category))
          : filtered;
        
        console.log(`After filtering: ${finalResults.length} drugs`);
        setResults(finalResults);
      } catch (error) {
        console.error("Error fetching drugs:", error);
        // Fall back to local data on error using searchDrugs function
        const filtered = searchQuery ? await searchDrugs(searchQuery) : combinedDrugsData;
          
        console.log(`Found ${filtered.length} drugs in local data after error`);
        
        const finalResults = activeFilters.length > 0
          ? filtered.filter(drug => drug.category && activeFilters.includes(drug.category))
          : filtered;
          
        setResults(finalResults);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Simulate API call delay for better UX - shorter delay for faster response
    const timer = setTimeout(() => {
      loadDrugs();
    }, 300);
    
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
