
import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Pill, Search, Brain, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const SmartSearch = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<null | any>(null);
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
    
    try {
      // Simulate AI search processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // This is where you would integrate with a real API
      // For now, we'll just simulate results
      setResults({
        mainResult: {
          name: query.length > 3 ? `${query.charAt(0).toUpperCase() + query.slice(1)}` : "Paracetamol",
          description: "This is an AI-powered search result. In a real implementation, this would fetch detailed drug information from a comprehensive database.",
          category: "Pain Reliever",
          usages: ["Pain relief", "Fever reduction"],
          sideEffects: ["Nausea", "Headache", "Liver damage (with overuse)"],
          dosage: "Adults: 1-2 tablets every 4-6 hours as needed. Do not exceed 8 tablets in 24 hours.",
        },
        relatedDrugs: [
          "Ibuprofen", 
          "Aspirin", 
          "Naproxen"
        ]
      });
      
      toast.success("Smart search completed!");
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to complete smart search. Please try again.");
    } finally {
      setIsSearching(false);
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
        
        {results && (
          <div className="space-y-6 animate-fade-in">
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-pharma-800 dark:text-pharma-300">
                  {results.mainResult.name}
                </h2>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-pharma-100 dark:bg-pharma-900/30 text-pharma-800 dark:text-pharma-300">
                  {results.mainResult.category}
                </span>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                {results.mainResult.description}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100 flex items-center">
                    <Pill className="h-4 w-4 mr-2 text-pharma-600" />
                    Common Uses
                  </h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                    {results.mainResult.usages.map((use: string, index: number) => (
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
                    {results.mainResult.sideEffects.map((effect: string, index: number) => (
                      <li key={index}>{effect}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Recommended Dosage</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {results.mainResult.dosage}
                </p>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={handleExternalSearch}
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
                      onClick={() => setQuery(drug)}
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
