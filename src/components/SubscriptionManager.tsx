import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Calendar, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  CreditCard,
  Settings,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import PaymentButton from './PaymentButton';
import { Tables } from '@/types/database.types';
import { useSubscription } from '@/hooks/useSubscription';
import CongratulationsMessage from '@/components/CongratulationsMessage';
import { SubscriptionService } from '@/services/subscriptionService';

type UserProfile = Tables<"profiles">;
type SubscriptionPlan = Tables<"subscription_plans">;
// Add local type for current subscription with joined plan
type UserSubscription = Tables<"user_subscriptions"> & { plan?: SubscriptionPlan };

const SubscriptionManager: React.FC = () => {
  const { user } = useAuthStatus();
  // Wire unified subscription usage state and current plan
  const { usageStats, loading: subLoading, currentSubscription: unifiedSubscription } = useSubscription();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  // Track current subscription from user_subscriptions table
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [congratulationsPlan, setCongratulationsPlan] = useState<string>('');
  const [congratulationsCycle, setCongratulationsCycle] = useState<string>('monthly');
  const [congratulationsFeatures, setCongratulationsFeatures] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserData();
      
      // Subscribe to subscription updates
      const subscriptionService = SubscriptionService.getInstance();
      const unsubscribe = subscriptionService.onSubscriptionUpdate((subscription) => {
        if (subscription && subscription.status === 'active') {
          setCurrentSubscription(subscription);
          // Show congratulations message for new subscriptions
          const planName = subscription.plan?.name || 'Premium Plan';
          const planId = subscription.plan_id || '';
          const isWeekly = planId.includes('weekly') || subscription.plan?.billing_period === 'weekly';
          const cycle = isWeekly ? 'weekly' : (subscription.plan?.billing_period || 'monthly');
          
          let features: string[] = [];
          if (isWeekly) {
            features = [
              '21 AI identifications per week',
              '500+ medicines database',
              'Priority support',
              'No ads',
              'History feature'
            ];
          } else if (cycle === 'yearly') {
            features = [
              '1200 AI identifications per year',
              '1000+ medicines database',
              'Advanced search & filters',
              'Layman explanations',
              'History feature',
              'Unlimited database searches'
            ];
          } else {
            features = [
              '100 AI identifications per month',
              '1000+ medicines database',
              'Advanced search & filters',
              'Layman explanations',
              'History feature',
              'Unlimited database searches'
            ];
          }
          
          setCongratulationsPlan(planName);
          setCongratulationsCycle(cycle);
          setCongratulationsFeatures(features);
          setShowCongratulations(true);
          
          // Refetch user data to ensure UI is fully updated
          setTimeout(() => {
            fetchUserData();
          }, 1000);
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [user]);

  // Sync local state with unified subscription from hook for accuracy across app
  useEffect(() => {
    if (unifiedSubscription) {
      setCurrentSubscription(unifiedSubscription);
    }
  }, [unifiedSubscription]);

  const fetchUserData = async () => {
    setIsLoading(true);
    if (!user) {
      console.log('User not available, skipping fetchUserData.');
      setIsLoading(false);
      return;
    }
    console.log('Fetching user data for userId:', user.id);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && (profileError as any).code !== 'PGRST116') {
        throw profileError;
      }

      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*');

      if (plansError) {
        throw plansError;
      }

      // Fetch current active subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select(`*, plan:subscription_plans(*)`)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subscriptionError && (subscriptionError as any).code !== 'PGRST116') {
        throw subscriptionError;
      }

      // Note: Usage stats are automatically managed by the useSubscription hook
      // No need to fetch separately - the hook handles realtime updates
      console.log('Subscription data loaded:', subscriptionData?.plan_id);

      setProfile(profileData);
      setPlans((plansData || []) as SubscriptionPlan[]);
      setCurrentSubscription((subscriptionData || null) as UserSubscription | null);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || !profile) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase.functions.invoke('subscription-manager', {
        body: {
          action: 'cancel',
          user_id: user.id
        }
      });

      if (error) {
        throw error;
      }

      toast.success('Subscription cancelled successfully');
      await fetchUserData();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setIsUpdating(false);
    }
  };

  const getSubscriptionStatus = () => {
    if (!currentSubscription) {
      return { status: 'free', daysLeft: 0 };
    }

    // Check if it's a free plan
    if (currentSubscription.plan_id === 'free-plan') {
      return { status: 'free', daysLeft: 0 };
    }

    // Check if subscription is already marked as expired
    if (currentSubscription.status === 'expired') {
      return { status: 'expired', daysLeft: 0 };
    }
    
    if (currentSubscription.status === 'active' && currentSubscription.ends_at) {
      const now = new Date();
      const endsAt = new Date(currentSubscription.ends_at);
      const daysLeft = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Check if expired (end date has passed)
      if (daysLeft <= 0) {
        return { status: 'expired', daysLeft: 0 };
      }
      
      // Check if expiring soon (less than 7 days)
      if (daysLeft <= 7) {
        return { status: 'expiring', daysLeft };
      }
      
      return { status: 'active', daysLeft };
    }
    
    return { status: 'free', daysLeft: 0 };
  };

  const getUsagePercentage = () => {
    // Use unified usage stats from useSubscription with guards
    if (!usageStats) return 0;
    if (usageStats.monthlyLimit === -1) return 0;
    const used = usageStats.identificationsUsed || 0;
    const limit = usageStats.monthlyLimit || 1;
    return Math.min((used / limit) * 100, 100);
  };

  const formatPlanName = (planId: string) => {
    return planId
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCurrentPlan = () => {
    if (currentSubscription?.plan) return currentSubscription.plan;
    const planId = currentSubscription?.plan_id;
    return plans.find(plan => plan.id === planId);
  };

  // Helper function to check if user is Special Access based on email
  const isSpecialAccessAccount = () => {
    const specialAccessEmails = ['imgamer.ms@gmail.com'];
    return user?.email && specialAccessEmails.includes(user.email.toLowerCase());
  };

  const getStatusBadge = (status: string) => {
    // Check if this is a Special Access account by email or plan name
    const isSpecialAccess = isSpecialAccessAccount() || currentPlan?.name === 'Special Access';
    
    switch (status) {
      case 'active':
        return isSpecialAccess 
          ? <Badge className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 dark:text-yellow-900 border border-yellow-300 text-xs sm:text-sm font-semibold">Special Access</Badge>
          : <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs sm:text-sm">Active</Badge>;
      case 'expiring':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 text-xs sm:text-sm">Expiring Soon</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="text-xs sm:text-sm">Expired</Badge>;
      case 'free':
        return isSpecialAccess 
          ? <Badge className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 dark:text-yellow-900 border border-yellow-300 text-xs sm:text-sm font-semibold">Special Access</Badge>
          : <Badge variant="outline" className="text-xs sm:text-sm">Free Plan</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs sm:text-sm">Unknown</Badge>;
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please log in to manage your subscription.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading subscription data...</p>
        </CardContent>
      </Card>
    );
  }

  const subscriptionStatus = getSubscriptionStatus();
  const usagePercentage = getUsagePercentage();
  const currentPlan = getCurrentPlan();

  return (
    <>
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-bold">Subscription Management</h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Manage your subscription and view usage</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUserData}
          disabled={isLoading}
          className="shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          )}
          <span className="text-xs sm:text-sm">Refresh</span>
        </Button>
      </div>

      {/* Current Subscription Status */}
      <Card className={isSpecialAccessAccount() ? 'border-2 border-yellow-300 dark:border-yellow-600 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20' : ''}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className={`text-base sm:text-lg font-semibold ${isSpecialAccessAccount() ? 'text-yellow-700 dark:text-yellow-400' : ''}`}>
                {isSpecialAccessAccount() ? 'Special Access' : (currentPlan ? currentPlan.name : 'Free Plan')}
              </h3>
              <p className={`text-xs sm:text-sm ${isSpecialAccessAccount() ? 'text-yellow-600 dark:text-yellow-300' : 'text-gray-600 dark:text-gray-400'}`}>
                {isSpecialAccessAccount()
                  ? 'Premium unlimited access - No expiration'
                  : subscriptionStatus.status === 'active'
                  ? 'Active subscription'
                  : subscriptionStatus.status === 'expired'
                  ? 'Subscription expired - moved to free plan'
                  : subscriptionStatus.status === 'expiring'
                  ? `Expiring in ${subscriptionStatus.daysLeft} days`
                  : 'Free plan - no expiration'
                }
              </p>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              {getStatusBadge(subscriptionStatus.status)}
              {subscriptionStatus.status === 'active' && subscriptionStatus.daysLeft > 0 && !isSpecialAccessAccount() && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {subscriptionStatus.daysLeft} days left
                </p>
              )}
            </div>
          </div>

          {/* Usage Progress */}
          <div className="space-y-2">
            {subLoading ? (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> Loading usage...
              </div>
            ) : (
              <>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className={isSpecialAccessAccount() ? 'font-medium' : ''}>Monthly Identifications Used</span>
                  <span className={`font-semibold ${isSpecialAccessAccount() ? 'text-yellow-700 dark:text-yellow-400' : ''}`}>
                    {usageStats.identificationsUsed} / {usageStats.monthlyLimit === -1 ? '∞' : usageStats.monthlyLimit}
                  </span>
                </div>
                {usageStats.monthlyLimit !== -1 && (
                  <Progress value={usagePercentage} className={`h-2 ${isSpecialAccessAccount() ? '[&>div]:bg-gradient-to-r [&>div]:from-yellow-400 [&>div]:to-amber-500' : ''}`} />
                )}
                {usageStats.monthlyLimit !== -1 && usagePercentage >= 80 && !isSpecialAccessAccount() && (
                  <p className="text-xs sm:text-sm text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                    You're approaching your monthly limit
                  </p>
                )}
                {isSpecialAccessAccount() && (
                  <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 italic">
                    Unlimited AI identifications included with Special Access
                  </p>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Available Plans</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Choose a plan that fits your needs
          </CardDescription>
          <div className="flex items-center gap-2 sm:gap-4 pt-2">
            <Button
              variant={billingCycle === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBillingCycle('monthly')}
              className="text-xs sm:text-sm"
            >
              Monthly
            </Button>
            <Button
              variant={billingCycle === 'yearly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBillingCycle('yearly')}
              className="text-xs sm:text-sm"
            >
              Yearly (Save 20%)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => {
              // Default to free-plan if no subscription exists
              const userPlanId = currentSubscription?.plan?.id || currentSubscription?.plan_id || 'free-plan';
              const isCurrentPlan = plan.id === userPlanId;
              const isUpgrade = currentPlan && plan.price > currentPlan.price;
              const isDowngrade = currentPlan && plan.price < currentPlan.price;

              // Determine which billing cycle to display/apply to button
              const isWeeklyPlan = (plan.billing_period === 'weekly') || plan.id.includes('weekly');
              const effectiveBillingCycle: 'monthly' | 'yearly' | 'weekly' = isWeeklyPlan ? 'weekly' : billingCycle;

              // Compute displayed price based on selected cycle (20% off yearly)
              let displayPrice = plan.price;
              if (!isWeeklyPlan && billingCycle === 'yearly') {
                displayPrice = Math.round((plan.price || 0) * 12 * 0.8);
              }
              const periodSuffix = isWeeklyPlan ? 'week' : (billingCycle === 'yearly' ? 'year' : 'month');

              // Build display features per plan to avoid leaking monthly features into weekly
              const displayFeatures: string[] = (() => {
                if (plan.id === 'free-plan') {
                  return [
                    '100 drugs database search',
                    '5 AI identifications per month',
                    'Basic drug information',
                    'Mobile web app access'
                  ];
                }
                if (isWeeklyPlan) {
                  return [
                    'All Free Plan features',
                    '21 AI identifications per week',
                    '500+ medicines database',
                    'Priority support',
                    'No ads'
                  ];
                }
                // Monthly/Yearly premium
                return [
                  'All Weekly Plan features',
                  'Unlimited AI identifications',
                  '1000+ database drugs',
                  'Layman explanations',
                  'History feature',
                  'Advanced search filters'
                ];
              })();

              return (
                <Card 
                  key={plan.id} 
                  className={`relative transition-all duration-500 ${
                    isCurrentPlan 
                      ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg shadow-blue-500/20 animate-pulse-border' 
                      : 'hover:shadow-md'
                  }`}
                >
                  {isCurrentPlan && (
                    <Badge className="absolute -top-2 right-4 bg-blue-500 animate-fade-in">
                      Active Plan
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold">
                      ₹{displayPrice}
                      <span className="text-sm font-normal text-gray-600">
                        /{periodSuffix}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <p className="text-lg font-semibold">
                        {isWeeklyPlan
                          ? '21 identifications/week'
                          : (plan.id === 'free-plan' 
                              ? '5 identifications/month'
                              : (billingCycle === 'yearly' ? '1200 identifications/year' : '100 identifications/month'))}
                      </p>
                    </div>
                    
                    <ul className="space-y-2 text-sm">
                      {displayFeatures.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <div className="pt-4">
                      {isCurrentPlan ? (
                        <Button disabled className="w-full">
                          Current Plan
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <PaymentButton
                            plan={plan}
                            planId={plan.id}
                            billingCycle={billingCycle}
                            className="w-full"
                          >
                            {isUpgrade && <TrendingUp className="w-4 h-4 mr-2" />}
                            {isDowngrade && <TrendingDown className="w-4 h-4 mr-2" />}
                            {!currentPlan && <CreditCard className="w-4 h-4 mr-2" />}
                            {isUpgrade ? 'Upgrade' : isDowngrade ? 'Downgrade' : 'Subscribe'}
                          </PaymentButton>
                          {isUpgrade && (
                            <p className="text-xs text-green-600 text-center">
                              Upgrade for more features
                            </p>
                          )}
                          {isDowngrade && (
                            <p className="text-xs text-amber-600 text-center">
                              Downgrade to save money
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Alerts */}
      {subscriptionStatus.status === 'expiring' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-800">
                  Your subscription expires in {subscriptionStatus.daysLeft} days
                </p>
                <p className="text-sm text-yellow-700">
                  Renew now to continue enjoying premium features
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {subscriptionStatus.status === 'expired' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">
                  Your subscription has expired
                </p>
                <p className="text-sm text-red-700">
                  Subscribe to a plan to continue using premium features
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    
    {/* Congratulations Message */}
    <CongratulationsMessage
      isVisible={showCongratulations}
      planName={congratulationsPlan}
      billingCycle={congratulationsCycle}
      planFeatures={congratulationsFeatures}
      onDismiss={() => setShowCongratulations(false)}
    />
    </>
  );
};

export default SubscriptionManager;