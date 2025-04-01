import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchBar from '@/components/SearchBar';
import DrugCard, { DrugData } from '@/components/DrugCard';
import { Loader2, Filter, ChevronDown, X, Search, ExternalLink } from 'lucide-react';
import { mockDrugsData } from '@/data/mockDrugsData';
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
  const [noResults, setNoResults] = useState(false);
  
  // Extract unique categories from mockDrugsData
  const categories = Array.from(new Set(mockDrugsData.map(drug => drug.category).filter(Boolean))) as string[];

  useEffect(() => {
    // Reset loading state and scroll to top when search query changes
    setIsLoading(true);
    setNoResults(false);
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
              image: drug.image_url,
              packageImage: drug.package_image_url
            }));
            
            setResults(formattedDrugs);
            setIsLoading(false);
            return;
          }
        }
        
        // Fall back to mock data if no Supabase results
        // Filter based on search query
        const filtered = searchQuery
          ? mockDrugsData.filter(drug => 
              drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (drug.genericName && drug.genericName.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (drug.manufacturer && drug.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (drug.category && drug.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (drug.drugClass && drug.drugClass.toLowerCase().includes(searchQuery.toLowerCase()))
            )
          : mockDrugsData;
        
        // Apply category filters if any are active
        const finalResults = activeFilters.length > 0
          ? filtered.filter(drug => drug.category && activeFilters.includes(drug.category))
          : filtered;
        
        setResults(finalResults);
        setNoResults(finalResults.length === 0);
      } catch (error) {
        console.error("Error fetching drugs:", error);
        // Fall back to mock data on error
        const filtered = searchQuery
          ? mockDrugsData.filter(drug => 
              drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (drug.genericName && drug.genericName.toLowerCase().includes(searchQuery.toLowerCase()))
            )
          : mockDrugsData;
          
        const finalResults = activeFilters.length > 0
          ? filtered.filter(drug => drug.category && activeFilters.includes(drug.category))
          : filtered;
          
        setResults(finalResults);
        setNoResults(finalResults.length === 0);
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
  
  const handleSearch = (query: string) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleDrugsComSearch = () => {
    if (searchQuery) {
      const drugsComUrl = `https://www.drugs.com/search.php?searchterm=${encodeURIComponent(searchQuery)}`;
      window.open(drugsComUrl, '_blank');
    }
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
              enableExternalSearch={true}
            />
            
            {searchQuery && (
              <div className="mt-3 flex justify-end">
                <button 
                  onClick={handleDrugsComSearch}
                  className="text-sm text-pharma-600 hover:text-pharma-700 flex items-center"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Search on drugs.com for more results
                </button>
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
                
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Can't find what you're looking for? Try searching on <a href="https://www.drugs.com" target="_blank" rel="noopener noreferrer" className="text-pharma-600 hover:underline">drugs.com</a> for comprehensive drug information.
                  </p>
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
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Clear all filters
                    </button>
                    
                    <button
                      onClick={handleDrugsComSearch}
                      className="px-4 py-2 rounded-lg bg-pharma-600 text-white text-sm font-medium hover:bg-pharma-700 transition-colors shadow-sm flex items-center justify-center"
                    >
                      <ExternalLink className="h-4 w-4 mr-1.5" />
                      Search on drugs.com
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
                    Our database is continuously expanding. Try searching on drugs.com for the most comprehensive results.
                  </p>
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
