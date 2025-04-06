
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Plan {
  id: string;
  name: string;
  description: string;
  price_inr: number;
  monthly_identifications: number;
  features: string[];
}

interface SubscriptionData {
  id: string;
  status: string;
  subscription_start: string;
  subscription_end: string;
  subscription_plans: Plan;
}

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

interface CurrentSubscriptionProps {
  subscription: SubscriptionData;
  usage: UsageData | null;
}

const CurrentSubscription = ({ subscription, usage }: CurrentSubscriptionProps) => {
  const [claimingDailyBonus, setClaimingDailyBonus] = React.useState(false);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const handleClaimDailyBonus = async () => {
    try {
      setClaimingDailyBonus(true);
      const { data, error } = await supabase.functions.invoke('subscription-management/daily-free-identifications');
      
      if (error) throw new Error(error.message);
      
      if (data && data.success) {
        toast.success(data.message);
        // Force reload the page to update usage data
        window.location.reload();
      } else {
        toast.info(data.message);
      }
    } catch (err: any) {
      console.error('Error claiming daily bonus:', err);
      toast.error(`Failed to claim daily bonus: ${err.message}`);
    } finally {
      setClaimingDailyBonus(false);
    }
  };
  
  // Check if user has already claimed today's bonus
  const hasClaimedToday = React.useMemo(() => {
    if (!usage?.last_claimed) return false;
    
    const lastClaimedDate = new Date(usage.last_claimed).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    return lastClaimedDate === today;
  }, [usage?.last_claimed]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 mb-8 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center mb-2">
            <span className="text-lg font-medium">{subscription.subscription_plans.name} Plan</span>
            <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
              Active
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {subscription.subscription_plans.description}
          </p>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Started:</span> {formatDate(subscription.subscription_start)}</p>
            <p><span className="font-medium">Expires:</span> {formatDate(subscription.subscription_end)}</p>
            
            <div className="flex items-center">
              <span className="font-medium mr-1">Monthly identifications:</span> 
              {subscription.subscription_plans.monthly_identifications}
              
              {usage?.bonus_from_coupons ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full dark:bg-blue-900/30 dark:text-blue-300 flex items-center">
                        +{usage.bonus_from_coupons} bonus
                        <InfoIcon className="h-3 w-3 ml-1" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Bonus identifications from redeemed coupons</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
              
              {usage?.daily_free ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-300 flex items-center">
                        +{usage.daily_free} daily
                        <Gift className="h-3 w-3 ml-1" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Daily free identifications</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
            </div>
            
            {/* Daily Bonus Section */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="font-medium flex items-center">
                  <Gift className="h-4 w-4 mr-1 text-green-600" /> 
                  Daily Free Identifications
                </span>
                
                <Button
                  size="sm"
                  variant={hasClaimedToday ? "outline" : "default"}
                  disabled={hasClaimedToday || claimingDailyBonus}
                  onClick={handleClaimDailyBonus}
                  className="text-xs"
                >
                  {claimingDailyBonus ? "Claiming..." : 
                   hasClaimedToday ? "Already claimed" : "Claim 2 free"}
                </Button>
              </div>
              {usage?.daily_free !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                  {usage.daily_free} remaining today
                </p>
              )}
            </div>
          </div>
        </div>

        {usage && (
          <div className="flex flex-col justify-center">
            <p className="text-sm font-medium mb-1">Usage this month</p>
            <div className="flex justify-between text-sm mb-1">
              <span>{usage.used} used</span>
              <span>{usage.remaining} remaining</span>
            </div>
            <Progress value={usage.percentage} className="h-2 mb-4" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {usage.percentage}% of your monthly limit
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-500">
              <div className="p-2 bg-gray-50 dark:bg-gray-700/30 rounded flex items-center justify-between">
                <span>Base plan:</span>
                <span className="font-medium">{usage.base_monthly}</span>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded flex items-center justify-between">
                <span>Coupons:</span>
                <span className="font-medium">{usage.bonus_from_coupons || 0}</span>
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded flex items-center justify-between">
                <span>Daily:</span>
                <span className="font-medium">{usage.daily_free || 0}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentSubscription;
