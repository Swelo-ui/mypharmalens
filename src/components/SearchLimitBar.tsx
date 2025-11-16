import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Search, Lock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { Link } from 'react-router-dom';

interface SearchLimitBarProps {
  onLimitReached?: () => void;
}

const SearchLimitBar: React.FC<SearchLimitBarProps> = ({ onLimitReached }) => {
  const { user } = useAuthStatus();
  const [searchesUsed, setSearchesUsed] = useState(0);
  const [searchesLimit, setSearchesLimit] = useState(100);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSearchUsage();
      
      // Set up real-time subscription for search usage updates
      const channel = supabase
        .channel('search_usage_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'search_usage_tracking',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Search usage updated:', payload);
            fetchSearchUsage(); // Refresh when usage changes
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchSearchUsage = async () => {
    if (!user) return;

    try {
      // Try to fetch real usage, fallback to plan-based limits
      let currentUsed = 0;
      let currentLimit = 100; // Default free plan limit
      
      // First, get user's current plan to determine search limit
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Use advanced_search_limit from subscription plan
      if (subscription?.plan) {
        currentLimit = subscription.plan.advanced_search_limit || 100;
      } else {
        currentLimit = 100; // No active subscription = free plan
      }

      // Try to get actual usage from search_usage_tracking table
      try {
        const { data: usage, error: usageError } = await supabase
          .from('search_usage_tracking')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!usageError && usage) {
          // Check if we need to reset (monthly)
          const lastReset = new Date(usage.last_reset_date as string);
          const currentMonth = new Date().getMonth();
          const resetMonth = lastReset.getMonth();
          
          if (currentMonth !== resetMonth) {
            // Reset usage for new month
            currentUsed = 0;
          } else {
            currentUsed = (usage.searches_used as number) || 0;
          }
        }
      } catch (usageError) {
        console.log('Search usage table not ready, using plan limits only');
        currentUsed = 0;
      }

      setSearchesUsed(currentUsed);
      setSearchesLimit(currentLimit);
      setIsLocked(currentUsed >= currentLimit);
      
      if (currentUsed >= currentLimit && onLimitReached) {
        onLimitReached();
      }
    } catch (error) {
      console.error('Error checking search limit:', error);
      // Fallback to free plan limits
      setSearchesUsed(0);
      setSearchesLimit(100);
      setIsLocked(false);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = () => {
    return (searchesUsed / searchesLimit) * 100;
  };

  const getRemainingSearches = () => {
    return Math.max(0, searchesLimit - searchesUsed);
  };

  const getWarningColor = () => {
    const percentage = getPercentage();
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-amber-600';
    return 'text-green-600';
  };

  if (!user || loading) {
    return null;
  }

  if (isLocked) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-800 dark:text-red-200">Search Limit Reached</p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  You've used all {searchesLimit} searches for this month
                </p>
              </div>
            </div>
            <Link to="/subscription-manager">
              <Button size="sm" className="bg-red-600 hover:bg-red-700">
                <TrendingUp className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const percentage = getPercentage();
  const remaining = getRemainingSearches();

  return (
    <Card className="border bg-card">
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium truncate">
                Search Limit
              </span>
            </div>
            <span className={`text-xs sm:text-sm font-semibold ${getWarningColor()} whitespace-nowrap`}>
              {remaining} / {searchesLimit}
            </span>
          </div>

          <Progress 
            value={percentage} 
            className="h-1.5 sm:h-2" 
          />

          {percentage >= 80 && percentage < 100 && (
            <div className="flex items-center justify-between text-xs gap-2">
              <p className="text-amber-700 dark:text-amber-300 truncate">
                Approaching limit
              </p>
              <Link to="/subscription-manager">
                <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary">
                  Upgrade
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchLimitBar;
