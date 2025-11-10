import { supabase } from '@/integrations/supabase/client';

/**
 * Track a search usage for the current user
 * This increments the search count in the search_usage_tracking table
 */
export const trackSearchUsage = async (userId: string): Promise<boolean> => {
  try {
    // First, try to get existing record
    const { data: existing, error: fetchError } = await supabase
      .from('search_usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching search usage:', fetchError);
      return false;
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (existing) {
      // Check if we need to reset for new month
      const lastReset = new Date(existing.last_reset_date);
      const resetMonth = lastReset.getMonth();
      const resetYear = lastReset.getFullYear();

      let newSearchCount = (existing.searches_used as number) || 0;
      let resetDate = existing.last_reset_date;

      // Reset if it's a new month
      if (currentMonth !== resetMonth || currentYear !== resetYear) {
        newSearchCount = 1;
        resetDate = now.toISOString();
      } else {
        newSearchCount += 1;
      }

      // Update existing record
      const { error: updateError } = await supabase
        .from('search_usage_tracking')
        .update({
          searches_used: newSearchCount,
          last_reset_date: resetDate,
          updated_at: now.toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating search usage:', updateError);
        return false;
      }

      console.log(`Search usage tracked: ${newSearchCount} searches used`);
      return true;
    } else {
      // Create new record
      const { error: insertError } = await supabase
        .from('search_usage_tracking')
        .insert({
          user_id: userId,
          searches_used: 1,
          searches_limit: 50, // Default free plan limit
          last_reset_date: now.toISOString()
        });

      if (insertError) {
        console.error('Error creating search usage record:', insertError);
        return false;
      }

      console.log('Search usage tracking initialized for user');
      return true;
    }
  } catch (error) {
    console.error('Error in trackSearchUsage:', error);
    return false;
  }
};

/**
 * Get current search usage for a user
 */
export const getSearchUsage = async (userId: string): Promise<{ used: number; limit: number } | null> => {
  try {
    // Get user's plan to determine limit
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Determine search limit based on plan
    let limit = 50; // Default free plan
    if (subscription?.plan) {
      const planName = subscription.plan.name;
      if (planName === 'Lite') {
        limit = 249;
      } else if (planName === 'Pro') {
        limit = 500;
      }
    }

    // Get usage
    const { data: usage, error } = await supabase
      .from('search_usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching search usage:', error);
      return null;
    }

    if (!usage) {
      return { used: 0, limit };
    }

    // Check if we need to reset for new month
    const lastReset = new Date(usage.last_reset_date as string);
    const currentMonth = new Date().getMonth();
    const resetMonth = lastReset.getMonth();

    if (currentMonth !== resetMonth) {
      return { used: 0, limit };
    }

    return {
      used: (usage.searches_used as number) || 0,
      limit
    };
  } catch (error) {
    console.error('Error in getSearchUsage:', error);
    return null;
  }
};

/**
 * Check if user has reached their search limit
 */
export const hasReachedSearchLimit = async (userId: string): Promise<boolean> => {
  const usage = await getSearchUsage(userId);
  if (!usage) return false;
  return usage.used >= usage.limit;
};
