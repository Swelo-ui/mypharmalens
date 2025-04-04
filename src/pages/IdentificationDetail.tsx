import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Clock, AlertTriangle, ImageIcon, Activity, Pill } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface IdentificationDetailRecord {
  id: string;
  created_at: string;
  drug_name: string;
  image_url?: string;
  details: any;
  user_id?: string;
}

const IdentificationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStatus();
  const [record, setRecord] = useState<IdentificationDetailRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/auth');
        return;
      }

      if (id) {
        fetchIdentificationDetail();
      }
    }
  }, [id, isAuthenticated, authLoading]);

  const fetchIdentificationDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user || !id) {
        throw new Error("User not authenticated or invalid identification ID");
      }

      const { data, error } = await supabase
        .from('drug_identifications')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw error;
      }

      console.log("Fetched identification detail:", data);
      setRecord(data);
    } catch (error: any) {
      console.error('Error fetching identification detail:', error);
      setError(error.message || "Failed to load identification details");
      toast.error("Failed to load identification details");
    } finally {
      setIsLoading(false);
    }
  };

  const tryNavigateToDrug = () => {
    if (record && record.details) {
      // Try to extract drug ID
      const drugId = extractDrugId(record.details);
      
      if (drugId) {
        navigate(`/drug/${drugId}`);
      } else {
        toast.info("No detailed drug information available for this identification");
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

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="container max-w-4xl mx-auto px-4 pt-24 pb-12">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to history
          </Button>
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !record) {
    return (
      <>
        <Header />
        <div className="container max-w-4xl mx-auto px-4 pt-24 pb-12">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/history')} 
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to history
          </Button>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error Loading Identification</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {error || "This identification record could not be found or you don't have permission to view it."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => fetchIdentificationDetail()}>
                Try Again
              </Button>
              <Button variant="outline" onClick={() => navigate('/history')}>
                Return to History
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Parse details if it's a string
  let parsedDetails = record.details;
  if (typeof record.details === 'string') {
    try {
      parsedDetails = JSON.parse(record.details);
    } catch (e) {
      console.error("Error parsing details:", e);
      // Keep original if parsing fails
    }
  }

  return (
    <>
      <Header />
      <div className="container max-w-4xl mx-auto px-4 pt-24 pb-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/history')} 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to history
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left sidebar with image and key info */}
          <div className="col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-4">
              <div className="aspect-square relative overflow-hidden rounded-lg mb-4">
                {record.image_url ? (
                  <img 
                    src={record.image_url} 
                    alt={record.drug_name || "Medication"} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <ImageIcon className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              
              <h1 className="text-xl font-bold mb-1">
                {record.drug_name || "Unknown Medication"}
              </h1>
              
              {parsedDetails?.genericName && (
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                  Generic: {parsedDetails.genericName}
                </p>
              )}
              
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                <Calendar className="h-4 w-4 mr-1.5" />
                <span>
                  {format(new Date(record.created_at), 'MMMM d, yyyy')}
                </span>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4 mr-1.5" />
                <span>
                  {format(new Date(record.created_at), 'h:mm a')}
                </span>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2">
                {parsedDetails?.category && (
                  <Badge variant="secondary">{parsedDetails.category}</Badge>
                )}
                {parsedDetails?.drugClass && (
                  <Badge variant="outline">{parsedDetails.drugClass}</Badge>
                )}
                {parsedDetails?.prescriptionStatus && (
                  <Badge 
                    className={
                      parsedDetails.prescriptionStatus === 'OTC' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200' 
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-200'
                    }
                  >
                    {parsedDetails.prescriptionStatus}
                  </Badge>
                )}
              </div>
              
              <Button 
                className="w-full mt-4" 
                onClick={tryNavigateToDrug}
                disabled={!extractDrugId(record.details)}
              >
                <Pill className="h-4 w-4 mr-2" />
                View Complete Drug Info
              </Button>
            </div>
            
            {/* Identification Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <h3 className="font-medium mb-3 flex items-center">
                <Activity className="h-4 w-4 mr-1.5" />
                Identification Info
              </h3>
              <div className="space-y-2 text-sm">
                {parsedDetails?.confidence && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                    <span className={`font-medium ${
                      parsedDetails.confidence === 'high' 
                        ? 'text-green-600' 
                        : parsedDetails.confidence === 'medium'
                          ? 'text-amber-600'
                          : 'text-red-600'
                    }`}>
                      {parsedDetails.confidence.charAt(0).toUpperCase() + parsedDetails.confidence.slice(1)}
                    </span>
                  </div>
                )}
                
                {parsedDetails?.fromHistory && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Source:</span>
                    <span className="font-medium">Historical Match</span>
                  </div>
                )}
                
                {parsedDetails?.blurryModeUsed && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Analysis:</span>
                    <span className="font-medium">Enhanced Mode</span>
                  </div>
                )}
                
                {parsedDetails?.matchSimilarity && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Match Score:</span>
                    <span className="font-medium">
                      {Math.round(parsedDetails.matchSimilarity * 100)}%
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Record ID:</span>
                  <span className="font-medium text-xs">{record.id.slice(0, 8)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right side - Details */}
          <div className="col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Medication Details</h2>
              
              {parsedDetails?.description && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Description</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {parsedDetails.description}
                  </p>
                </div>
              )}
              
              {parsedDetails?.manufacturer && (
                <div className="mb-4">
                  <h3 className="font-medium mb-1 text-gray-700 dark:text-gray-300">Manufacturer</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {parsedDetails.manufacturer}
                  </p>
                </div>
              )}
              
              {parsedDetails?.dosageAndAdmin && (
                <div className="mb-4">
                  <h3 className="font-medium mb-1 text-gray-700 dark:text-gray-300">Dosage & Administration</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {parsedDetails.dosageAndAdmin}
                  </p>
                </div>
              )}
              
              {parsedDetails?.interactions && parsedDetails.interactions.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium mb-1 text-gray-700 dark:text-gray-300">Interactions</h3>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                    {parsedDetails.interactions.slice(0, 3).map((item: string, index: number) => (
                      <li key={index} className="mb-1">{item}</li>
                    ))}
                    {parsedDetails.interactions.length > 3 && (
                      <li className="text-sm text-gray-500">
                        And {parsedDetails.interactions.length - 3} more...
                      </li>
                    )}
                  </ul>
                </div>
              )}
              
              {parsedDetails?.sideEffects && parsedDetails.sideEffects.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium mb-1 text-gray-700 dark:text-gray-300">Side Effects</h3>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                    {parsedDetails.sideEffects.slice(0, 3).map((item: string, index: number) => (
                      <li key={index} className="mb-1">{item}</li>
                    ))}
                    {parsedDetails.sideEffects.length > 3 && (
                      <li className="text-sm text-gray-500">
                        And {parsedDetails.sideEffects.length - 3} more...
                      </li>
                    )}
                  </ul>
                </div>
              )}
              
              {parsedDetails?.warnings && parsedDetails.warnings.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium mb-1 text-gray-700 dark:text-gray-300">Warnings</h3>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                    {parsedDetails.warnings.slice(0, 2).map((item: string, index: number) => (
                      <li key={index} className="mb-1">{item}</li>
                    ))}
                    {parsedDetails.warnings.length > 2 && (
                      <li className="text-sm text-gray-500">
                        And {parsedDetails.warnings.length - 2} more...
                      </li>
                    )}
                  </ul>
                </div>
              )}
              
              {extractDrugId(record.details) && (
                <Button 
                  className="mt-4 w-full"
                  variant="outline" 
                  onClick={tryNavigateToDrug}
                >
                  View Full Medication Information
                </Button>
              )}
              
              {!extractDrugId(record.details) && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-6">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0" />
                    <p className="text-amber-700 dark:text-amber-300 text-sm">
                      This identification does not have a linked drug record in our database. 
                      The information shown is from the original identification only.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default IdentificationDetail;
