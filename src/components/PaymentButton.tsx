import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Shield, CheckCircle, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { SubscriptionPlan } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionService } from '@/services/subscriptionService';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import ErrorHandler, { PaymentError } from '@/components/ErrorHandler';
import { transactionLogger } from '@/utils/transactionLogger';

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
  const [paymentError, setPaymentError] = useState<PaymentError | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  
  const { startPolling, reset, isPolling, error: pollingError } = usePaymentStatus();
  const currentPlan = plan;

  useEffect(() => {
    // Generate session ID for transaction logging
    setSessionId(transactionLogger.getSessionId());
    
    // Subscribe to subscription updates
    const subscriptionService = SubscriptionService.getInstance();
    const unsubscribe = subscriptionService.onSubscriptionUpdate((subscription) => {
      if (subscription) {
        transactionLogger.logSubscriptionUpdated(subscription.user_id, {
          subscriptionId: subscription.plan_id,
          planId: subscription.plan_id,
          status: subscription.status,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        });
        
        toast.success('Subscription updated successfully!');
        onPaymentSuccess?.(subscription.plan_id);
      }
    });

    return () => {
      unsubscribe();
      reset();
    };
  }, [onPaymentSuccess, sessionId, reset]);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

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
    setPaymentError(null);

    let currentUser: any = null;
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Please log in to continue with payment');
      }
      currentUser = user;

      // Log payment initiation
      transactionLogger.logPaymentInitiated(user.id, {
        planId: currentPlan.id,
        amount: currentPlan.price,
        currency: 'INR',
        paymentMethod: 'razorpay'
      });

      const currentBillingCycle = (currentPlan as any)?.billing_period === 'weekly'
        ? 'weekly'
        : (billingCycle || (currentPlan.id.includes('yearly') ? 'yearly' : 'monthly'));
      const amount = currentPlan.price;

      if (!amount || amount <= 0) {
        throw new Error('Invalid plan pricing');
      }

      // Create Razorpay order via Supabase function with retry
      const invokeWithRetry = async (attempts = 2) => {
        let lastErr: any = null;
        let lastData: any = null;
        
        for (let i = 0; i <= attempts; i++) {
          console.log(`Attempt ${i + 1} to create Razorpay order...`);
          
          const { data, error } = await supabase.functions.invoke('razorpay-order', {
            body: {
              userId: user.id,
              planId: currentPlan.id,
              amount,
              userEmail: user.email || '',
              userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              billingCycle: currentBillingCycle
            }
          });
          
          console.log('Edge Function response:', { data, error });
          
          // Check if data contains an error (Edge Function returned error in response body)
          if (data?.error) {
            lastErr = { message: data.message || data.error, code: 'edge_function_error', details: data.details };
            lastData = data;
            console.error('Edge Function returned error:', data);
            await new Promise(r => setTimeout(r, 500 * (i + 1)));
            continue;
          }
          
          if (!error && data) {
            console.log('Order created successfully:', data.orderId);
            return data;
          }
          
          lastErr = error;
          console.error('Supabase invoke error:', error);
          await new Promise(r => setTimeout(r, 500 * (i + 1)));
        }
        
        // Build detailed error message
        const errorMsg = lastData?.message || lastErr?.message || 'Failed to initiate payment';
        const errorDetails = lastData?.details || lastErr?.details || '';
        throw new Error(`${errorMsg}${errorDetails ? ` (${errorDetails})` : ''}`);
      };

      const data = await invokeWithRetry(2);

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Failed to load Razorpay Checkout');
      }

      const returnPath = window.location.pathname || '/subscription-manager';
      const options: any = {
        key: data?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data?.amount, // in paise
        currency: data?.currency || 'INR',
        name: 'Pharmalens',
        description: `${currentPlan.name} - ${currentBillingCycle} subscription`,
        order_id: data?.orderId,
        prefill: {
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
        },
        notes: {
          planId: currentPlan.id,
          billingCycle: currentBillingCycle,
        },
        theme: { color: '#3399cc' },
        callback_url: `${data?.callbackUrl}?return=${encodeURIComponent(returnPath)}`,
        handler: function (response: any) {
          // Log payment success
          transactionLogger.logPaymentSuccess(user.id, {
            paymentId: response.razorpay_payment_id,
            planId: currentPlan.id,
            amount: currentPlan.price,
            transactionId: response.razorpay_order_id
          });

          toast.success('Payment initiated. Finalizing...');
          
          // Start polling for subscription status
          startPolling(user.id);
          
          // Proactively activate subscription server-side and notify UI
          (async () => {
            try {
              await supabase.functions.invoke('subscription-manager', {
                body: {
                  action: 'activate',
                  userId: user.id,
                  planId: currentPlan.id,
                  billingCycle: currentBillingCycle,
                  transactionId: data?.transactionId
                }
              });
            } catch (err) {
              console.error('Subscription activation invoke error:', err);
            }

            try {
              const result = await SubscriptionService.getInstance().updateSubscriptionStatus(
                user.id,
                currentPlan.id,
                data?.transactionId
              );
              
              if (result.success) {
                console.log('Subscription updated successfully:', result.subscription);
                // Give realtime a moment to propagate
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } catch (err) {
              console.error('Client-side subscription update error:', err);
            }
          })();
          
          onPaymentSuccess?.(currentPlan.id);
        },
        modal: {
          ondismiss: function() {
            toast.info('Payment window closed');
            transactionLogger.logError(user.id, {
              context: 'payment_modal',
              action: 'payment_dismissed',
              errorType: 'user_cancelled'
            }, {
              message: 'Payment window dismissed',
              code: 'user_cancelled'
            });
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
      
    } catch (error: any) {
      const errorMessage = error?.message || 'Payment failed';
      
      // Create structured error object
      const paymentError: PaymentError = {
        type: error?.code === 'network_error' ? 'network_error' : 
              error?.code === 'timeout' ? 'timeout' :
              error?.code === 'validation_error' ? 'validation_error' :
              'payment_failed',
        message: errorMessage,
        code: error?.code,
        details: error,
        timestamp: new Date(),
        retryable: !['validation_error', 'authentication_error'].includes(error?.code)
      };

      setPaymentError(paymentError);
      
      // Log payment failure
      transactionLogger.logPaymentFailed(currentUser?.id || 'unknown', {
        planId: currentPlan?.id || 'unknown',
        amount: currentPlan?.price || 0,
        reason: errorMessage
      }, {
        message: errorMessage,
        code: error?.code,
        stack: error?.stack
      });

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
    if (isPolling) return 'Verifying...';
    return children ? '' : `Upgrade to ${currentPlan?.name || 'Plan'}`;
  };

  const getButtonVariant = () => {
    if (isCurrentPlan) return 'secondary';
    if (currentPlan?.id === 'free-plan') return 'outline';
    return 'default';
  };

  const handleRetry = () => {
    setPaymentError(null);
    handlePayment();
  };

  return (
    <div className="space-y-4">
      {/* Error Handler */}
      {paymentError && (
        <ErrorHandler
          error={paymentError}
          onRetry={handleRetry}
          onDismiss={() => setPaymentError(null)}
        />
      )}

      {/* Polling Error */}
      {pollingError && (
        <div className="bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-700 dark:text-yellow-200">
              <p className="font-medium">Verification Issue</p>
              <p className="mt-1">{pollingError.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      {isPolling && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20 animate-subscription-update">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="font-medium">Verifying Payment</span>
            </div>
            <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
              Please wait while we confirm your subscription...
            </p>
          </CardContent>
        </Card>
      )}
      {currentPlan?.id !== 'free-plan' && !isCurrentPlan && (
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm">
              <Shield className="w-4 h-4" />
              <span className="font-medium">Secure Payment</span>
            </div>
            <p className="text-green-600 dark:text-green-400 text-xs mt-1">
              256-bit SSL encryption • PCI DSS compliant • Razorpay secured
            </p>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handlePayment}
        disabled={isCurrentPlan || isProcessing || isPolling}
        className={`w-full transition-all duration-300 ${
          plan?.id === 'monthly-premium-plan' && !isCurrentPlan
            ? 'bg-pharma-600 hover:bg-pharma-700 text-white' 
            : ''
        } ${isPolling ? 'animate-pulse-border' : ''} ${className}`}
        variant={getButtonVariant()}
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : isPolling ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Verifying Payment...
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
                • Auto-renewal can be managed in settings
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
                Your payment is processed securely through Razorpay. You'll be redirected to complete the payment.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentButton;
