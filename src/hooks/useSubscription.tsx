import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from './useAuthStatus';
import { toast } from 'sonner';
import { Tables } from '@/types/database.types';

export type SubscriptionPlan = Tables<"subscription_plans">;
export type UserSubscription = Tables<"user_subscriptions"> & {
  plan?: SubscriptionPlan;
};

export const useSubscription = () => {
  const { user, isAuthenticated } = useAuthStatus();
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [usageStats, setUsageStats] = useState({
    identificationsUsed: 0,
    identificationsRemaining: 5,
    databaseSearchesUsed: 0,
    databaseSearchesRemaining: 10,
    monthlyLimit: 5,
    planName: 'Free'
  });

  // Fetch identifications_used from profiles
  const [profileIdentificationsUsed, setProfileIdentificationsUsed] = useState<number>(0);

  // Fetch profile usage data
  const fetchProfileUsage = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('identifications_used')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfileIdentificationsUsed(data?.identifications_used || 0);
    } catch (error) {
      console.error('Error fetching profile usage:', error);
      setProfileIdentificationsUsed(0);
    }
  };

  // Fetch available subscription plans
  const fetchAvailablePlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setAvailablePlans((data || []) as SubscriptionPlan[]);
    } catch (error: any) {
      console.error('Error fetching subscription plans:', error);
      const msg = error?.message || 'Unknown error';
      const details = error?.hint || error?.details || error?.code || '';
      toast.error('Failed to load subscription plans', {
        description: `${msg}${details ? ` (code: ${details})` : ''}`
      });
    }
  };

  // Fetch user's current subscription
  const fetchCurrentSubscription = async () => {
    if (!user?.id) return;

    // Special handling for specific user - set special access directly
    if (user?.email === 'imgamer.ms@gmail.com') {
      const specialSubscription: UserSubscription = {
        id: 'special-access',
        user_id: user.id,
        plan_id: 'special-plan',
        status: 'active',
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        plan: {
          id: 'special-plan',
          name: 'Special Access',
          description: 'Unlimited access for special users',
          price: 0,
          currency: 'INR',
          billing_period: 'yearly',
          features: ['unlimited_identifications', 'advanced_search', 'history_feature', 'layman_explanations'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      } as unknown as UserSubscription;
      
      setCurrentSubscription(specialSubscription);
      calculateUsageStats(specialSubscription);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user?.id || '')
        .eq('status', 'active')
        .single();

      if (error && (error as any).code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setCurrentSubscription(data as UserSubscription);
        calculateUsageStats(data as UserSubscription);
      } else {
        await assignFreePlan();
      }
    } catch (error: any) {
      console.error('Error fetching current subscription:', error);
      toast.error('Failed to fetch current subscription', {
        description: error?.message || 'Unknown error'
      });
      await assignFreePlan();
    }
  };

  // Assign free plan to new users
  const assignFreePlan = async () => {
    if (!user?.id) return;

    try {
      const freePlan = availablePlans.find(plan => plan.id === 'free-plan');
      if (!freePlan) return;

      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 10);

      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: 'free-plan',
          status: 'active',
          starts_at: new Date().toISOString(),
          ends_at: endDate.toISOString()
        })
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .single();

      if (error) throw error;

      setCurrentSubscription(data as UserSubscription);
      calculateUsageStats(data as UserSubscription);
    } catch (error: any) {
      console.error('Error assigning free plan:', error);
      toast.error('Failed to assign free plan', {
        description: error?.message || 'Unknown error'
      });
    }
  };

  // Calculate usage statistics
  const calculateUsageStats = (subscription: UserSubscription) => {
    const plan = subscription.plan;
    // For now, use a default limit of 5 for free plans since we don't have limit columns
    const monthlyLimit = plan?.id === 'free-plan' ? 5 : (plan?.id === 'special-plan' ? -1 : 100);
    const used = profileIdentificationsUsed || 0;
    const remaining = monthlyLimit < 0 ? -1 : Math.max(monthlyLimit - used, 0);

    setUsageStats({
      identificationsUsed: used,
      identificationsRemaining: remaining,
      databaseSearchesUsed: 0,
      databaseSearchesRemaining: 100, // Default limit
      monthlyLimit,
      planName: plan?.name || 'Free'
    });
  };

  // Check if user can perform an AI identification
  const canPerformIdentification = (): boolean => {
    if (user?.email === 'imgamer.ms@gmail.com') {
      return true;
    }
    // While subscription info is loading or unavailable, default to Free plan limits
    if (!currentSubscription?.plan) {
      return (profileIdentificationsUsed || 0) < 5;
    }
    const plan = currentSubscription.plan;
    // Use default limits based on plan type
    const limit = plan.id === 'free-plan' ? 5 : (plan.id === 'special-plan' ? -1 : 100);
    if (limit === -1) return true;
    return profileIdentificationsUsed < limit;
  };

  // Get database search limit based on subscription plan
  const getDatabaseSearchLimit = () => {
    if (!currentSubscription || !currentSubscription.plan) return 10;
    // Use default limits based on plan type
    return currentSubscription.plan.id === 'free-plan' ? 10 : 100;
  };

  // Check if user can access a specific feature
  const hasFeatureAccess = (feature: 'history_feature' | 'layman_explanations' | 'advanced_filters'): boolean => {
    if (!currentSubscription?.plan) return false;
    const plan = currentSubscription.plan;
    
    // Check if the feature is in the features array
    if (plan.features && Array.isArray(plan.features)) {
      switch (feature) {
        case 'history_feature':
          return plan.features.includes('history_feature');
        case 'layman_explanations':
          return plan.features.includes('layman_explanations');
        case 'advanced_filters':
          return plan.features.includes('advanced_search');
        default:
          return false;
      }
    }
    
    // Default access for free plan (limited features)
    return plan.id !== 'free-plan';
  };

  // Increment identification usage (stored in profiles)
  const incrementIdentificationUsage = async (): Promise<boolean> => {
    if (user?.email === 'imgamer.ms@gmail0com') {
      return true;
    }
    if (!user?.id) return false;

    try {
      // Ensure profile exists and upsert usage atomically
      const { data: existing, error: fetchErr } = await supabase
        .from('profiles')
        .select('id, identifications_used')
        .eq('id', user.id)
        .single();

      const currentUsed = existing?.identifications_used ?? 0;

      // Upsert with conflict on id
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, identifications_used: currentUsed + 1 }, { onConflict: 'id' });

      if (error || fetchErr) {
        throw error || fetchErr;
      }

      const newUsed = currentUsed + 1;
      setProfileIdentificationsUsed(newUsed);
      if (currentSubscription) {
        calculateUsageStats(currentSubscription);
      }
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
    return new Date(currentSubscription.ends_at || '') < new Date();
  };

  // Get subscription status display
  const getSubscriptionStatusDisplay = (): string => {
    if (!currentSubscription) return 'No Subscription';
    if (isSubscriptionExpired()) return 'Expired';
    return currentSubscription.status === 'active' ? 'Active' : 'Inactive';
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // Log Supabase URL to aid debugging (non-sensitive)
        console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
        await fetchAvailablePlans();
        await fetchProfileUsage();
        await fetchCurrentSubscription();
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return {
      currentSubscription,
      availablePlans,
      loading,
      usageStats,
      canPerformIdentification,
      getDatabaseSearchLimit,
      hasFeatureAccess,
      getPlanById,
      isSubscriptionExpired,
      getSubscriptionStatusDisplay,
      incrementIdentificationUsage
    };
};