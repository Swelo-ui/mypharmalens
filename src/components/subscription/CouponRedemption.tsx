
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Check, Loader2, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface CouponRedemptionProps {
  onSuccess?: () => void;
}

const CouponRedemption = ({ onSuccess }: CouponRedemptionProps) => {
  const [couponCode, setCouponCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRedeemCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }
    
    try {
      setIsRedeeming(true);
      setError(null);
      setSuccessMessage(null);
      
      const { data, error } = await supabase.functions.invoke('subscription-management/redeem-coupon', {
        body: { couponCode: couponCode.trim() }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data.success) {
        setError(data.message || 'Failed to redeem coupon');
        return;
      }
      
      // Success!
      setSuccessMessage(data.message);
      setCouponCode('');
      toast.success(data.message);
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      toast.error('Failed to redeem coupon');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 shadow-sm">
      <h3 className="text-lg font-medium mb-3">Redeem Coupon</h3>
      
      {successMessage && (
        <Alert className="mb-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600 dark:text-green-400">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <AlertDescription className="text-red-600 dark:text-red-400">
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleRedeemCoupon} className="flex items-center gap-2">
        <div className="relative flex-grow">
          <Input
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="pr-10"
          />
          <Ticket className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        <Button 
          type="submit" 
          disabled={isRedeeming || !couponCode.trim()}
          className="whitespace-nowrap"
        >
          {isRedeeming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Redeem
        </Button>
      </form>
    </div>
  );
};

export default CouponRedemption;
