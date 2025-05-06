
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
      
      // Process the data to match our frontend data structure
      const responseData = response.data.data;
      
      // Support both snake_case from DB and camelCase for frontend components
      const processedData = responseData ? {
        ...responseData,
        // Add properties with camelCase for frontend components
        genericName: responseData.generic_name || "",
        dosageAndAdmin: responseData.dosage_and_admin || "",
        sideEffects: Array.isArray(responseData.side_effects) ? responseData.side_effects : [],
        prescriptionStatus: responseData.prescription_status || "OTC",
        image: responseData.image_url || "",
        packageImage: responseData.package_image_url || "",
        drugClass: responseData.drug_class || "",
        brandNames: Array.isArray(responseData.brand_names) ? responseData.brand_names : [],
        
        // Ensure original snake_case properties also exist
        generic_name: responseData.generic_name || "",
        dosage_and_admin: responseData.dosage_and_admin || "",
        side_effects: Array.isArray(responseData.side_effects) ? responseData.side_effects : [],
        prescription_status: responseData.prescription_status || "OTC",
        image_url: responseData.image_url || "",
        package_image_url: responseData.package_image_url || "",
        drug_class: responseData.drug_class || "",
        brand_names: Array.isArray(responseData.brand_names) ? responseData.brand_names : []
      } : null;
      
      console.log("Processed drug detail data:", processedData);
      setData(processedData);
      options.onSuccess?.(processedData);
      return processedData;
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
