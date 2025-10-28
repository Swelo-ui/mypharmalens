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
        .select('identifications_used, last_reset_date')
        .eq('id', user.id)
        .single();

      if (error && (error as any).code !== 'PGRST116') throw error;

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // If no profile row exists, initialize it without resetting usage unexpectedly
      if (!data) {
        const { error: createErr } = await supabase
          .from('profiles')
          .upsert(
            {
              id: user.id,
              identifications_used: 0,
              last_reset_date: now.toISOString(),
            },
            { onConflict: 'id' }
          );
        if (createErr) throw createErr;
        setProfileIdentificationsUsed(0);
        return;
      }

      const lastReset = data.last_reset_date ? new Date(data.last_reset_date) : null;
      const currentUsed = data.identifications_used ?? 0;

      // Only reset when last_reset_date exists and is before current month
      if (lastReset && lastReset < monthStart) {
        const { error: resetErr } = await supabase
          .from('profiles')
          .upsert(
            {
              id: user.id,
              identifications_used: 0,
              last_reset_date: now.toISOString(),
            },
            { onConflict: 'id' }
          );
        if (resetErr) throw resetErr;
        setProfileIdentificationsUsed(0);
      } else {
        // If last_reset_date is missing, set it without altering current usage
        if (!lastReset) {
          const { error: initErr } = await supabase
            .from('profiles')
            .upsert(
              {
                id: user.id,
                last_reset_date: now.toISOString(),
              },
              { onConflict: 'id' }
            );
          if (initErr) console.error('Error initializing last_reset_date:', initErr);
        }
        setProfileIdentificationsUsed(currentUsed);
      }
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
      await calculateUsageStats(specialSubscription, true);
      return;
    }

    try {
      // Fetch all active subscriptions, ordered by created_at descending to get the latest
      const { data: allActiveSubscriptions, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user?.id || '')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // If we have multiple active subscriptions, keep only the latest (non-free) one
      if (allActiveSubscriptions && allActiveSubscriptions.length > 1) {
        console.log(`Found ${allActiveSubscriptions.length} active subscriptions, cleaning up...`);
        
        // Find the latest non-free subscription, or latest overall
        const latestPaidSubscription = allActiveSubscriptions.find(sub => sub.plan_id !== 'free-plan');
        const activeSubscription = latestPaidSubscription || allActiveSubscriptions[0];
        
        // Deactivate all other subscriptions
        const subscriptionsToDeactivate = allActiveSubscriptions.filter(sub => sub.id !== activeSubscription.id);
        
        for (const sub of subscriptionsToDeactivate) {
          await supabase
            .from('user_subscriptions')
            .update({ status: 'inactive' })
            .eq('id', sub.id);
          console.log(`Deactivated subscription: ${sub.plan_id} (${sub.id})`);
        }
        
        setCurrentSubscription(activeSubscription as UserSubscription);
        await calculateUsageStats(activeSubscription as UserSubscription, true);
      } else if (allActiveSubscriptions && allActiveSubscriptions.length === 1) {
        // Single active subscription - use it
        setCurrentSubscription(allActiveSubscriptions[0] as UserSubscription);
        await calculateUsageStats(allActiveSubscriptions[0] as UserSubscription, true);
      } else {
        // No active subscription found - assign free plan
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
      await calculateUsageStats(data as UserSubscription, true);
    } catch (error: any) {
      console.error('Error assigning free plan:', error);
      toast.error('Failed to assign free plan', {
        description: error?.message || 'Unknown error'
      });
    }
  };

  // Calculate usage statistics
  const calculateUsageStats = async (subscription: UserSubscription, forceRefresh: boolean = true) => {
    const plan = subscription.plan;
    // Determine limits based on plan features and plan id
    const hasUnlimited = Array.isArray(plan?.features) && plan!.features!.includes('unlimited_identifications');
    // Use -1 for unlimited, 5 for free, 100 default for other paid plans
    const monthlyLimit = hasUnlimited ? -1 : (plan?.id === 'free-plan' ? 5 : (plan?.id === 'special-plan' ? -1 : 100));
    
    // Always get fresh usage data from profiles to ensure sync across devices
    let used = profileIdentificationsUsed || 0;
    if (user?.id) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('identifications_used')
          .eq('id', user.id)
          .single();
        
        if (!error && data) {
          used = data.identifications_used ?? 0;
          setProfileIdentificationsUsed(used);
          console.log('✅ Usage synced from database:', used);
        } else if (error) {
          console.warn('Error fetching usage data, using cached value:', error);
        }
      } catch (err) {
        console.error('Error fetching fresh usage data:', err);
      }
    }
    
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
    
    // For unauthenticated users, allow limited usage based on localStorage
    if (!isAuthenticated || !user?.id) {
      const guestUsage = parseInt(localStorage.getItem('guest_identifications_used') || '0');
      return guestUsage < 3; // Allow 3 free identifications for guests
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
    if (user?.email === 'imgamer.ms@gmail.com') {
      return true;
    }
    
    // For unauthenticated users, increment guest usage in localStorage
    if (!isAuthenticated || !user?.id) {
      const currentGuestUsage = parseInt(localStorage.getItem('guest_identifications_used') || '0');
      localStorage.setItem('guest_identifications_used', (currentGuestUsage + 1).toString());
      return true;
    }
    
    if (!user?.id) return false;

    try {
      // Fetch current usage and last reset
      const { data: existing, error: fetchErr } = await supabase
        .from('profiles')
        .select('id, identifications_used, last_reset_date')
        .eq('id', user.id)
        .single();

      if (fetchErr && (fetchErr as any).code !== 'PGRST116') throw fetchErr;

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const currentUsed = existing?.identifications_used ?? 0;
      const lastReset = existing?.last_reset_date ? new Date(existing.last_reset_date) : null;

      let newUsed = currentUsed + 1;
      let payload: Partial<Tables<'profiles'>> & { id: string } = { id: user.id } as any;

      // If last_reset_date exists and is before current month, reset then increment
      if (lastReset && lastReset < monthStart) {
        newUsed = 1; // reset to 0 then add 1
        payload = { id: user.id, identifications_used: newUsed, last_reset_date: now.toISOString() } as any;
      } else if (!lastReset) {
        // If missing, initialize last_reset_date without affecting count logic
        payload = { id: user.id, identifications_used: newUsed, last_reset_date: now.toISOString() } as any;
      } else {
        payload = { id: user.id, identifications_used: newUsed } as any;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;

      console.log('✅ Usage incremented to:', newUsed, 'for user:', user.id);
      setProfileIdentificationsUsed(newUsed);
      if (currentSubscription) {
        await calculateUsageStats(currentSubscription, true);
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
      if (!user?.id) return; // wait for user
      setLoading(true);
      try {
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
  }, [user?.id]);

  // Refresh usage when page becomes visible (fixes cross-device sync)
  useEffect(() => {
    if (!user?.id || !currentSubscription) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Page visible - refreshing usage data');
        await fetchProfileUsage();
        if (currentSubscription) {
          await calculateUsageStats(currentSubscription, true);
        }
      }
    };

    const handleFocus = async () => {
      console.log('🔄 Window focused - refreshing usage data');
      await fetchProfileUsage();
      if (currentSubscription) {
        await calculateUsageStats(currentSubscription, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, currentSubscription]);

  // Subscribe to realtime updates on profile usage for current user
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`profile-usage-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        async (payload) => {
          const newUsed = (payload as any)?.new?.identifications_used;
          if (typeof newUsed === 'number') {
            setProfileIdentificationsUsed(newUsed);
            if (currentSubscription) {
              await calculateUsageStats(currentSubscription, false);
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, currentSubscription]);

  // Subscribe to realtime updates on user_subscriptions for current user
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`subscription-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_subscriptions', filter: `user_id=eq.${user.id}` },
        async (payload: any) => {
          try {
            const newRow = payload?.new;
            if (newRow && newRow.status === 'active') {
              // Ensure plan details are present by fetching joined record
              const { data, error } = await supabase
                .from('user_subscriptions')
                .select(`*, plan:subscription_plans(*)`)
                .eq('id', newRow.id)
                .single();
              if (!error && data) {
                const updated = data as UserSubscription;
                setCurrentSubscription(updated);
                await calculateUsageStats(updated, true); // Force refresh usage on subscription update
              } else {
                // Fallback: infer plan from available plans if join failed
                const inferredPlan = availablePlans.find(p => p.id === newRow.plan_id);
                const updated = { ...newRow, plan: inferredPlan } as UserSubscription;
                setCurrentSubscription(updated);
                await calculateUsageStats(updated, true);
              }
            } else {
              // On delete or inactive status, re-fetch to determine current state
              await fetchCurrentSubscription();
            }
          } catch (err) {
            console.error('Realtime subscription update handling error:', err);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, availablePlans]);

  // Reset state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentSubscription(null);
      setProfileIdentificationsUsed(0);
      setUsageStats({
        identificationsUsed: 0,
        identificationsRemaining: 5,
        databaseSearchesUsed: 0,
        databaseSearchesRemaining: 10,
        monthlyLimit: 5,
        planName: 'Free',
      });
    }
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


