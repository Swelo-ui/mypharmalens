import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from './useAuthStatus';
import { toast } from 'sonner';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_inr: number;
  monthly_identifications: number;
  features: {
    database_searches: number;
    ai_identifications: number;
    drug_information: boolean;
    prescription_status: boolean;
    mobile_access: boolean;
    support: string;
    history_feature: boolean;
    layman_explanations: boolean;
    ads: boolean;
    enhanced_info?: boolean;
    brand_generic_search?: boolean;
    advanced_filters?: boolean;
    offline_access?: boolean;
    billing_cycle?: string;
    weekly_price?: number;
    yearly_price?: number;
    yearly_savings?: number;
  };
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'inactive' | 'expired' | 'cancelled';
  subscription_start: string;
  subscription_end: string;
  identifications_used: number;
  razorpay_subscription_id?: string;
  created_at: string;
  plan?: SubscriptionPlan;
}

export const useSubscription = () => {
  const { user, isAuthenticated } = useAuthStatus();
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageStats, setUsageStats] = useState({
    identificationsUsed: 0,
    identificationsRemaining: 0,
    databaseSearchesUsed: 0,
    databaseSearchesRemaining: 0,
    monthlyLimit: 0,
    planName: 'Free'
  });

  // Fetch available subscription plans
  const fetchAvailablePlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_inr', { ascending: true });

      if (error) throw error;
      
      // Type cast the features from Json to our expected type
      const typedPlans = (data || []).map(plan => ({
        ...plan,
        features: plan.features as SubscriptionPlan['features']
      }));
      
      setAvailablePlans(typedPlans);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      toast.error('Failed to load subscription plans');
    }
  };

  // Fetch user's current subscription
  const fetchCurrentSubscription = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      if (data) {
        setCurrentSubscription(data as UserSubscription);
        calculateUsageStats(data as UserSubscription);
      } else {
        // User has no active subscription, assign free plan
        await assignFreePlan();
      }
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      // Fallback to free plan
      await assignFreePlan();
    }
  };

  // Assign free plan to new users
  const assignFreePlan = async () => {
    if (!user?.id) return;

    try {
      const freePlan = availablePlans.find(plan => plan.id === 'free-plan');
      if (!freePlan) return;

      const subscriptionEnd = new Date();
      subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 10); // Free plan never expires

      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: 'free-plan',
          status: 'active',
          subscription_start: new Date().toISOString(),
          subscription_end: subscriptionEnd.toISOString(),
          identifications_used: 0
        })
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .single();

      if (error) throw error;

      setCurrentSubscription(data as UserSubscription);
      calculateUsageStats(data as UserSubscription);
    } catch (error) {
      console.error('Error assigning free plan:', error);
    }
  };

  // Calculate usage statistics
  const calculateUsageStats = (subscription: UserSubscription) => {
    if (!subscription.plan) return;

    const plan = subscription.plan;
    const identificationsUsed = subscription.identifications_used;
    
    // Special handling for specific user - show unlimited usage
    if (user?.email === 'imgamer.ms@gmail.com') {
      setUsageStats({
        identificationsUsed: 0,
        identificationsRemaining: -1, // Unlimited
        databaseSearchesUsed: 0,
        databaseSearchesRemaining: -1, // Unlimited
        monthlyLimit: -1, // Unlimited
        planName: 'Special Access'
      });
      return;
    }
    
    const maxIdentifications = plan.monthly_identifications === -1 ? Infinity : plan.monthly_identifications;
    const identificationsRemaining = maxIdentifications === Infinity ? Infinity : Math.max(0, maxIdentifications - identificationsUsed);

    // For database searches, we'll track this separately in the future
    const databaseSearchesUsed = 0; // TODO: Implement database search tracking
    const maxDatabaseSearches = plan.features.database_searches;
    const databaseSearchesRemaining = Math.max(0, maxDatabaseSearches - databaseSearchesUsed);

    setUsageStats({
      identificationsUsed,
      identificationsRemaining: identificationsRemaining === Infinity ? -1 : identificationsRemaining,
      databaseSearchesUsed,
      databaseSearchesRemaining,
      monthlyLimit: maxIdentifications === Infinity ? -1 : maxIdentifications,
      planName: plan.name
    });
  };

  // Check if user can perform an AI identification
  const canPerformIdentification = (): boolean => {
    // Special access for specific user - remove subscription requirement
    if (user?.email === 'imgamer.ms@gmail.com') {
      return true; // Unlimited access for this user
    }
    
    if (!currentSubscription?.plan) return false;
    
    const plan = currentSubscription.plan;
    if (plan.monthly_identifications === -1) return true; // Unlimited
    
    return currentSubscription.identifications_used < plan.monthly_identifications;
  };

  // Get database search limit based on subscription plan
  const getDatabaseSearchLimit = () => {
    if (!currentSubscription || !currentSubscription.plan) return 10; // Default for free users
    
    return currentSubscription.plan.features.database_searches || 10;
  };

  // Check if user can access a specific feature
  const hasFeatureAccess = (feature: keyof SubscriptionPlan['features']): boolean => {
    if (!currentSubscription?.plan) return false;
    return currentSubscription.plan.features[feature] as boolean;
  };

  // Increment identification usage
  const incrementIdentificationUsage = async (): Promise<boolean> => {
    // Special handling for specific user - don't increment usage
    if (user?.email === 'imgamer.ms@gmail.com') {
      return true; // Always return success without incrementing
    }
    
    if (!currentSubscription || !canPerformIdentification()) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          identifications_used: currentSubscription.identifications_used + 1
        })
        .eq('id', currentSubscription.id);

      if (error) throw error;

      // Update local state
      const updatedSubscription = {
        ...currentSubscription,
        identifications_used: currentSubscription.identifications_used + 1
      };
      setCurrentSubscription(updatedSubscription);
      calculateUsageStats(updatedSubscription);

      return true;
    } catch (error) {
      console.error('Error incrementing identification usage:', error);
      return false;
    }
  };

  // Get plan by ID
  const getPlanById = (planId: string): SubscriptionPlan | undefined => {
    return availablePlans.find(plan => plan.id === planId);
  };

  // Check if subscription is expired
  const isSubscriptionExpired = (): boolean => {
    if (!currentSubscription) return true;
    return new Date(currentSubscription.subscription_end) < new Date();
  };

  // Get subscription status display
  const getSubscriptionStatusDisplay = (): string => {
    if (!currentSubscription) return 'No Subscription';
    
    if (isSubscriptionExpired()) return 'Expired';
    
    switch (currentSubscription.status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  useEffect(() => {
    const initializeSubscription = async () => {
      setLoading(true);
      await fetchAvailablePlans();
      if (isAuthenticated && user) {
        await fetchCurrentSubscription();
      }
      setLoading(false);
    };

    initializeSubscription();
  }, [user, isAuthenticated]);

  return {
    currentSubscription,
    availablePlans,
    loading,
    usageStats,
    canPerformIdentification,
    getDatabaseSearchLimit,
    hasFeatureAccess,
    incrementIdentificationUsage,
    getPlanById,
    isSubscriptionExpired,
    getSubscriptionStatusDisplay,
    refetchSubscription: fetchCurrentSubscription
  };
};