
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CurrentSubscription from '@/components/subscription/CurrentSubscription';
import CouponRedemption from '@/components/subscription/CouponRedemption';

interface UsageData {
  used: number;
  total: number;
  remaining: number;
  percentage: number;
  base_monthly?: number;
  bonus_from_coupons?: number;
  daily_free?: number;
  last_claimed?: string;
}

const Subscription = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStatus();
  const [isLoading, setIsLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (isAuthenticated && user) {
      loadSubscriptionData();
    }
  }, [isAuthenticated, authLoading, user]);

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await Promise.all([
        fetchUserSubscription(),
        fetchUsageData()
      ]);
    } catch (error: any) {
      console.error('Error loading subscription data:', error);
      setError(`Failed to load subscription data: ${error.message || 'Unknown error'}`);
      toast.error(`Failed to load subscription data: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('subscription-management/user-subscription');
      if (error) throw new Error(error.message);
      if (data?.subscription) {
        setCurrentSubscription(data.subscription);
      }
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      throw error;
    }
  };

  const fetchUsageData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('subscription-management/identification-usage');
      if (error) throw new Error(error.message);
      if (data) {
        setUsage(data);
      }
    } catch (error: any) {
      console.error('Error fetching usage data:', error);
      // Non-critical error, don't throw
    }
  };

  const handleCouponSuccess = () => {
    fetchUsageData();
    fetchUserSubscription();
  };

  const handleRetry = () => {
    loadSubscriptionData();
  };

  if (isLoading || authLoading) {
    return (
      <>
        <Header />
        <div className="container max-w-6xl mx-auto px-4 pt-24 pb-12">
          <div className="flex flex-col justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-gray-500">Loading subscription information...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="container max-w-6xl mx-auto px-4 pt-24 pb-12">
          <div className="flex flex-col justify-center items-center py-12">
            <div className="w-full max-w-md">
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-red-600">
                  {error}
                </AlertDescription>
              </Alert>
              <Button onClick={handleRetry} className="w-full">
                Retry Loading
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container max-w-6xl mx-auto px-4 pt-24 pb-12">
        <h1 className="text-3xl font-bold mb-2">Usage Management</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Monitor your medication identification usage and add bonus identifications
        </p>

        {currentSubscription && (
          <CurrentSubscription 
            subscription={currentSubscription} 
            usage={usage} 
          />
        )}

        {isAuthenticated && (
          <div className="mb-8">
            <CouponRedemption onSuccess={handleCouponSuccess} />
          </div>
        )}
      </div>
    </>
  );
};

export default Subscription;
