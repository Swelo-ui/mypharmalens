
import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Pill, Search, Brain, Loader2, ExternalLink, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';

const SmartSearch = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<null | any>(null);
  const [searchProgress, setSearchProgress] = useState(0);
  const { isAuthenticated } = useAuthStatus();
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }
    
    // If not authenticated, recommend signing in
    if (!isAuthenticated) {
      toast.info(
        "Sign in to save your search history", 
        {
          action: {
            label: "Sign In",
            onClick: () => navigate('/auth')
          }
        }
      );
    }
    
    setIsSearching(true);
    setResults(null);
    setSearchProgress(10);
    
    try {
      // Progress animation
      const progressInterval = setInterval(() => {
        setSearchProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 600);
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('smart-drug-search', {
        body: { query: query }
      });
      
      clearInterval(progressInterval);
      setSearchProgress(100);
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data) {
        setResults(data);
        toast.success("Smart search completed!");
      } else {
        toast.error("No results found. Try a different search term.");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to complete smart search. Please try again.");
    } finally {
      setTimeout(() => {
        setIsSearching(false);
        setSearchProgress(0);
      }, 500);
    }
  };
  
  const handleClear = () => {
    setQuery('');
    setResults(null);
  };
  
  const handleExternalSearch = () => {
    if (!query.trim()) return;
    
    const drugsComUrl = `https://www.drugs.com/search.php?searchterm=${encodeURIComponent(query)}`;
    window.open(drugsComUrl, '_blank');
    toast.success("Searching on drugs.com", {
      description: "Opening external database search in a new tab"
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 pt-24 pb-16 max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-pharma-600 to-blue-600 bg-clip-text text-transparent">
            Smart AI Medication Search
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Use advanced AI to search for medications and get comprehensive information about their usage, side effects, and dosage.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex items-start space-x-2 mb-2">
              <Brain className="h-5 w-5 text-pharma-600 mt-1" />
              <div className="flex-1">
                <h2 className="text-lg font-medium mb-1">Ask about any medication</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Describe a medication, symptoms, or ask specific questions
                </p>
              </div>
            </div>
            
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Example: Tell me about Metformin for diabetes, or What medications are used for migraines?"
              className="min-h-[120px] resize-none"
            />
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Button 
                  type="submit" 
                  disabled={isSearching || !query.trim()}
                  className="w-full sm:w-auto dark:bg-pharma-600 dark:text-white dark:hover:bg-pharma-700"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Smart Search
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  disabled={isSearching || (!query && !results)}
                  className="w-full sm:w-auto"
                >
                  Clear
                </Button>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                onClick={handleExternalSearch}
                disabled={isSearching || !query.trim()}
                className="w-full sm:w-auto flex items-center justify-center"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Search on Drugs.com
              </Button>
            </div>
          </form>
        </div>
        
        {isSearching && (
          <div className="my-8 animate-fade-in">
            <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300 text-center">
              Searching medication databases...
            </h3>
            <Progress value={searchProgress} className="h-2 w-full bg-gray-200 dark:bg-gray-700" />
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
              Analyzing your query and retrieving comprehensive medication information
            </p>
          </div>
        )}
        
        {results && (
          <div className="space-y-6 animate-fade-in">
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-pharma-800 dark:text-pharma-300">
                  {results.name}
                </h2>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-pharma-100 dark:bg-pharma-900/30 text-pharma-800 dark:text-pharma-300">
                  {results.category}
                </span>
              </div>
              
              {results.genericName && (
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Generic Name: </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{results.genericName}</span>
                </div>
              )}
              
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                {results.description}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100 flex items-center">
                    <Pill className="h-4 w-4 mr-2 text-pharma-600" />
                    Common Uses
                  </h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                    {results.usages && results.usages.map((use: string, index: number) => (
                      <li key={index}>{use}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100 flex items-center">
                    <Pill className="h-4 w-4 mr-2 text-red-500" />
                    Side Effects
                  </h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                    {results.sideEffects && results.sideEffects.map((effect: string, index: number) => (
                      <li key={index}>{effect}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {results.warnings && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                  <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Warnings</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {results.warnings}
                  </p>
                </div>
              )}
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Recommended Dosage</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {results.dosage}
                </p>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={() => window.open(results.url, '_blank')}
                  variant="outline"
                  className="flex items-center"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Drugs.com
                </Button>
              </div>
            </Card>
            
            {results.relatedDrugs && results.relatedDrugs.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-gray-100">
                  Related Medications
                </h3>
                <div className="flex flex-wrap gap-2">
                  {results.relatedDrugs.map((drug: string, index: number) => (
                    <Button 
                      key={index}
                      variant="outline" 
                      onClick={() => {
                        setQuery(drug);
                        setTimeout(() => {
                          const submitBtn = document.querySelector('form[onsubmit] button[type="submit"]') as HTMLElement;
                          if (submitBtn) submitBtn.click();
                        }, 100);
                      }}
                      className="bg-white dark:bg-gray-800"
                    >
                      {drug}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Information provided by PharmaLens Smart Search is for informational purposes only and is not a substitute for professional medical advice.
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SmartSearch;
