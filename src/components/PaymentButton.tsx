import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Shield, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SubscriptionPlan } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';

interface PaymentButtonProps {
  plan?: SubscriptionPlan;
  planId?: string;
  billingCycle?: 'monthly' | 'yearly';
  className?: string;
  children?: React.ReactNode;
  isCurrentPlan?: boolean;
  onPaymentSuccess?: (planId: string) => void;
  onPaymentError?: (error: string) => void;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  plan,
  planId,
  billingCycle = 'monthly',
  className = '',
  children,
  isCurrentPlan = false,
  onPaymentSuccess,
  onPaymentError
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const currentPlan = plan;

  const handlePayment = async () => {
    if (planId && !plan) {
      toast.error('Plan details not available. Please try again.');
      return;
    }

    const currentPlan = plan;
    if (!currentPlan) {
      toast.error('Plan information is missing');
      return;
    }

    if (isCurrentPlan) {
      toast.info('You are already on this plan');
      return;
    }

    if (currentPlan.id === 'free-plan') {
      toast.success('You are already on the Free Plan!');
      return;
    }

    setIsProcessing(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Please log in to continue with payment');
      }

      const currentBillingCycle = billingCycle || (currentPlan.id.includes('yearly') ? 'yearly' : 'monthly');
      // Use the single price column from the database
      const amount = currentPlan.price;

      if (!amount || amount <= 0) {
        throw new Error('Invalid plan pricing');
      }

      const { data, error } = await supabase.functions.invoke('payu-payment', {
        body: {
          action: 'create_payment',
          userId: user.id,
          planId: currentPlan.id,
          amount,
          userEmail: user.email || '',
          userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          billingCycle: currentBillingCycle
        }
      });

      if (error) {
        console.error('PayU invoke error:', error);
        throw new Error(error.message || 'Failed to initiate payment');
      }

      if (data?.success && data?.paymentUrl) {
        if (data.paymentUrl.startsWith('data:text/html')) {
          const newWindow = window.open('', '_blank');
          if (newWindow) {
            newWindow.document.write(atob(data.paymentUrl.split(',')[1]));
            newWindow.document.close();
          } else {
            throw new Error('Please allow popups to complete payment');
          }
        } else {
          window.location.href = data.paymentUrl;
        }
      } else {
        console.error('PayU response error:', data);
        throw new Error(data?.error || 'No payment URL received from server');
      }
      
    } catch (error: any) {
      const errorMessage = error?.message || 'Payment failed';
      toast.error(errorMessage);
      onPaymentError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonText = () => {
    if (isCurrentPlan) return 'Current Plan';
    if (currentPlan?.id === 'free-plan') return 'Get Started Free';
    if (isProcessing) return 'Processing...';
    return children ? '' : `Upgrade to ${currentPlan?.name || 'Plan'}`;
  };

  const getButtonVariant = () => {
    if (isCurrentPlan) return 'secondary';
    if (currentPlan?.id === 'free-plan') return 'outline';
    return 'default';
  };

  return (
    <div className="space-y-4">
      {currentPlan?.id !== 'free-plan' && !isCurrentPlan && (
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm">
              <Shield className="w-4 h-4" />
              <span className="font-medium">Secure Payment</span>
            </div>
            <p className="text-green-600 dark:text-green-400 text-xs mt-1">
              256-bit SSL encryption • PCI DSS compliant • PayU secured
            </p>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handlePayment}
        disabled={isCurrentPlan || isProcessing}
        className={`w-full ${
          plan?.id === 'monthly-premium-plan' && !isCurrentPlan
            ? 'bg-pharma-600 hover:bg-pharma-700 text-white' 
            : ''
        } ${className}`}
        variant={getButtonVariant()}
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            {!isCurrentPlan && plan?.id !== 'free-plan' && (
              <CreditCard className="w-4 h-4 mr-2" />
            )}
            {isCurrentPlan && <CheckCircle className="w-4 h-4 mr-2" />}
            {children || getButtonText()}
          </>
        )}
      </Button>

      {plan?.id !== 'free-plan' && !isCurrentPlan && (
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-300 mb-2">Accepted payment methods:</p>
          <div className="flex justify-center items-center gap-2 text-xs text-gray-400 dark:text-gray-400">
            <Badge variant="outline" className="text-xs">UPI</Badge>
            <Badge variant="outline" className="text-xs">Cards</Badge>
            <Badge variant="outline" className="text-xs">Net Banking</Badge>
            <Badge variant="outline" className="text-xs">Wallets</Badge>
          </div>
        </div>
      )}

      {plan?.id !== 'free-plan' && !isCurrentPlan && (
        <div className="bg-pharma-50 border border-pharma-200 dark:bg-pharma-900/20 dark:border-pharma-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-pharma-600 dark:text-pharma-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-pharma-700 dark:text-pharma-200">
              <p className="font-medium">Billing Information</p>
              <p className="mt-1">
                • Instant activation after payment<br/>
                • Auto-renewal can be managed in settings<br/>
                • 7-day money-back guarantee<br/>
                • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      )}

      {plan?.id !== 'free-plan' && !isCurrentPlan && (
        <div className="bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-200">
              <p className="font-medium">Secure Payment</p>
              <p className="mt-1">
                Your payment is processed securely through PayU. You'll be redirected to complete the payment.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentButton;