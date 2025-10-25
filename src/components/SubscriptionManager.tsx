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

type UserProfile = Tables<"profiles">;
type SubscriptionPlan = Tables<"subscription_plans">;
// Add local type for current subscription with joined plan
type UserSubscription = Tables<"user_subscriptions"> & { plan?: SubscriptionPlan };

const SubscriptionManager: React.FC = () => {
  const { user } = useAuthStatus();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  // Track current subscription from user_subscriptions table
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Fetch subscription plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (plansError) {
        throw plansError;
      }

      // Fetch current active subscription
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select(`*, plan:subscription_plans(*)`)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (subscriptionError && (subscriptionError as any).code !== 'PGRST116') {
        throw subscriptionError;
      }

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
      return { status: 'expired', daysLeft: 0 };
    }
    if (currentSubscription.status === 'active') {
      return { status: 'active', daysLeft: 30 };
    }
    return { status: 'expired', daysLeft: 0 };
  };

  const getUsagePercentage = () => {
    if (!profile) return 0;
    return Math.min((profile.identifications_used / profile.monthly_identifications) * 100, 100);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'expiring':
        return <Badge className="bg-yellow-100 text-yellow-800">Expiring Soon</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'free':
        return <Badge variant="outline">Free Plan</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subscription Management</h2>
          <p className="text-gray-600">Manage your subscription and view usage</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUserData}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {currentPlan ? currentPlan.name : 'Free Plan'}
              </h3>
              <p className="text-gray-600">
                {currentSubscription?.status === 'active' && (currentSubscription?.plan_id !== 'free-plan')
                  ? 'Active subscription'
                  : 'Free plan - no expiration'
                }
              </p>
            </div>
            <div className="text-right">
              {getStatusBadge(subscriptionStatus.status)}
              {subscriptionStatus.daysLeft > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {subscriptionStatus.daysLeft} days left
                </p>
              )}
            </div>
          </div>

          {/* Usage Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Monthly Identifications Used</span>
              <span>
                {profile?.identifications_used || 0} / {profile?.monthly_identifications || 0}
              </span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
            {usagePercentage >= 80 && (
              <p className="text-sm text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                You're approaching your monthly limit
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {currentSubscription?.plan_id !== 'free-plan' && (
              <Button
                variant="outline"
                onClick={handleCancelSubscription}
                disabled={isUpdating}
                className="text-red-600 hover:text-red-700"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Settings className="w-4 h-4 mr-2" />
                )}
                Cancel Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Choose a plan that fits your needs
          </CardDescription>
          <div className="flex items-center gap-4 pt-2">
            <Button
              variant={billingCycle === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </Button>
            <Button
              variant={billingCycle === 'yearly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly (Save 20%)
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const price = plan.price;
              const isCurrentPlan = plan.id === (currentSubscription?.plan?.id || currentSubscription?.plan_id || '');
              const isUpgrade = currentPlan && plan.price > currentPlan.price;
              const isDowngrade = currentPlan && plan.price < currentPlan.price;

              // Normalize features to string[]
              const features: string[] = Array.isArray(plan.features) ? (plan.features as unknown as string[]) : [];

              return (
                <Card 
                  key={plan.id} 
                  className={`relative ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {isCurrentPlan && (
                    <Badge className="absolute -top-2 right-4 bg-green-500">
                      Current Plan
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold">
                      ₹{price}
                      <span className="text-sm font-normal text-gray-600">
                        /{plan.billing_period || 'month'}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <p className="text-lg font-semibold">
                        {features.includes('unlimited_identifications') 
                          ? 'Unlimited' 
                          : (plan.id === 'free-plan' ? '5' : '100')
                        } identifications/month
                      </p>
                    </div>
                    
                    <ul className="space-y-2 text-sm">
                      {features.map((feature, index) => (
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
  );
};

export default SubscriptionManager;