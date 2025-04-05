
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CurrentSubscription from '@/components/subscription/CurrentSubscription';
import PlanCard from '@/components/subscription/PlanCard';
import ComparisonTable from '@/components/subscription/ComparisonTable';
import PaymentDialog from '@/components/subscription/PaymentDialog';

interface Plan {
  id: string;
  name: string;
  description: string;
  price_inr: number;
  monthly_identifications: number;
  features: string[];
  razorpay_plan_id?: string;
  subscription_button_id?: string;
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
  const [showComparison, setShowComparison] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (isAuthenticated && user) {
      loadSubscriptionData();
    }
  }, [isAuthenticated, authLoading, user]);

  // Load subscription button scripts when plans are loaded
  useEffect(() => {
    if (plans && plans.length > 0) {
      // Load Razorpay subscription button script
      const script = document.createElement('script');
      script.src = 'https://cdn.razorpay.com/static/widget/subscription-button.js';
      script.async = true;
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [plans]);

  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await Promise.all([
        fetchSubscriptionPlans(),
        fetchUserSubscription(),
        fetchUsageData()
      ]);
    } catch (error: any) {
      console.error('Error loading subscription data:', error);
      setError(`Failed to load subscription data: ${error.message || 'Unknown error'}`);
      toast.error(`Failed to load subscription data: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubscriptionPlans = async () => {
    try {
      // Try to fetch plans, but provide fallback if there's an error
      const { data, error } = await supabase.functions.invoke('subscription-management/subscription-plans');
      
      if (error) {
        console.error('Error fetching plans:', error);
        // Provide default plans as fallback
        const defaultPlans = [
          {
            id: "free-plan",
            name: 'Free',
            description: 'Basic features for getting started',
            price_inr: 0,
            monthly_identifications: 5,
            features: ['Basic drug identification', 'Limited history storage (10 items)', 'Standard response time']
          },
          {
            id: "advanced-plan",
            name: 'Advanced',
            description: 'Enhanced features for regular users',
            price_inr: 299,
            monthly_identifications: 30,
            features: ['Enhanced drug identification', 'Full history access (100 items)', 'Faster response time', 'Detailed medication reports'],
            razorpay_plan_id: 'plan_QF0j2DLuOBwNHE',
            subscription_button_id: 'pl_QF1itg7gdfQFbF'
          },
          {
            id: "elite-plan",
            name: 'Elite',
            description: 'Premium features for power users',
            price_inr: 599,
            monthly_identifications: 100,
            features: ['Premium drug identification', 'Unlimited history storage', 'Priority response time', 'Comprehensive medication reports'],
            razorpay_plan_id: 'plan_QF0jNqqpycThRR',
            subscription_button_id: 'pl_QFGGMMuM37x0Sp'
          }
        ];
        setPlans(defaultPlans);
        return;
      }
      
      if (data?.plans && data.plans.length > 0) {
        // Add subscription button IDs to the plans
        const updatedPlans = data.plans.map((plan: Plan) => {
          if (plan.name === 'Advanced') {
            return { ...plan, subscription_button_id: 'pl_QF1itg7gdfQFbF' };
          } else if (plan.name === 'Elite') {
            return { ...plan, subscription_button_id: 'pl_QFGGMMuM37x0Sp' };
          }
          return plan;
        });
        setPlans(updatedPlans);
      } else {
        throw new Error('No plans returned from server');
      }
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  };

  const fetchUserSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('subscription-management/user-subscription');
      if (error) throw new Error(error.message);
      if (data?.subscription) {
        setCurrentSubscription(data.subscription);
      }
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      throw error;
    }
  };

  const fetchUsageData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('subscription-management/identification-usage');
      if (error) throw new Error(error.message);
      if (data) {
        setUsage(data);
      }
    } catch (error: any) {
      console.error('Error fetching usage data:', error);
      // Non-critical error, don't throw
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
      setProcessingPayment(true);
      
      // For free plan, just activate it
      if (plan.price_inr === 0) {
        const { data, error } = await supabase.functions.invoke('subscription-management/create-order', {
          body: { planId: plan.id }
        });
        
        if (error) throw new Error(error.message);
        
        if (data?.success) {
          toast.success(data.message);
          await loadSubscriptionData();
        }
      } else {
        // For paid plans, we'll use the Razorpay buttons instead of our custom solution
        setPaymentDialogOpen(true);
      }
    } catch (error: any) {
      console.error('Error selecting plan:', error);
      toast.error(`Failed to initialize subscription: ${error.message}`);
    } finally {
      setProcessingPayment(false);
    }
  };

  const isPlanActive = (planName: string) => {
    return currentSubscription?.subscription_plans.name === planName;
  };

  const toggleComparison = () => {
    setShowComparison(!showComparison);
  };

  const handleRetry = () => {
    loadSubscriptionData();
  };

  if (isLoading || authLoading) {
    return (
      <>
        <Header />
        <div className="container max-w-6xl mx-auto px-4 pt-24 pb-12">
          <div className="flex flex-col justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-gray-500">Loading subscription information...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="container max-w-6xl mx-auto px-4 pt-24 pb-12">
          <div className="flex flex-col justify-center items-center py-12">
            <div className="w-full max-w-md">
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-red-600">
                  {error}
                </AlertDescription>
              </Alert>
              <Button onClick={handleRetry} className="w-full">
                Retry Loading
              </Button>
            </div>
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
          <CurrentSubscription 
            subscription={currentSubscription} 
            usage={usage} 
          />
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
          plans && plans.length > 0 ? (
            // Subscription Plans Cards
            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <PlanCard 
                  key={plan.id}
                  plan={plan}
                  isActive={isPlanActive(plan.name)}
                  processingPayment={processingPayment}
                  selectedPlan={selectedPlan}
                  onSelectPlan={handleSelectPlan}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No subscription plans available</p>
            </div>
          )
        ) : (
          // Comparison Table
          plans && plans.length > 0 ? (
            <ComparisonTable 
              plans={plans}
              isPlanActive={isPlanActive}
              handleSelectPlan={handleSelectPlan}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No subscription plans available to compare</p>
            </div>
          )
        )}

        {/* Payment Dialog with Razorpay Buttons */}
        <PaymentDialog 
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          selectedPlan={selectedPlan}
        />
      </div>
    </>
  );
};

export default Subscription;
