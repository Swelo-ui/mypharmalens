
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock, Search, AlertTriangle, Filter, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import Header from '@/components/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface IdentificationRecord {
  id: string;
  created_at: string;
  drug_name: string;
  image_url?: string;
  details: any;
  user_id?: string;
  image_features?: string;
}

// Create a cache mechanism for history data
const historyCache = {
  data: null as IdentificationRecord[] | null,
  timestamp: 0,
  // Cache validity is 5 minutes
  isValid: () => (Date.now() - historyCache.timestamp) < 300000,
  set: (data: IdentificationRecord[]) => {
    historyCache.data = data;
    historyCache.timestamp = Date.now();
  },
  clear: () => {
    historyCache.data = null;
    historyCache.timestamp = 0;
  }
};

const IdentificationHistory = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStatus();
  const [history, setHistory] = useState<IdentificationRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<IdentificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchIdentificationHistory = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      // Check if we have valid cached data and not forcing refresh
      if (!forceRefresh && historyCache.isValid() && historyCache.data) {
        setHistory(historyCache.data);
        setFilteredHistory(historyCache.data);
        setIsLoading(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("No active session");
      }

      // Use direct function invocation with service key in the function itself
      const response = await supabase.functions.invoke('manage-drug-history', {
        body: { 
          action: 'getIdentificationHistory',
          data: { userId: user.id }
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });
      
      // Handle empty response
      if (!response?.data) {
        console.log("Empty response from function");
        setHistory([]);
        setFilteredHistory([]);
        setIsLoading(false);
        return;
      }

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch history");
      }

      console.log("Fetched history data:", response.data.data);
      
      // Save data to cache and state
      const historyData = response.data.data || [];
      historyCache.set(historyData);
      setHistory(historyData);
      setFilteredHistory(historyData);
    } catch (error) {
      console.error('Error fetching identification history:', error);
      toast({
        title: "Failed to load history",
        description: "Could not retrieve your identification history",
        type: "error"
      });
      // Set empty arrays to avoid undefined errors
      setHistory([]);
      setFilteredHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (isAuthenticated && user) {
      fetchIdentificationHistory();
    }
  }, [isAuthenticated, authLoading, user, navigate, fetchIdentificationHistory]);

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

  const handleDeleteRecord = async (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (!itemToDelete || !user) return;
      
      setIsDeleting(true);
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("No active session");
      }

      const response = await supabase.functions.invoke('manage-drug-history', {
        body: { 
          action: 'removeIdentification',
          data: { 
            id: itemToDelete,
            userId: user.id 
          }
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Failed to delete record");
      }

      // Clear cache on successful deletion
      historyCache.clear();
      
      // Update local state to remove the deleted item
      setHistory(prev => prev.filter(item => item.id !== itemToDelete));
      setFilteredHistory(prev => prev.filter(item => item.id !== itemToDelete));
      toast({
        title: "Record deleted",
        description: "Record deleted successfully",
        type: "success"
      });
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Deletion failed",
        description: "Failed to delete record",
        type: "error"
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
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
        toast({
          title: "Information unavailable",
          description: "Detailed information for this medication is not available",
          type: "info"
        });
      }
    }
  };
  
  const extractDrugId = (details: any): string | null => {
    if (!details) return null;
    
    if (details.id) return details.id;
    
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
      fetchIdentificationHistory(true); // Force refresh
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
              <div key={item.id} className="relative group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm cursor-pointer transition-transform hover:scale-105" onClick={() => handleCardClick(item.id)}>
                <div className="absolute top-4 right-4 z-10 bg-gray-100 dark:bg-gray-800 text-xs px-2 py-1 rounded-full flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {format(new Date(item.created_at), 'MMM d, yyyy')}
                </div>
                
                <div className="flex items-start gap-4">
                  {/* Medication icon/image */}
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.drug_name} 
                        className="w-10 h-10 object-contain rounded-full"
                      />
                    ) : (
                      <div className="text-2xl text-blue-500">💊</div>
                    )}
                  </div>
                  
                  {/* Basic medication information */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{item.drug_name || "Unknown Medication"}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-2">
                      {item.details?.genericName || item.details?.generic_name || ""}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.details?.category && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                          {item.details.category}
                        </span>
                      )}
                      
                      {(item.details?.drugClass || item.details?.drug_class) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pharma-50 dark:bg-pharma-900/20 text-pharma-700 dark:text-pharma-300">
                          {item.details?.drugClass || item.details?.drug_class}
                        </span>
                      )}
                      
                      {item.details?.manufacturer && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                          {item.details.manufacturer}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="destructive"
                  size="icon"
                  className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRecord(item.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this medication record from your history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <span className="mr-2">Deleting</span>
                  <span className="animate-spin">●</span>
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default IdentificationHistory;
