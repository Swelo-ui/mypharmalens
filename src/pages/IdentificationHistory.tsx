
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock, Search, AlertTriangle, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import Header from '@/components/Header';
import DrugCard from '@/components/DrugCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface IdentificationRecord {
  id: string;
  created_at: string;
  drug_name: string;
  image_url?: string;
  details: any;
  user_id?: string;
}

const IdentificationHistory = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStatus();
  const [history, setHistory] = useState<IdentificationRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<IdentificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to auth page if not authenticated
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }

    // Fetch history if authenticated
    if (isAuthenticated && user) {
      fetchIdentificationHistory();
    }
  }, [isAuthenticated, authLoading, user]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredHistory(history);
    } else {
      const filtered = history.filter(item => 
        item.drug_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredHistory(filtered);
    }
  }, [searchTerm, history]);

  const fetchIdentificationHistory = async () => {
    try {
      setIsLoading(true);
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const { data, error } = await supabase
        .from('drug_identifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      console.log("Fetched history data:", data);
      setHistory(data || []);
      setFilteredHistory(data || []);
    } catch (error) {
      console.error('Error fetching identification history:', error);
      toast.error("Failed to load your identification history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (id: string) => {
    const record = history.find(item => item.id === id);
    console.log("Clicked record:", record);
    
    if (record && record.details) {
      const drugId = extractDrugId(record.details);
      
      if (drugId) {
        navigate(`/drug/${drugId}`);
      } else {
        toast.info("Detailed information for this medication is not available");
      }
    }
  };
  
  // Helper function to extract drug ID from details
  const extractDrugId = (details: any): string | null => {
    if (!details) return null;
    
    // If details is already an object with id
    if (details.id) return details.id;
    
    // If details might be a string (stringified JSON)
    if (typeof details === 'string') {
      try {
        const parsedDetails = JSON.parse(details);
        if (parsedDetails.id) return parsedDetails.id;
      } catch (e) {
        console.error("Error parsing details:", e);
      }
    }
    
    return null;
  };

  const refreshHistory = () => {
    if (isAuthenticated && user) {
      fetchIdentificationHistory();
    }
  };

  return (
    <>
      <Header />
      <div className="container max-w-6xl mx-auto px-4 pt-24 pb-12">
        <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Identification History</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              View your previous medication identifications
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search medications..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button variant="outline" size="icon" onClick={refreshHistory}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="p-6 border rounded-xl">
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-24 w-full mb-4" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredHistory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHistory.map((item) => (
              <div key={item.id} className="relative cursor-pointer transition-transform hover:scale-105" onClick={() => handleCardClick(item.id)}>
                <div className="absolute top-4 right-4 z-10 bg-gray-100 dark:bg-gray-800 text-xs px-2 py-1 rounded-full flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {format(new Date(item.created_at), 'MMM d, yyyy')}
                </div>
                <DrugCard
                  drug={{
                    id: extractDrugId(item.details) || item.id,
                    name: item.drug_name || "Unknown Medication",
                    genericName: item.details?.genericName || item.details?.generic_name || "",
                    manufacturer: item.details?.manufacturer || "",
                    category: item.details?.category || "",
                    description: item.details?.description || "",
                    drugClass: item.details?.drugClass || item.details?.drug_class || "",
                    verified: item.details?.verified || false,
                    image: item.image_url || item.details?.image || "",
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <AlertTriangle className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-medium mb-2">No identification history found</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
              {searchTerm ? 
                "No results match your search criteria. Try a different search term." : 
                "You haven't identified any medications yet. Start by identifying a medication."}
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate('/identify')}>
                Identify a Medication
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default IdentificationHistory;
