import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const PaymentResult: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending' | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const transactionId = searchParams.get('txnid');
        const status = searchParams.get('status');
        const payuPaymentId = searchParams.get('mihpayid');
        const amount = searchParams.get('amount');
        const hash = searchParams.get('hash');

        if (!transactionId) {
          throw new Error('Invalid payment response');
        }

        // Verify payment with backend
        const { data, error } = await supabase.functions.invoke('payu-payment', {
          body: {
            action: 'verify_payment',
            transactionId,
            status,
            payuPaymentId,
            amount,
            hash,
            allParams: Object.fromEntries(searchParams.entries())
          }
        });

        if (error) {
          throw new Error(error.message || 'Payment verification failed');
        }

        setPaymentStatus(data.status);
        setTransactionDetails(data.transaction);

        // Show appropriate toast message
        if (data.status === 'success') {
          toast.success('Payment successful! Your subscription has been activated.');
          // Auto-redirect back to Subscription Manager for clear confirmation
    setTimeout(() => navigate('/subscription-manager'), 2000);
        } else if (data.status === 'failed') {
          toast.error('Payment failed. Please try again.');
        } else {
          toast.info('Payment is being processed. You will be notified once completed.');
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
    if (paymentStatus === 'success') {
      navigate('/dashboard');
    } else if (paymentStatus === 'failed') {
      navigate('/subscription-manager');
    } else {
      navigate('/dashboard');
    }
  };

  return (
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
                  <span className={`capitalize ${
                    paymentStatus === 'success' ? 'text-green-600' :
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
  );
};

export default PaymentResult;