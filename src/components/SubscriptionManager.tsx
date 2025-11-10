import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  CreditCard,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import PaymentButton from './PaymentButton';
import { Tables } from '@/types/database.types';
import { useSubscription } from '@/hooks/useSubscription';
import CongratulationsMessage from '@/components/CongratulationsMessage';
import { SubscriptionService } from '@/services/subscriptionService';
import IdentificationPacks from './IdentificationPacks';

type UserProfile = Tables<"profiles">;
type SubscriptionPlan = Tables<"subscription_plans">;
type UserSubscription = Tables<"user_subscriptions"> & { plan?: SubscriptionPlan };

// Extended type for plans with new fields
interface ExtendedPlan extends SubscriptionPlan {
  original_price: number;
  discounted_price: number;
  advanced_search_limit: number;
  identifications_limit: number;
  monthly_identifications?: number;
}

const SubscriptionManager: React.FC = () => {
  const { user } = useAuthStatus();
  const { usageStats, loading: subLoading, currentSubscription: unifiedSubscription } = useSubscription();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<ExtendedPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [congratulationsPlan, setCongratulationsPlan] = useState<string>('');
  const [congratulationsFeatures, setCongratulationsFeatures] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserData();
      
      const subscriptionService = SubscriptionService.getInstance();
      const unsubscribe = subscriptionService.onSubscriptionUpdate((subscription) => {
        if (subscription && subscription.status === 'active') {
          setCurrentSubscription(subscription);
          const planName = subscription.plan?.name || 'Premium Plan';
          
          let features: string[] = [];
          if (planName === 'Lite') {
            features = [
              '39 AI identifications/month',
              'Advanced search (249 results)',
              'Priority support',
              '1200+ medicines database',
              'Layman explanations'
            ];
          } else if (planName === 'Pro') {
            features = [
              '101 AI identifications/month',
              'Advanced search (500 results)',
              'Priority support',
              '1200+ medicines database',
              'PWA offline access'
            ];
          }
          
          setCongratulationsPlan(planName);
          setCongratulationsFeatures(features);
          setShowCongratulations(true);
          
          setTimeout(() => fetchUserData(), 1000);
        }
      });

      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (unifiedSubscription) {
      setCurrentSubscription(unifiedSubscription);
    }
  }, [unifiedSubscription]);

  const fetchUserData = async () => {
    setIsLoading(true);
    if (!user) {
      setIsLoading(false);
      return;
    }

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

      setProfile(profileData);
      setPlans((plansData || []) as ExtendedPlan[]);
      setCurrentSubscription((subscriptionData || null) as UserSubscription | null);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const getSubscriptionStatus = () => {
    if (!currentSubscription) {
      return { status: 'free', daysLeft: 0 };
    }

    if (currentSubscription.plan_id === 'free-plan') {
      return { status: 'free', daysLeft: 0 };
    }

    if (currentSubscription.status === 'expired') {
      return { status: 'expired', daysLeft: 0 };
    }
    
    if (currentSubscription.status === 'active' && currentSubscription.ends_at) {
      const now = new Date();
      const endsAt = new Date(currentSubscription.ends_at);
      const daysLeft = Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft <= 0) {
        return { status: 'expired', daysLeft: 0 };
      }
      
      if (daysLeft <= 7) {
        return { status: 'expiring', daysLeft };
      }
      
      return { status: 'active', daysLeft };
    }
    
    return { status: 'free', daysLeft: 0 };
  };

  const getUsagePercentage = () => {
    if (!usageStats) return 0;
    if (usageStats.monthlyLimit === -1) return 0;
    const used = usageStats.identificationsUsed || 0;
    
    // Calculate correct monthly limit based on plan name
    const planName = usageStats.planName || 'Free';
    let monthlyLimit = 5;
    if (planName === 'Free' || planName.toLowerCase().includes('free')) {
      monthlyLimit = 5;
    } else if (planName === 'Lite' || planName.toLowerCase().includes('lite')) {
      monthlyLimit = 39;
    } else if (planName === 'Pro' || planName.toLowerCase().includes('pro')) {
      monthlyLimit = 101;
    }
    
    // Include bonus identifications in the total limit
    const totalLimit = monthlyLimit + (profile?.extra_identifications || 0);
    return Math.min((used / totalLimit) * 100, 100);
  };

  const getCurrentPlan = () => {
    if (currentSubscription?.plan) return currentSubscription.plan;
    const planId = currentSubscription?.plan_id;
    return plans.find(plan => plan.id === planId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 text-xs sm:text-sm">Active</Badge>;
      case 'expiring':
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs sm:text-sm">Expiring Soon</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="text-xs sm:text-sm">Expired</Badge>;
      case 'free':
        return <Badge variant="outline" className="text-xs sm:text-sm">Free Plan</Badge>;
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold">
                {currentPlan ? currentPlan.name : 'Free Plan'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {subscriptionStatus.status === 'active'
                  ? 'Active subscription'
                  : subscriptionStatus.status === 'expired'
                  ? 'Subscription expired'
                  : subscriptionStatus.status === 'expiring'
                  ? `Expiring in ${subscriptionStatus.daysLeft} days`
                  : 'Free plan - no expiration'
                }
              </p>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              {getStatusBadge(subscriptionStatus.status)}
              {subscriptionStatus.status === 'active' && subscriptionStatus.daysLeft > 0 && (
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
                  <span>Total Used</span>
                  <span className="font-semibold">
                    {usageStats.identificationsUsed} / {usageStats.monthlyLimit === -1 ? '∞' : (() => {
                      const planName = usageStats.planName || 'Free';
                      let monthlyLimit = 5;
                      if (planName === 'Free' || planName.toLowerCase().includes('free')) {
                        monthlyLimit = 5;
                      } else if (planName === 'Lite' || planName.toLowerCase().includes('lite')) {
                        monthlyLimit = 39;
                      } else if (planName === 'Pro' || planName.toLowerCase().includes('pro')) {
                        monthlyLimit = 101;
                      }
                      return monthlyLimit + (profile?.extra_identifications || 0);
                    })()}
                  </span>
                </div>
                {profile && profile.extra_identifications > 0 && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    profile.extra_identifications >= 50 
                      ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800' 
                      : profile.extra_identifications >= 30 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : profile.extra_identifications >= 10 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : profile.extra_identifications >= 5
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}>
                    <Zap className={`w-4 h-4 flex-shrink-0 ${
                      profile.extra_identifications >= 50 ? 'text-violet-600' :
                      profile.extra_identifications >= 30 ? 'text-green-600' :
                      profile.extra_identifications >= 10 ? 'text-blue-600' :
                      profile.extra_identifications >= 5 ? 'text-amber-600' :
                      'text-red-600'
                    }`} />
                    <p className={`text-xs font-medium ${
                      profile.extra_identifications >= 50 ? 'text-violet-700 dark:text-violet-300' :
                      profile.extra_identifications >= 30 ? 'text-green-700 dark:text-green-300' :
                      profile.extra_identifications >= 10 ? 'text-blue-700 dark:text-blue-300' :
                      profile.extra_identifications >= 5 ? 'text-amber-700 dark:text-amber-300' :
                      'text-red-700 dark:text-red-300'
                    }`}>
                      {profile.extra_identifications} bonus remaining
                    </p>
                  </div>
                )}
                {usageStats.monthlyLimit !== -1 && (
                  <Progress value={usagePercentage} className="h-2" />
                )}
                {usageStats.monthlyLimit !== -1 && usagePercentage >= 80 && (
                  <p className="text-xs sm:text-sm text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                    {usagePercentage >= 95 ? 'Almost out of identifications!' : 'You\'re approaching your identification limit'}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Comprehensive Usage Warnings & Info */}
          <div className="space-y-2 mt-4">
            {/* Critical: Out of identifications */}
            {usageStats.identificationsUsed >= (usageStats.monthlyLimit + (profile?.extra_identifications || 0)) && usageStats.monthlyLimit !== -1 && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-red-700 dark:text-red-200">
                  <p className="font-semibold">Identification Limit Reached</p>
                  <p className="mt-1">You've used all {usageStats.monthlyLimit + (profile?.extra_identifications || 0)} identifications this month. Upgrade your plan or purchase a top-up pack to continue.</p>
                </div>
              </div>
            )}

            {/* Warning: Approaching limit (80-94%) */}
            {usagePercentage >= 80 && usagePercentage < 95 && usageStats.monthlyLimit !== -1 && usageStats.identificationsUsed < (usageStats.monthlyLimit + (profile?.extra_identifications || 0)) && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-700 dark:text-amber-200">
                  <p className="font-semibold">You're Approaching Your Identification Limit</p>
                  <p className="mt-1">{(usageStats.monthlyLimit + (profile?.extra_identifications || 0)) - usageStats.identificationsUsed} identifications remaining. Consider upgrading to avoid interruptions.</p>
                </div>
              </div>
            )}

            {/* Warning: Critical limit (95-99%) */}
            {usagePercentage >= 95 && usageStats.monthlyLimit !== -1 && usageStats.identificationsUsed < (usageStats.monthlyLimit + (profile?.extra_identifications || 0)) && (
              <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-orange-700 dark:text-orange-200">
                  <p className="font-semibold">Critical: Almost Out of Identifications!</p>
                  <p className="mt-1">Only {(usageStats.monthlyLimit + (profile?.extra_identifications || 0)) - usageStats.identificationsUsed} identifications left. Upgrade now to continue using PharmaLens.</p>
                </div>
              </div>
            )}

            {/* Info: Subscription expiring soon */}
            {subscriptionStatus.status === 'expiring' && subscriptionStatus.daysLeft > 0 && subscriptionStatus.daysLeft <= 7 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-yellow-700 dark:text-yellow-200">
                  <p className="font-semibold">Subscription Expiring Soon</p>
                  <p className="mt-1">Your {currentPlan?.name || 'subscription'} expires in {subscriptionStatus.daysLeft} day{subscriptionStatus.daysLeft > 1 ? 's' : ''}. Renew to maintain access to premium features.</p>
                </div>
              </div>
            )}

            {/* Info: Subscription expired */}
            {subscriptionStatus.status === 'expired' && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-red-700 dark:text-red-200">
                  <p className="font-semibold">Subscription Expired</p>
                  <p className="mt-1">Your subscription has expired. Renew now to restore full access to PharmaLens features and identifications.</p>
                </div>
              </div>
            )}

            {/* Info: Good usage status */}
            {usagePercentage < 50 && usageStats.monthlyLimit !== -1 && subscriptionStatus.status === 'active' && (
              <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-green-700 dark:text-green-200">
                  <p className="font-semibold">You're On Track!</p>
                  <p className="mt-1">You've used {usageStats.identificationsUsed} of {usageStats.monthlyLimit + (profile?.extra_identifications || 0)} identifications. You're managing your usage efficiently.</p>
                </div>
              </div>
            )}

            {/* Info: Free plan reminder */}
            {subscriptionStatus.status === 'free' && usageStats.identificationsUsed >= 3 && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Zap className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700 dark:text-blue-200">
                  <p className="font-semibold">Unlock More with Premium Plans</p>
                  <p className="mt-1">Upgrade to Lite (39/month) or Pro (101/month) for more identifications, advanced search, and priority support.</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base sm:text-lg">Available Plans</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Choose a monthly plan that fits your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {plans.map((plan) => {
              const userPlanId = currentSubscription?.plan?.id || currentSubscription?.plan_id || 'free-plan';
              const isCurrentPlan = plan.id === userPlanId;
              const isUpgrade = currentPlan && (plan.price || 0) > (currentPlan.price || 0);
              const isDowngrade = currentPlan && (plan.price || 0) < (currentPlan.price || 0);

              const displayPrice = plan.discounted_price || plan.price || 0;
              const originalPrice = plan.original_price;
              const hasDiscount = originalPrice && originalPrice > displayPrice;
              
              // Build features based on plan name with proper search limits
              const planExtended = plan as any;
              const identificationLimit = planExtended.identifications_limit || 5;
              const searchLimit = planExtended.advanced_search_limit || 50;
              
              const displayFeatures: string[] = (() => {
                if (plan.name === 'Free Plan' || plan.name === 'Free') {
                  return [
                    'Advanced search (100 results limit)',
                    '100 drugs database access',
                    'Basic drug information',
                    'Drug interaction checker',
                    'Symptom checker'
                  ];
                } else if (plan.name === 'Lite') {
                  return [
                    'All Free Plan features',
                    'Priority support',
                    'Advanced search (249 results limit)',
                    'Layman explanations',
                    '1200+ medicines database',
                    'Drug interaction checker',
                    'Symptom checker',
                    'PWA offline access'
                  ];
                } else if (plan.name === 'Pro') {
                  return [
                    'All Free Plan features',
                    'Priority support', 
                    'Advanced search (500 results limit)',
                    'Layman explanations',
                    '1200+ medicines database',
                    'Drug interaction checker',
                    'Symptom checker',
                    'PWA offline access',
                    'History feature (unlimited)'
                  ];
                }
                
                // Fallback to stored features or default
                return Array.isArray((plan as any).features) 
                  ? (plan as any).features 
                  : ['Basic features'];
              })();

              return (
                <Card 
                  key={plan.id} 
                  className={`relative transition-all ${
                    isCurrentPlan 
                      ? 'ring-2 ring-blue-500 border-blue-500 shadow-lg' 
                      : 'hover:shadow-md'
                  }`}
                >
                  {isCurrentPlan && (
                    <Badge className="absolute -top-2 right-2 sm:right-4 bg-blue-500 text-xs">
                      Active Plan
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center pb-3">
                    <CardTitle className="text-base sm:text-lg md:text-xl">{plan.name}</CardTitle>
                    <div className="space-y-1 mt-2">
                      {hasDiscount && (
                        <div className="text-sm sm:text-base text-gray-400 line-through">
                          ₹{originalPrice}
                        </div>
                      )}
                      <div className="text-2xl sm:text-3xl font-bold">
                        ₹{displayPrice}
                        <span className="text-xs sm:text-sm font-normal text-gray-600 dark:text-gray-400">/month</span>
                      </div>
                      {hasDiscount && (
                        <div className="text-xs sm:text-sm text-green-600 font-semibold">
                          Save ₹{originalPrice - displayPrice}/month
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
                    <div className="text-center">
                      <p className="text-base sm:text-lg font-semibold">
                        {identificationLimit} identifications/month
                      </p>
                      {searchLimit && (
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Search limit: {searchLimit} results
                        </p>
                      )}
                    </div>
                    
                    <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                      {displayFeatures.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="flex-1 leading-tight">{feature}</span>
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
                            billingCycle="monthly"
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
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Your subscription expires in {subscriptionStatus.daysLeft} days
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Renew now to continue enjoying premium features
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {subscriptionStatus.status === 'expired' && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-semibold text-red-800 dark:text-red-200">
                  Your subscription has expired
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Subscribe to a plan to continue using premium features
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top-Up Identification Packs */}
      <IdentificationPacks />
    </div>
    
    {/* Congratulations Message */}
    <CongratulationsMessage
      isVisible={showCongratulations}
      planName={congratulationsPlan}
      billingCycle="monthly"
      planFeatures={congratulationsFeatures}
      onDismiss={() => setShowCongratulations(false)}
    />
    </>
  );
};

export default SubscriptionManager;
