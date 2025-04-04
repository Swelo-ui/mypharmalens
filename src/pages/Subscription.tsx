
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
}

const Subscription = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStatus();
  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [razorpayData, setRazorpayData] = useState<any>(null);
  const [showComparison, setShowComparison] = useState(false);
  const navigate = useNavigate();

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        document.body.appendChild(script);
      });
    };

    loadRazorpayScript();
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (isAuthenticated && user) {
      loadSubscriptionData();
    }
  }, [isAuthenticated, authLoading, user]);

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        fetchSubscriptionPlans(),
        fetchUserSubscription(),
        fetchUsageData()
      ]);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('subscription-management/subscription-plans');
      if (error) throw error;
      if (data?.plans) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to fetch subscription plans');
    }
  };

  const fetchUserSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('subscription-management/user-subscription');
      if (error) throw error;
      if (data?.subscription) {
        setCurrentSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const fetchUsageData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('subscription-management/identification-usage');
      if (error) throw error;
      if (data) {
        setUsage(data);
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
    }
  };

  const handleSelectPlan = async (plan: Plan) => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      navigate('/auth');
      return;
    }

    setSelectedPlan(plan);
    
    try {
      // For free plan, just activate it
      if (plan.price_inr === 0) {
        setProcessingPayment(true);
        const { data, error } = await supabase.functions.invoke('subscription-management/create-order', {
          body: { planId: plan.id }
        });
        
        if (error) throw error;
        
        if (data?.success) {
          toast.success(data.message);
          await loadSubscriptionData();
        }
        setProcessingPayment(false);
        return;
      }
      
      // For paid plans, open payment dialog
      setProcessingPayment(true);
      const { data, error } = await supabase.functions.invoke('subscription-management/create-order', {
        body: { planId: plan.id }
      });
      
      if (error || !data?.order) {
        throw new Error(error?.message || 'Failed to create order');
      }
      
      setRazorpayData({
        key: data.key_id,
        order: data.order,
        plan: data.plan
      });
      
      setPaymentDialogOpen(true);
    } catch (error) {
      console.error('Error selecting plan:', error);
      toast.error('Failed to initialize payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePayment = () => {
    if (!razorpayData || !user) return;

    const options = {
      key: razorpayData.key,
      amount: razorpayData.order.amount,
      currency: razorpayData.order.currency,
      name: "PharmaLens",
      description: `Subscription: ${razorpayData.plan.name} Plan`,
      order_id: razorpayData.order.id,
      handler: async (response: any) => {
        try {
          setProcessingPayment(true);
          const { data, error } = await supabase.functions.invoke('subscription-management/verify-payment', {
            body: { 
              ...response, 
              plan_id: razorpayData.plan.id 
            }
          });
          
          if (error) throw error;
          
          if (data?.success) {
            toast.success(data.message);
            setPaymentDialogOpen(false);
            await loadSubscriptionData();
          }
        } catch (error) {
          console.error('Payment verification failed:', error);
          toast.error('Payment verification failed. Please contact support.');
        } finally {
          setProcessingPayment(false);
        }
      },
      prefill: {
        email: user.email,
      },
      theme: {
        color: "#3b82f6",
      },
      modal: {
        ondismiss: () => {
          setPaymentDialogOpen(false);
        },
      },
    };

    // Initialize Razorpay
    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isPlanActive = (planName: string) => {
    return currentSubscription?.subscription_plans.name === planName;
  };

  const toggleComparison = () => {
    setShowComparison(!showComparison);
  };

  const getFeatureAvailability = (featureName: string, planName: string) => {
    // Define which features are available for each plan
    const featureMap: Record<string, string[]> = {
      "Drug identification": ["Free", "Advanced", "Elite"],
      "History storage": ["Free", "Advanced", "Elite"],
      "Response time": ["Free", "Advanced", "Elite"],
      "Detailed reports": ["Advanced", "Elite"],
      "Bulk identification": ["Elite"],
      "Priority support": ["Elite"],
      "API access": ["Elite"],
      "Custom alerts": ["Advanced", "Elite"]
    };

    return featureMap[featureName]?.includes(planName) || false;
  };

  if (isLoading || authLoading) {
    return (
      <>
        <Header />
        <div className="container max-w-6xl mx-auto px-4 pt-24 pb-12">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container max-w-6xl mx-auto px-4 pt-24 pb-12">
        <h1 className="text-3xl font-bold mb-2">Subscription Plans</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Choose the right plan for your medication identification needs
        </p>

        {/* Current Subscription Info */}
        {currentSubscription && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-2">
                  <span className="text-lg font-medium">{currentSubscription.subscription_plans.name} Plan</span>
                  <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
                    Active
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {currentSubscription.subscription_plans.description}
                </p>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Started:</span> {formatDate(currentSubscription.subscription_start)}</p>
                  <p><span className="font-medium">Expires:</span> {formatDate(currentSubscription.subscription_end)}</p>
                  <p><span className="font-medium">Monthly identifications:</span> {currentSubscription.subscription_plans.monthly_identifications}</p>
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
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toggle between Plans and Comparison View */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-md shadow-sm">
            <Button 
              variant={!showComparison ? "default" : "outline"}
              className="rounded-r-none"
              onClick={() => setShowComparison(false)}
            >
              Plans
            </Button>
            <Button 
              variant={showComparison ? "default" : "outline"}
              className="rounded-l-none"
              onClick={() => setShowComparison(true)}
            >
              Compare Features
            </Button>
          </div>
        </div>

        {!showComparison ? (
          // Subscription Plans Cards
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.id} 
                className={`border rounded-lg overflow-hidden ${
                  isPlanActive(plan.name) 
                    ? 'border-primary border-2 bg-primary/5' 
                    : 'bg-white dark:bg-gray-800'
                }`}
              >
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-3xl font-bold">₹{plan.price_inr}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">/month</span>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{plan.monthly_identifications} identifications / month</span>
                    </li>
                    {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    className="w-full"
                    variant={isPlanActive(plan.name) ? "outline" : "default"}
                    disabled={isPlanActive(plan.name) || processingPayment}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {processingPayment ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {isPlanActive(plan.name) 
                      ? "Current Plan" 
                      : plan.price_inr === 0 
                        ? "Start Free" 
                        : `Subscribe - ₹${plan.price_inr}`
                    }
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Comparison Table
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="p-4 text-left border-b">Features</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="p-4 text-center border-b">
                      <div className="font-bold text-lg">{plan.name}</div>
                      <div className="text-sm text-gray-500">₹{plan.price_inr}/month</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  "Drug identification",
                  "History storage",
                  "Response time",
                  "Detailed reports",
                  "Bulk identification",
                  "Priority support",
                  "API access",
                  "Custom alerts"
                ].map((feature, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}>
                    <td className="p-4 border-b">{feature}</td>
                    {plans.map((plan) => (
                      <td key={`${plan.id}-${feature}`} className="p-4 text-center border-b">
                        {getFeatureAvailability(feature, plan.name) ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 mx-auto" />
                        )}
                        {feature === 'History storage' && (
                          <div className="text-xs text-gray-500 mt-1">
                            {plan.name === 'Free' ? '10 items' : 
                             plan.name === 'Advanced' ? '100 items' : 
                             'Unlimited'}
                          </div>
                        )}
                        {feature === 'Response time' && (
                          <div className="text-xs text-gray-500 mt-1">
                            {plan.name === 'Free' ? 'Standard' : 
                             plan.name === 'Advanced' ? 'Fast' : 
                             'Priority'}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <td className="p-4 border-b font-medium">Monthly identifications</td>
                  {plans.map((plan) => (
                    <td key={`${plan.id}-identifications`} className="p-4 text-center border-b font-medium">
                      {plan.monthly_identifications}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4"></td>
                  {plans.map((plan) => (
                    <td key={`${plan.id}-action`} className="p-4 text-center">
                      <Button
                        variant="default"
                        className={plan.name === 'Advanced' ? "bg-pharma-600 hover:bg-pharma-700" : ""}
                        disabled={isPlanActive(plan.name) || processingPayment}
                        onClick={() => handleSelectPlan(plan)}
                      >
                        {isPlanActive(plan.name) 
                          ? "Current Plan" 
                          : plan.name === "Free" 
                            ? "Start Free" 
                            : `Choose ${plan.name}`
                        }
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Payment Dialog - only for display purposes, actual payment handled by Razorpay */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Your Payment</DialogTitle>
              <DialogDescription>
                Make a secure payment using Razorpay to activate your subscription.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedPlan && (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium">{selectedPlan.name} Plan</span>
                    <span>₹{selectedPlan.price_inr}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>₹{selectedPlan.price_inr}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePayment} disabled={processingPayment}>
                {processingPayment ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Proceed to Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Subscription;
