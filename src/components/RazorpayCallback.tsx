
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const RazorpayCallback = () => {
  useEffect(() => {
    // Extract parameters from URL
    const params = new URLSearchParams(window.location.search);
    const razorpay_payment_id = params.get('razorpay_payment_id');
    const razorpay_subscription_id = params.get('razorpay_subscription_id');
    const razorpay_signature = params.get('razorpay_signature');
    const plan_name = params.get('plan_name');
    
    // If we have payment info, verify it with our backend
    if (razorpay_payment_id && razorpay_subscription_id) {
      const verifySubscription = async () => {
        try {
          const { data, error } = await supabase.functions.invoke(
            'subscription-management/verify-subscription',
            {
              body: {
                razorpay_payment_id,
                razorpay_subscription_id,
                razorpay_signature,
                plan_name: plan_name || (razorpay_subscription_id.includes('QF1itg') ? 'Advanced' : 'Elite')
              }
            }
          );
          
          if (error) {
            toast.error('Payment verification failed');
            console.error('Payment verification error:', error);
          } else if (data?.success) {
            toast.success(data.message || 'Payment successful!');
          }
          
          // Redirect to subscription page
          window.location.href = '/subscription';
        } catch (error) {
          console.error('Error verifying payment:', error);
          toast.error('Payment verification failed');
          // Redirect to subscription page after a delay
          setTimeout(() => {
            window.location.href = '/subscription';
          }, 2000);
        }
      };
      
      verifySubscription();
    } else {
      // If no payment params, just redirect to subscription page
      window.location.href = '/subscription';
    }
  }, []);
  
  return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-2">Processing your payment...</p>
    </div>
  );
};

export default RazorpayCallback;
