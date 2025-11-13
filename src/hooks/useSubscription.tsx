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
  const [extraIdentifications, setExtraIdentifications] = useState<number>(0);

  // Fetch profile usage data - ensures profile exists and is initialized
  const fetchProfileUsage = async () => {
    if (!user?.id) return;
    
    try {
      const now = new Date();
      
      // First, ensure profile exists with proper defaults
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            identifications_used: 0,
            last_reset_date: now.toISOString(),
            monthly_identifications: 5
          },
          { 
            onConflict: 'id',
            ignoreDuplicates: true // Don't overwrite existing data
          }
        );
      
      if (upsertError) {
        console.error('Error ensuring profile exists:', upsertError);
      }
      
      // Now fetch the actual data
      const { data, error } = await supabase
        .from('profiles')
        .select('identifications_used, last_reset_date, extra_identifications')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfileIdentificationsUsed(0);
        return;
      }

      if (!data) {
        console.warn('No profile data found after upsert');
        setProfileIdentificationsUsed(0);
        return;
      }

      const lastReset = data.last_reset_date ? new Date(data.last_reset_date) : null;
      const currentUsed = data.identifications_used ?? 0;
      const currentExtra = (data as any).extra_identifications ?? 0;
      setExtraIdentifications(currentExtra);

      // Check if we need to reset based on billing cycle (30 days since last reset)
      // This ensures reset happens on subscription anniversary, not calendar month
      const shouldReset = lastReset && (now.getTime() - lastReset.getTime()) >= (30 * 24 * 60 * 60 * 1000);

      if (shouldReset) {
        console.log('📅 Resetting usage - 30 days elapsed since last reset');
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
        // If no subscription is loaded yet, immediately reflect usage in the UI (assume Free limits)
        if (!currentSubscription) {
          setUsageStats(prev => ({
            ...prev,
            identificationsUsed: currentUsed,
            identificationsRemaining: Math.max(5 - currentUsed, 0),
            monthlyLimit: 5,
            planName: 'Free'
          }));
        }
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
      
      // Don't show error toasts when offline - user already gets offline notification
      const isOfflineError = !navigator.onLine || 
                            error?.message?.includes('fetch') ||
                            error?.message?.includes('Failed to fetch') ||
                            error?.code === 'PGRST301';
      
      if (!isOfflineError) {
        const msg = error?.message || 'Unknown error';
        toast.error('Failed to load subscription plans', {
          description: msg,
          duration: 4000
        });
      } else {
        console.log('📴 Offline - subscription data will load when online');
      }
    }
  };

  // Handle expired subscriptions - mark as expired and reset to free plan
  const handleExpiredSubscriptions = async () => {
    if (!user?.id) return;

    try {
      const now = new Date();

      // Find all active paid subscriptions that have expired
      const { data: expiredSubs, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('id, plan_id, ends_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .neq('plan_id', 'free-plan')
        .not('ends_at', 'is', null);

      if (fetchError) {
        console.error('Error fetching subscriptions for expiry check:', fetchError);
        return;
      }

      if (!expiredSubs || expiredSubs.length === 0) {
        return;
      }

      // Check which ones are actually expired
      const expiredIds = expiredSubs
        .filter(sub => sub.ends_at && new Date(sub.ends_at) < now)
        .map(sub => sub.id);

      if (expiredIds.length === 0) {
        return;
      }

      console.log(`⚠️ Found ${expiredIds.length} expired subscriptions, processing...`);

      // Mark subscriptions as expired
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({ status: 'expired' })
        .in('id', expiredIds);

      if (updateError) {
        console.error('Error marking subscriptions as expired:', updateError);
        return;
      }

      // Reset user usage to 0
      const { error: resetError } = await supabase
        .from('profiles')
        .update({
          identifications_used: 0,
          last_reset_date: now.toISOString(),
          monthly_identifications: 5
        })
        .eq('id', user.id);

      if (resetError) {
        console.error('Error resetting user usage:', resetError);
      }

      // Check if user already has an active free plan
      const { data: existingFreePlan } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('plan_id', 'free-plan')
        .eq('status', 'active')
        .maybeSingle();

      // If no active free plan, create one
      if (!existingFreePlan) {
        const { error: freePlanError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            plan_id: 'free-plan',
            status: 'active',
            starts_at: now.toISOString(),
            ends_at: null
          });

        if (freePlanError) {
          console.error('Error creating free plan:', freePlanError);
        } else {
          console.log('✅ Assigned free plan to user');
        }
      }

      console.log('✅ Successfully processed expired subscriptions');
      toast.info('Subscription Expired', {
        description: 'Your subscription has expired. You have been moved to the free plan.',
        duration: 5000
      });

    } catch (error) {
      console.error('Error handling expired subscriptions:', error);
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
      await reconcileBonusIdentifications();
      return;
    }

    try {
      // First, check for expired subscriptions and handle them
      await handleExpiredSubscriptions();

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
        await reconcileBonusIdentifications();
      } else if (allActiveSubscriptions && allActiveSubscriptions.length === 1) {
        // Single active subscription - use it
        setCurrentSubscription(allActiveSubscriptions[0] as UserSubscription);
        await calculateUsageStats(allActiveSubscriptions[0] as UserSubscription, true);
        await reconcileBonusIdentifications();
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

  // Reconcile bonus identifications based on actual usage
  const reconcileBonusIdentifications = async () => {
    if (!user?.id || !currentSubscription) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('identifications_used, extra_identifications')
        .eq('id', user.id)
        .single();
      
      if (error || !data) return;
      
      const currentUsed = data.identifications_used ?? 0;
      const currentExtra = data.extra_identifications ?? 0;
      
      if (currentExtra === 0) return; // No bonus to reconcile
      
      // Get monthly limit
      const plan = currentSubscription.plan;
      const planId = plan?.id || currentSubscription.plan_id || '';
      const planName = plan?.name || '';
      
      let monthlyLimit = 5;
      if (planId === 'special-plan') {
        monthlyLimit = -1;
      } else if (planId === 'free-plan') {
        monthlyLimit = 5;
      } else if (planId.toLowerCase().includes('lite') || planName.toLowerCase().includes('lite')) {
        monthlyLimit = 39;
      } else if (planId.toLowerCase().includes('pro') || planName.toLowerCase().includes('pro')) {
        monthlyLimit = 101;
      }
      
      // Check if usage or bonus needs reconciliation
      if (monthlyLimit !== -1 && currentUsed >= monthlyLimit) {
        let needsUpdate = false;
        let updates: any = {};
        
        // CRITICAL: identifications_used should NEVER exceed monthlyLimit
        // If it does, cap it at monthlyLimit
        if (currentUsed > monthlyLimit) {
          console.log('🔧 CRITICAL: Usage exceeds monthly limit, capping at limit:', {
            currentUsed,
            monthlyLimit,
            capping: `${currentUsed} → ${monthlyLimit}`
          });
          updates.identifications_used = monthlyLimit;
          needsUpdate = true;
        }
        
        // Check if bonus needs reconciliation
        const bonusAlreadyUsed = Math.max(0, currentUsed - monthlyLimit);
        
        if (bonusAlreadyUsed > currentExtra) {
          // Bonus was fully consumed, should be 0
          if (currentExtra > 0) {
            console.log('🔧 AUTO-RECONCILING: Bonus fully consumed:', {
              currentUsed,
              monthlyLimit,
              bonusAlreadyUsed,
              currentExtra,
              setting: 0
            });
            updates.extra_identifications = 0;
            needsUpdate = true;
          }
        } else if (bonusAlreadyUsed > 0) {
          // Some bonus was used
          const bonusShouldRemain = currentExtra - bonusAlreadyUsed;
          
          if (bonusShouldRemain !== currentExtra && bonusShouldRemain >= 0) {
            console.log('🔧 AUTO-RECONCILING partial bonus usage:', {
              currentUsed,
              monthlyLimit,
              bonusWas: currentExtra,
              bonusShouldBe: bonusShouldRemain,
              bonusUsed: bonusAlreadyUsed
            });
            updates.extra_identifications = bonusShouldRemain;
            needsUpdate = true;
          }
        }
        
        // Apply updates if needed
        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);
          
          if (!updateError) {
            if (updates.identifications_used !== undefined) {
              setProfileIdentificationsUsed(updates.identifications_used);
            }
            if (updates.extra_identifications !== undefined) {
              setExtraIdentifications(updates.extra_identifications);
            }
            
            if (updates.identifications_used !== undefined) {
              toast.info(`Usage corrected to monthly limit`, {
                description: `Usage was ${currentUsed}, capped at ${monthlyLimit}`,
                duration: 4000
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error reconciling bonus identifications:', error);
    }
  };

  // Calculate usage statistics
  const calculateUsageStats = async (subscription: UserSubscription, forceRefresh: boolean = true) => {
    const plan = subscription.plan;
    
    // Check if paid subscription is expired
    const now = new Date();
    const endsAt = subscription.ends_at ? new Date(subscription.ends_at) : null;
    const isExpired = endsAt && now > endsAt && subscription.plan_id !== 'free-plan';
    
    // Determine limits based on plan features, billing period, and plan id
    const hasUnlimited = Array.isArray(plan?.features) && plan!.features!.includes('unlimited_identifications');
    const billingPeriod = plan?.billing_period || subscription.plan?.billing_period || 'monthly';
    const planId = plan?.id || subscription.plan_id || '';
    const planName = plan?.name || '';
    
    console.log('📊 Plan detection:', { planId, planName, billingPeriod, subscriptionPlanId: subscription.plan_id });
    
    // If expired, force free tier limits (5), otherwise use plan limits
    let monthlyLimit: number;
    if (isExpired) {
      monthlyLimit = 5; // Expired subscriptions get free tier limits
      console.log('⚠️ Subscription expired - applying free tier limits');
    } else if (hasUnlimited || planId === 'special-plan') {
      monthlyLimit = -1; // Unlimited
    } else if (planId === 'free-plan') {
      monthlyLimit = 5; // Free tier
    } else if (planId.toLowerCase().includes('lite') || planName.toLowerCase().includes('lite')) {
      monthlyLimit = 39; // Lite plan: 39 identifications per month
      console.log('✅ Lite plan detected - 39 identifications');
    } else if (planId.toLowerCase().includes('pro') || planName.toLowerCase().includes('pro')) {
      monthlyLimit = 101; // Pro plan: 101 identifications per month
      console.log('✅ Pro plan detected - 101 identifications');
    } else {
      // Fallback to 5 for unknown plans to be safe
      monthlyLimit = 5;
      console.warn('⚠️ Unknown plan, defaulting to free tier limits:', { planId, planName });
    }
    
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

  // Check if user can perform an identification
  const canPerformIdentification = (): boolean => {
    // Special access for specific user
    if (user?.email === 'imgamer.ms@gmail.com') {
      return true;
    }
    
    // For unauthenticated users, allow limited usage based on localStorage
    if (!isAuthenticated || !user?.id) {
      const guestUsage = parseInt(localStorage.getItem('guest_identifications_used') || '0');
      return guestUsage < 3; // Allow 3 free identifications for guests
    }
    
    // Get current usage count
    const currentUsage = profileIdentificationsUsed || 0;
    
    // Check if subscription is expired (paid subscriptions only)
    if (currentSubscription && currentSubscription.plan_id !== 'free-plan') {
      const now = new Date();
      const endsAt = currentSubscription.ends_at ? new Date(currentSubscription.ends_at) : null;
      if (endsAt && now > endsAt) {
        console.warn('⚠️ Subscription expired - limiting to free tier (no bonus allowed)');
        // Expired paid subscription = free tier limits (5 identifications, NO BONUS)
        const canProceed = currentUsage < 5;
        console.log('🔒 Free tier check (expired):', { currentUsage, limit: 5, canProceed, bonusIgnored: true });
        return canProceed;
      }
    }
    
    // While subscription info is loading or unavailable, default to Free plan limits
    if (!currentSubscription?.plan) {
      // No subscription = free tier with bonus allowed
      const totalLimit = 5 + extraIdentifications;
      const canProceed = currentUsage < totalLimit;
      console.log('🔒 Free tier check (no subscription):', { currentUsage, monthlyLimit: 5, bonusIds: extraIdentifications, totalLimit, canProceed });
      return canProceed;
    }
    
    const plan = currentSubscription.plan;
    const planId = plan?.id || currentSubscription.plan_id || '';
    const planName = plan?.name || '';
    
    console.log('🔍 canPerformIdentification - Plan check:', { planId, planName });
    
    // Use default limits based on plan type
    let limit: number;
    if (planId === 'special-plan') {
      limit = -1; // Unlimited
    } else if (planId === 'free-plan') {
      limit = 5; // Free plan: 5 identifications
    } else if (planId.toLowerCase().includes('lite') || planName.toLowerCase().includes('lite')) {
      limit = 39; // Lite plan: 39 identifications  
      console.log('✅ Lite plan detected in canPerform - limit: 39');
    } else if (planId.toLowerCase().includes('pro') || planName.toLowerCase().includes('pro')) {
      limit = 101; // Pro plan: 101 identifications
      console.log('✅ Pro plan detected in canPerform - limit: 101');
    } else {
      limit = 5; // Default to free tier for unknown plans
      console.warn('⚠️ Unknown plan in canPerform, defaulting to free:', { planId, planName });
    }
    
    if (limit === -1) return true; // Unlimited
    
    // Include bonus identifications in the total limit
    const totalLimit = limit + extraIdentifications;
    const canProceed = currentUsage < totalLimit;
    console.log('🔒 Limit check:', { currentUsage, monthlyLimit: limit, bonusIds: extraIdentifications, totalLimit, planId, canProceed });
    return canProceed;
  };

  // Get database search limit based on subscription plan
  const getDatabaseSearchLimit = () => {
    if (!currentSubscription || !currentSubscription.plan) return 50; // Default free plan limit
    // Use advanced_search_limit from the plan
    return currentSubscription.plan.advanced_search_limit || 50;
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
    
    // For unauthenticated users, increment localStorage counter
    if (!isAuthenticated || !user?.id) {
      const currentGuestUsage = parseInt(localStorage.getItem('guest_identifications_used') || '0');
      localStorage.setItem('guest_identifications_used', (currentGuestUsage + 1).toString());
      return true;
    }
    
    if (!user?.id) return false;

    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Ensure profile exists first
      await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            identifications_used: 0,
            last_reset_date: now.toISOString(),
            monthly_identifications: 5
          },
          { 
            onConflict: 'id',
            ignoreDuplicates: true
          }
        );
      
      // Fetch current usage, extra_identifications, and last reset
      const { data: existing, error: fetchErr } = await supabase
        .from('profiles')
        .select('id, identifications_used, last_reset_date, extra_identifications')
        .eq('id', user.id)
        .single();

      if (fetchErr) {
        console.error('Error fetching profile for increment:', fetchErr);
        throw fetchErr;
      }

      const currentUsed = existing?.identifications_used ?? 0;
      const currentExtra = (existing as any)?.extra_identifications ?? 0;
      const lastReset = existing?.last_reset_date ? new Date(existing.last_reset_date) : null;

      let newUsed = currentUsed + 1;
      let newExtra = currentExtra;
      let payload: Partial<Tables<'profiles'>> & { id: string } = { id: user.id } as any;

      // Get monthly limit based on plan
      let monthlyLimit = 5; // Default free tier
      if (currentSubscription?.plan) {
        const plan = currentSubscription.plan;
        const planId = plan?.id || currentSubscription.plan_id || '';
        const planName = plan?.name || '';
        
        if (planId === 'special-plan') {
          monthlyLimit = -1; // Unlimited
        } else if (planId === 'free-plan') {
          monthlyLimit = 5; // Free plan: 5 identifications
        } else if (planId.toLowerCase().includes('lite') || planName.toLowerCase().includes('lite')) {
          monthlyLimit = 39; // Lite plan: 39 identifications  
        } else if (planId.toLowerCase().includes('pro') || planName.toLowerCase().includes('pro')) {
          monthlyLimit = 101; // Pro plan: 101 identifications
        } else {
          monthlyLimit = 5; // Default to free tier for safety
        }
      }

      // RECONCILIATION: Fix usage and bonus if they don't match
      if (monthlyLimit !== -1 && currentUsed > monthlyLimit) {
        const bonusAlreadyUsed = currentUsed - monthlyLimit;
        
        // If bonusAlreadyUsed > currentExtra, bonus was fully consumed, reset usage
        if (bonusAlreadyUsed > currentExtra) {
          console.log('🔧 RECONCILING: Bonus fully consumed, resetting to monthly limit:', {
            currentUsed,
            monthlyLimit,
            bonusAlreadyUsed,
            currentExtra,
            resetting: `${currentUsed} → ${monthlyLimit}`
          });
          
          // Reset usage to monthly limit and clear bonus
          await supabase
            .from('profiles')
            .update({ 
              identifications_used: monthlyLimit,
              extra_identifications: 0 
            })
            .eq('id', user.id);
          
          setProfileIdentificationsUsed(monthlyLimit);
          setExtraIdentifications(0);
          
          // Update local variables for the current increment
          newUsed = monthlyLimit + 1; // Will be the new usage after this identification
          newExtra = 0;
        } else if (bonusAlreadyUsed > 0 && currentExtra > 0) {
          // Partial bonus usage
          const bonusShouldRemain = currentExtra - bonusAlreadyUsed;
          
          if (bonusShouldRemain !== currentExtra && bonusShouldRemain >= 0) {
            console.log('🔧 RECONCILING partial bonus usage:', {
              currentUsed,
              monthlyLimit,
              bonusWas: currentExtra,
              bonusShouldBe: bonusShouldRemain
            });
            
            newExtra = bonusShouldRemain;
            await supabase
              .from('profiles')
              .update({ extra_identifications: newExtra })
              .eq('id', user.id);
            setExtraIdentifications(newExtra);
          }
        }
      }

      // If last_reset_date exists and is before current month, reset then increment
      if (lastReset && lastReset < monthStart) {
        console.log('📅 Monthly reset triggered - resetting usage count');
        newUsed = 1; // reset to 0 then add 1
        // Keep bonus identifications during monthly reset - they don't reset
        payload = { id: user.id, identifications_used: newUsed, last_reset_date: now.toISOString() } as any;
      } else if (!lastReset) {
        // If missing, initialize last_reset_date without affecting count logic
        payload = { id: user.id, identifications_used: newUsed, last_reset_date: now.toISOString() } as any;
      } else {
        // Normal usage increment
        // Check if we're at or beyond monthly limit
        if (monthlyLimit !== -1 && currentUsed >= monthlyLimit) {
          // At monthly limit - can only proceed if we have bonus
          if (currentExtra > 0) {
            // Using bonus identifications - decrease extra_identifications
            // Keep identifications_used AT monthlyLimit, don't increment it
            newUsed = monthlyLimit; // Stay at monthly limit (39 for Lite, 101 for Pro)
            newExtra = Math.max(0, currentExtra - 1);
            
            payload = { id: user.id, identifications_used: newUsed, extra_identifications: newExtra } as any;
            console.log('🎁 Using bonus identification:', { 
              monthlyLimit,
              identifications_used: newUsed, // Stays at monthly limit
              bonusUsed: currentExtra - newExtra, 
              bonusRemaining: newExtra 
            });
          } else {
            // No bonus available - cannot proceed, keep at monthly limit
            newUsed = monthlyLimit;
            newExtra = 0;
            payload = { id: user.id, identifications_used: newUsed, extra_identifications: newExtra } as any;
            console.log('⚠️ At limit with no bonus - cannot increment:', { monthlyLimit, newUsed });
          }
        } else {
          // Normal usage within monthly limit - increment identifications_used normally
          payload = { id: user.id, identifications_used: newUsed } as any;
          console.log('📊 Normal usage within limit:', { monthlyLimit, newUsed, bonusAvailable: currentExtra });
        }
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;

      console.log('✅ Usage incremented:', { newUsed, newExtra, monthlyLimit });
      setProfileIdentificationsUsed(newUsed);
      setExtraIdentifications(newExtra);
      
      // Always update usage stats, even for free tier users without subscription
      if (currentSubscription) {
        await calculateUsageStats(currentSubscription, true);
      } else {
        // For free tier users without subscription, manually update usage stats
        setUsageStats({
          identificationsUsed: newUsed,
          identificationsRemaining: Math.max(5 - newUsed, 0),
          databaseSearchesUsed: 0,
          databaseSearchesRemaining: 10,
          monthlyLimit: 5,
          planName: 'Free'
        });
        console.log('✅ Free tier usage stats updated:', { used: newUsed, remaining: Math.max(5 - newUsed, 0) });
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
      } catch (error) {
        console.error('Error during subscription initialization:', error);
        // Ensure we have default free tier stats even if initialization fails
        setUsageStats({
          identificationsUsed: profileIdentificationsUsed || 0,
          identificationsRemaining: Math.max(5 - (profileIdentificationsUsed || 0), 0),
          databaseSearchesUsed: 0,
          databaseSearchesRemaining: 10,
          monthlyLimit: 5,
          planName: 'Free'
        });
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Refresh usage when page becomes visible (fixes cross-device sync)
  useEffect(() => {
    if (!user?.id) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Page visible - refreshing usage data');
        await fetchProfileUsage();
        if (currentSubscription) {
          await calculateUsageStats(currentSubscription, true);
        } else {
          // For free tier users, fetch fresh usage and manually update stats
          try {
            const { data } = await supabase
              .from('profiles')
              .select('identifications_used')
              .eq('id', user.id)
              .single();
            const used = data?.identifications_used ?? 0;
            setUsageStats({
              identificationsUsed: used,
              identificationsRemaining: Math.max(5 - used, 0),
              databaseSearchesUsed: 0,
              databaseSearchesRemaining: 10,
              monthlyLimit: 5,
              planName: 'Free'
            });
          } catch (err) {
            console.error('Error fetching usage on visibility change:', err);
          }
        }
      }
    };

    const handleFocus = async () => {
      console.log('🔄 Window focused - refreshing usage data');
      await fetchProfileUsage();
      if (currentSubscription) {
        await calculateUsageStats(currentSubscription, true);
      } else {
        // For free tier users, fetch fresh usage and manually update stats
        try {
          const { data } = await supabase
            .from('profiles')
            .select('identifications_used')
            .eq('id', user.id)
            .single();
          const used = data?.identifications_used ?? 0;
          setUsageStats({
            identificationsUsed: used,
            identificationsRemaining: Math.max(5 - used, 0),
            databaseSearchesUsed: 0,
            databaseSearchesRemaining: 10,
            monthlyLimit: 5,
            planName: 'Free'
          });
        } catch (err) {
          console.error('Error fetching usage on focus:', err);
        }
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
            } else {
              // For free tier users without subscription, manually update usage stats
              setUsageStats({
                identificationsUsed: newUsed,
                identificationsRemaining: Math.max(5 - newUsed, 0),
                databaseSearchesUsed: 0,
                databaseSearchesRemaining: 10,
                monthlyLimit: 5,
                planName: 'Free'
              });
              console.log('✅ Realtime: Free tier usage stats updated:', { used: newUsed, remaining: Math.max(5 - newUsed, 0) });
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


