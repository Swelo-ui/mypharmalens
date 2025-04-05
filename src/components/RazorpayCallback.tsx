
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const RazorpayCallback = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Extract parameters from URL
    const params = new URLSearchParams(window.location.search);
    const razorpay_payment_id = params.get('razorpay_payment_id');
    const razorpay_subscription_id = params.get('razorpay_subscription_id');
    const razorpay_signature = params.get('razorpay_signature');
    const plan_name = params.get('plan_name') || getPlanNameFromSubscriptionId(razorpay_subscription_id);
    
    console.log('Razorpay callback params:', { 
      razorpay_payment_id, 
      razorpay_subscription_id, 
      razorpay_signature, 
      plan_name 
    });
    
    // If we have payment info, verify it with our backend
    if (razorpay_payment_id && razorpay_subscription_id) {
      const verifySubscription = async () => {
        try {
          setIsProcessing(true);
          setError(null);
          
          const { data, error } = await supabase.functions.invoke(
            'subscription-management/verify-subscription',
            {
              body: {
                razorpay_payment_id,
                razorpay_subscription_id,
                razorpay_signature,
                plan_name
              }
            }
          );
          
          if (error) {
            setError('Payment verification failed: ' + error.message);
            toast.error('Payment verification failed');
            console.error('Payment verification error:', error);
            
            // Still redirect after a delay
            setTimeout(() => {
              navigate('/subscription');
            }, 3000);
          } else if (data?.success) {
            toast.success(data.message || 'Payment successful!');
            
            // Redirect to subscription page
            setTimeout(() => {
              navigate('/subscription');
            }, 1500);
          } else {
            setError('Unexpected response from server');
            toast.error('Payment verification failed');
            
            // Still redirect after a delay
            setTimeout(() => {
              navigate('/subscription');
            }, 3000);
          }
        } catch (error: any) {
          console.error('Error verifying payment:', error);
          setError('Payment verification failed: ' + error.message);
          toast.error('Payment verification failed');
          
          // Redirect to subscription page after a delay
          setTimeout(() => {
            navigate('/subscription');
          }, 3000);
        } finally {
          setIsProcessing(false);
        }
      };
      
      verifySubscription();
    } else {
      // If no payment params, just redirect to subscription page
      setError('No payment information found');
      setTimeout(() => {
        navigate('/subscription');
      }, 1500);
    }
  }, [navigate]);
  
  // Helper function to determine plan name from subscription ID
  const getPlanNameFromSubscriptionId = (subscriptionId: string | null) => {
    if (!subscriptionId) return 'Advanced'; // Default to Advanced if no ID
    
    if (subscriptionId.includes('QF1itg')) {
      return 'Advanced';
    } else if (subscriptionId.includes('QFGGMMuM37x0Sp')) {
      return 'Elite';
    }
    
    return 'Advanced'; // Default to Advanced
  };
  
  // Handle manual navigation
  const handleNavigateToSubscription = () => {
    navigate('/subscription');
  };
  
  return (
    <div className="flex flex-col justify-center items-center h-screen p-4">
      {isProcessing ? (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-center text-lg">Processing your payment...</p>
          <p className="text-center text-sm text-gray-500 mt-2">Please wait while we verify your subscription.</p>
        </>
      ) : (
        <>
          {error ? (
            <div className="w-full max-w-md">
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <p className="text-center mb-4">You will be redirected to the subscription page shortly.</p>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-xl font-bold text-green-600 mb-2">Payment Successful!</h2>
              <p className="mb-4">Your subscription has been activated successfully.</p>
            </div>
          )}
          <Button onClick={handleNavigateToSubscription}>
            Go to Subscription Page
          </Button>
        </>
      )}
    </div>
  );
};

export default RazorpayCallback;
