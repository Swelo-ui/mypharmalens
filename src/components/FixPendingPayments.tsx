import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { RefreshCw, Loader2 } from 'lucide-react';

const FixPendingPayments: React.FC = () => {
  const { user } = useAuthStatus();
  const [isFixing, setIsFixing] = useState(false);

  const fixPendingPayments = async () => {
    if (!user) return;

    setIsFixing(true);
    try {
      // Get all pending transactions for this user
      const { data: pendingTransactions, error } = await supabase
        .from('topup_transactions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch pending transactions: ${error.message}`);
      }

      if (!pendingTransactions || pendingTransactions.length === 0) {
        toast.info('No pending payments found');
        return;
      }

      console.log(`Found ${pendingTransactions.length} pending transactions`, pendingTransactions);

      let fixedCount = 0;
      let errorCount = 0;

      for (const transaction of pendingTransactions) {
        if (transaction.razorpay_order_id) {
          try {
            console.log(`Attempting to fix transaction: ${transaction.transaction_id}`);
            
            const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('verify-payment', {
              body: {
                razorpay_order_id: transaction.razorpay_order_id,
                razorpay_payment_id: transaction.razorpay_payment_id
              }
            });

            if (verifyError) {
              console.error(`Verification failed for ${transaction.transaction_id}:`, verifyError);
              errorCount++;
            } else if (verifyResult?.success) {
              console.log(`Successfully fixed transaction: ${transaction.transaction_id}`);
              fixedCount++;
            } else {
              console.warn(`Transaction not processed: ${transaction.transaction_id}`, verifyResult);
            }
          } catch (err) {
            console.error(`Error processing transaction ${transaction.transaction_id}:`, err);
            errorCount++;
          }
        }
      }

      if (fixedCount > 0) {
        toast.success(`Fixed ${fixedCount} pending payments! 🎉`, {
          description: `${fixedCount} transactions have been processed successfully.`,
          duration: 5000
        });
        
        // Refresh the page to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else if (errorCount > 0) {
        toast.error(`Failed to fix pending payments`, {
          description: `${errorCount} transactions could not be processed. Please contact support.`,
          duration: 7000
        });
      } else {
        toast.info('All transactions are already processed or invalid');
      }

    } catch (error) {
      console.error('Error fixing pending payments:', error);
      toast.error('Failed to fix pending payments', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsFixing(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={fixPendingPayments}
        disabled={isFixing}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        {isFixing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {isFixing ? 'Fixing...' : 'Fix Pending'}
      </Button>
    </div>
  );
};

export default FixPendingPayments;
