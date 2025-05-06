
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { useToast } from '@/hooks/use-toast';

interface UseDrugDetailOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useDrugDetail(options: UseDrugDetailOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any>(null);
  const { user } = useAuthStatus();
  const { toast } = useToast();

  const fetchDrugDetail = useCallback(async (id: string) => {
    if (!user) {
      const error = new Error("User not authenticated");
      setError(error);
      options.onError?.(error);
      return null;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("No active session");
      }
      
      const response = await supabase.functions.invoke('manage-drug-history', {
        body: { 
          action: 'getDrugDetail',
          data: { 
            id: id,
            userId: user.id 
          }
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });
      
      if (!response.data?.success) {
        throw new Error(response.data?.error || "Failed to retrieve drug details");
      }
      
      setData(response.data.data);
      options.onSuccess?.(response.data.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching drug details:', error);
      setError(error);
      toast({
        title: "Error",
        description: "Could not retrieve drug details"
      });
      options.onError?.(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, toast, options]);

  return {
    fetchDrugDetail,
    isLoading,
    error,
    data
  };
}

export default useDrugDetail;
