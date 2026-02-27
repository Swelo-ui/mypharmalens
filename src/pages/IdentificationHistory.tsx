
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock, Search, AlertTriangle, Filter, Trash2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import Header from '@/components/Header';
import DrugCard from '@/components/DrugCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
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
  details: IdentificationDetails | string | null;
  user_id?: string;
  image_features?: string;
}

type IdentificationDetails = {
  id?: string;
  genericName?: string;
  generic_name?: string;
  manufacturer?: string;
  category?: string;
  description?: string;
  drugClass?: string;
  drug_class?: string;
  verified?: boolean;
  image?: string;
};

const getDetailsObject = (details: IdentificationRecord['details']): IdentificationDetails | null => {
  if (details && typeof details === 'object') {
    return details as IdentificationDetails;
  }
  if (typeof details === 'string') {
    try {
      const parsed = JSON.parse(details);
      return parsed && typeof parsed === 'object' ? (parsed as IdentificationDetails) : null;
    } catch {
      return null;
    }
  }
  return null;
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
  const [showWarningBanner, setShowWarningBanner] = useState(true);
  const navigate = useNavigate();

  // Check if banner was dismissed in this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('historyWarningDismissed');
    if (dismissed === 'true') {
      setShowWarningBanner(false);
    }
  }, []);

  const dismissWarningBanner = () => {
    setShowWarningBanner(false);
    sessionStorage.setItem('historyWarningDismissed', 'true');
  };

  const fetchIdentificationHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("No active session");
      }

      const response = await supabase.functions.invoke('manage-drug-history', {
        body: { 
          action: 'getIdentificationHistory',
          data: { userId: user.id }
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to fetch history");
      }

      console.log("Fetched history data:", response.data.data);
      setHistory(response.data.data || []);
      setFilteredHistory(response.data.data || []);
    } catch (error) {
      console.error('Error fetching identification history:', error);
      toast.error("Failed to load your identification history");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

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

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to delete record");
      }

      // Update local state to remove the deleted item
      setHistory(prev => prev.filter(item => item.id !== itemToDelete));
      toast.success("Record deleted successfully");
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error("Failed to delete record");
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
        toast.info("Detailed information for this medication is not available");
      }
    }
  };
  
  const extractDrugId = (details: IdentificationRecord['details']): string | null => {
    if (!details) return null;
    
    const detailsObject = getDetailsObject(details);
    if (detailsObject?.id) return detailsObject.id;
    
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
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
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

        {/* Dismissible Warning Banner */}
        {showWarningBanner && (
          <Alert className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissWarningBanner}
              className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-800"
            >
              <X className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </Button>
            <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-300 pr-8">History Storage Limit</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-400 text-sm break-words">
              You can store up to <strong className="font-semibold">10 drug identifications</strong>. 
              Images are not stored to reduce server load. When you reach the limit, the oldest entry will be automatically removed.
            </AlertDescription>
          </Alert>
        )}

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
            {filteredHistory.map((item) => {
              const details = getDetailsObject(item.details);
              return (
              <div key={item.id} className="relative group">
                <div 
                  className="cursor-pointer transition-transform hover:scale-105"
                  onClick={() => handleCardClick(item.id)}
                >
                  <div className="absolute top-4 right-4 z-10 bg-gray-100 dark:bg-gray-800 text-xs px-2 py-1 rounded-full flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {format(new Date(item.created_at), 'MMM d, yyyy')}
                  </div>
                  <DrugCard
                    drug={{
                      id: extractDrugId(item.details) || item.id,
                      name: item.drug_name || "Unknown Medication",
                      genericName: details?.genericName || details?.generic_name || "",
                      manufacturer: details?.manufacturer || "",
                      category: details?.category || "",
                      description: details?.description || "",
                      drugClass: details?.drugClass || details?.drug_class || "",
                      verified: details?.verified || false,
                      image: item.image_url || details?.image || "",
                    }}
                  />
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
            );
            })}
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
