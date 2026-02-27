import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionService } from '@/services/subscriptionService';
import PurchaseSuccessConfetti from '@/components/PurchaseSuccessConfetti';
import { Tables } from '@/types/database.types';

const PaymentResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<Tables<'payment_transactions'> | null>(null);
  const [showCongratulations, setShowCongratulations] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const razorpayOrderId = searchParams.get('razorpay_order_id');
        const razorpayPaymentId = searchParams.get('razorpay_payment_id');
        const razorpaySignature = searchParams.get('razorpay_signature');
        const returnPath = searchParams.get('return');

        if (!razorpayOrderId && !razorpayPaymentId) {
          throw new Error('Invalid payment response');
        }

        // Query latest transaction status for this user/order
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error('Please log in to verify payment');
        }

        const { data: tx, error: txErr } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('user_id', user.id)
          .or(`razorpay_order_id.eq.${razorpayOrderId},razorpay_payment_id.eq.${razorpayPaymentId}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (txErr) {
          throw txErr;
        }

        const status = tx?.status || 'pending';
        setPaymentStatus(status as 'success' | 'failed' | 'pending');
        setTransactionDetails(tx);

        // Show appropriate toast message
        if (status === 'success') {
          // Secondary safety net: proactively activate and notify UI
          try {
            await supabase.functions.invoke('subscription-manager', {
              body: {
                action: 'activate',
                userId: user.id,
                planId: tx?.plan_id,
                billingCycle: tx?.billing_cycle || 'monthly',
                transactionId: tx?.transaction_id
              }
            });
          } catch (e) {
            console.error('Activation invoke error (PaymentResult):', e);
          }

          try {
            await SubscriptionService.getInstance().updateSubscriptionStatus(
              user.id,
              tx?.plan_id,
              tx?.transaction_id
            );
          } catch (e) {
            console.error('Client update error (PaymentResult):', e);
          }

          // Show confetti celebration (toast is shown by the component)
          setShowCongratulations(true);
        } else if (status === 'failed') {
          toast.error('Payment failed. Please try again.');
        } else {
          toast.info('Payment is being processed. Finalizing...');
          // Poll for status updates while webhook finalizes
          const start = Date.now();
          const interval = setInterval(async () => {
            try {
              const { data: latest, error: latestErr } = await supabase
                .from('payment_transactions')
                .select('*')
                .eq('user_id', user.id)
                .or(`razorpay_order_id.eq.${razorpayOrderId},razorpay_payment_id.eq.${razorpayPaymentId}`)
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

              if (latestErr) return; // keep polling

              const newStatus = latest?.status || 'pending';
              setPaymentStatus(newStatus as 'success' | 'failed' | 'pending');
              setTransactionDetails(latest);

              if (newStatus === 'success') {
                clearInterval(interval);

                // Secondary safety net on polling success
                try {
                  await supabase.functions.invoke('subscription-manager', {
                    body: {
                      action: 'activate',
                      userId: user.id,
                      planId: latest?.plan_id,
                      billingCycle: latest?.billing_cycle || 'monthly',
                      transactionId: latest?.transaction_id
                    }
                  });
                } catch (e) {
                  console.error('Activation invoke error (Polling):', e);
                }

                try {
                  await SubscriptionService.getInstance().updateSubscriptionStatus(
                    user.id,
                    latest?.plan_id,
                    latest?.transaction_id
                  );
                } catch (e) {
                  console.error('Client update error (Polling):', e);
                }

                // Show confetti celebration (toast is shown by the component)
                setShowCongratulations(true);
              } else if (newStatus === 'failed') {
                toast.error('Payment failed during verification.');
                clearInterval(interval);
              } else if (Date.now() - start > 30000) {
                // stop polling after 30s
                clearInterval(interval);
                toast.info('Still processing. You will see updates in Subscription Manager.');
              }
            } catch (error) {
              console.warn('Polling error:', error);
            }
          }, 2000);
        }

      } catch (error) {
        console.error('Payment verification error:', error);
        setPaymentStatus('failed');
        toast.error(error instanceof Error ? error.message : 'Payment verification failed');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'failed':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'pending':
        return <Clock className="w-16 h-16 text-yellow-500" />;
      default:
        return <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />;
    }
  };

  const getStatusTitle = () => {
    switch (paymentStatus) {
      case 'success':
        return 'Payment Successful!';
      case 'failed':
        return 'Payment Failed';
      case 'pending':
        return 'Payment Processing';
      default:
        return 'Verifying Payment...';
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'success':
        return 'Your subscription has been activated successfully. You can now enjoy all premium features.';
      case 'failed':
        return 'Your payment could not be processed. Please try again or contact support if the issue persists.';
      case 'pending':
        return 'Your payment is being processed. You will receive a confirmation once it\'s completed.';
      default:
        return 'Please wait while we verify your payment...';
    }
  };

  const handleContinue = () => {
    const returnPath = searchParams.get('return');
    if (paymentStatus === 'success') {
      setShowCongratulations(true);
    } else if (paymentStatus === 'failed') {
      navigate(returnPath || '/subscription-manager');
    } else {
      navigate(returnPath || '/subscription-manager');
    }
  };

  const handleCloseCongratulations = () => {
    setShowCongratulations(false);
    const returnPath = searchParams.get('return');
    navigate(returnPath || '/subscription-manager');
    // Force refresh subscription data
    window.location.reload();
  };

  const getPlanDisplayName = (planId: string): string => {
    const normalized = planId.toLowerCase();
    if (planId === 'lite' || normalized.includes('lite')) return 'Lite';
    if (planId === 'pro' || normalized.includes('pro')) return 'Pro';
    if (planId === 'free-plan' || normalized.includes('free')) return 'Free Plan';
    return 'Subscription Plan';
  };

  const getPlanFeatures = (planId: string, cycle: string): string[] => {
    const normalized = planId.toLowerCase();
    if (planId === 'lite' || normalized.includes('lite')) {
      return [
        '39 AI identifications per month',
        'Advanced search (249 results limit)',
        'Priority support',
        '1200+ medicines database',
        'PWA offline access'
      ];
    }
    if (planId === 'pro' || normalized.includes('pro')) {
      return [
        '101 AI identifications per month',
        'Advanced search (500 results limit)',
        'Priority support',
        '1200+ medicines database',
        'Layman explanations',
        'History feature (unlimited)',
        'Advanced search filters'
      ];
    }
    if (cycle === 'yearly') {
      return [
        '1200 AI identifications per year',
        '1000+ medicines database',
        'Advanced search & filters',
        'Layman explanations',
        'History feature',
        'Unlimited database searches'
      ];
    }
    return [
      '100 AI identifications per month',
      '1000+ medicines database',
      'Advanced search & filters',
      'Layman explanations',
      'History feature',
      'Unlimited database searches'
    ];
  };

  return (
    <>
      <PurchaseSuccessConfetti
        isOpen={showCongratulations}
        onComplete={handleCloseCongratulations}
        message={`${getPlanDisplayName(transactionDetails?.plan_id || '')} Plan Activated!`}
        subMessage="You now have access to all premium features!"
        duration={4000}
      />

      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle className="text-2xl font-bold">
              {getStatusTitle()}
            </CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              {getStatusMessage()}
            </p>

            {transactionDetails && (
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Transaction Details</h4>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Transaction ID:</span>
                    <span className="font-mono">{transactionDetails.transaction_id}</span>
                  </div>
                  {transactionDetails.amount && (
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span>₹{transactionDetails.amount}</span>
                    </div>
                  )}
                  {transactionDetails.plan_id && (
                    <div className="flex justify-between">
                      <span>Plan:</span>
                      <span className="capitalize">{transactionDetails.plan_id.replace('-', ' ')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`capitalize ${paymentStatus === 'success' ? 'text-green-600' :
                      paymentStatus === 'failed' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                      {paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4">
              <Button
                onClick={handleContinue}
                disabled={isVerifying}
                className="w-full"
                variant={paymentStatus === 'success' ? 'default' : 'outline'}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : paymentStatus === 'success' ? (
                  'Continue to Dashboard'
                ) : paymentStatus === 'failed' ? (
                  'Try Again'
                ) : (
                  'Go to Dashboard'
                )}
              </Button>
            </div>

            {paymentStatus === 'failed' && (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/help')}
                  className="text-xs"
                >
                  Need help? Contact Support
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default PaymentResult;
