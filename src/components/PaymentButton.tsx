import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Shield, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { SubscriptionPlan } from '@/hooks/useSubscription';

interface PaymentButtonProps {
  plan: SubscriptionPlan;
  isCurrentPlan?: boolean;
  onPaymentSuccess?: (planId: string) => void;
  onPaymentError?: (error: string) => void;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  plan,
  isCurrentPlan = false,
  onPaymentSuccess,
  onPaymentError
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (isCurrentPlan) {
      toast.info('You are already on this plan');
      return;
    }

    if (plan.id === 'free-plan') {
      toast.success('You are already on the Free Plan!');
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // TODO: Integrate with actual payment gateway (Razorpay)
      // This is where you would:
      // 1. Create order with Razorpay
      // 2. Open Razorpay checkout
      // 3. Handle payment success/failure
      // 4. Update user subscription in database

      toast.info('Payment gateway integration coming soon! Contact support for premium access.');
      
      // For now, simulate success for demo purposes
      // onPaymentSuccess?.(plan.id);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      toast.error(errorMessage);
      onPaymentError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonText = () => {
    if (isCurrentPlan) return 'Current Plan';
    if (plan.id === 'free-plan') return 'Get Started Free';
    if (isProcessing) return 'Processing...';
    return `Upgrade to ${plan.name}`;
  };

  const getButtonVariant = () => {
    if (isCurrentPlan) return 'secondary';
    if (plan.id === 'free-plan') return 'outline';
    return 'default';
  };

  return (
    <div className="space-y-4">
      {/* Payment Security Info */}
      {plan.id !== 'free-plan' && !isCurrentPlan && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <Shield className="w-4 h-4" />
              <span className="font-medium">Secure Payment</span>
            </div>
            <p className="text-green-600 text-xs mt-1">
              256-bit SSL encryption • PCI DSS compliant • Razorpay secured
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Payment Button */}
      <Button
        onClick={handlePayment}
        disabled={isCurrentPlan || isProcessing}
        className={`w-full ${
          plan.id === 'monthly-premium-plan' && !isCurrentPlan
            ? 'bg-pharma-600 hover:bg-pharma-700 text-white' 
            : ''
        }`}
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
            {!isCurrentPlan && plan.id !== 'free-plan' && (
              <CreditCard className="w-4 h-4 mr-2" />
            )}
            {isCurrentPlan && <CheckCircle className="w-4 h-4 mr-2" />}
            {getButtonText()}
          </>
        )}
      </Button>

      {/* Payment Methods Info */}
      {plan.id !== 'free-plan' && !isCurrentPlan && (
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">Accepted payment methods:</p>
          <div className="flex justify-center items-center gap-2 text-xs text-gray-400">
            <Badge variant="outline" className="text-xs">UPI</Badge>
            <Badge variant="outline" className="text-xs">Cards</Badge>
            <Badge variant="outline" className="text-xs">Net Banking</Badge>
            <Badge variant="outline" className="text-xs">Wallets</Badge>
          </div>
        </div>
      )}

      {/* Billing Info */}
      {plan.id !== 'free-plan' && !isCurrentPlan && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
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

      {/* Development Notice */}
      {plan.id !== 'free-plan' && !isCurrentPlan && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-orange-700">
              <p className="font-medium">Development Notice</p>
              <p className="mt-1">
                Payment gateway integration is in progress. Contact support for early access to premium features.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentButton;