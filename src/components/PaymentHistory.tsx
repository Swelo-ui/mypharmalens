import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download,
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { Tables } from '@/types/database.types';

type PaymentTransaction = Tables<"payment_transactions">;
type TopUpTransaction = Tables<"topup_transactions">;
type SubscriptionHistoryItem = Tables<"user_subscriptions">;

type CombinedTransaction = (PaymentTransaction | TopUpTransaction) & {
  transaction_type: 'subscription' | 'topup';
};

const PaymentHistory: React.FC = () => {
  const { user } = useAuthStatus();
  const [paymentTransactions, setPaymentTransactions] = useState<CombinedTransaction[]>([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('payments');

  const fetchPaymentHistory = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch subscription payment transactions
      const { data: payments, error: paymentsError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (paymentsError) {
        console.error('Error fetching subscription payments:', paymentsError);
      }

      // Fetch top-up transactions
      const { data: topups, error: topupsError } = await supabase
        .from('topup_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (topupsError) {
        console.error('Error fetching top-up transactions:', topupsError);
      }

      // Combine and mark transaction types
      const combined: CombinedTransaction[] = [
        ...(payments || []).map(p => ({ ...p, transaction_type: 'subscription' as const })),
        ...(topups || []).map(t => ({ ...t, transaction_type: 'topup' as const }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPaymentTransactions(combined);

      // Fetch subscription history
      const { data: history, error: historyError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false});

      if (historyError) {
        console.error('Error fetching subscription history:', historyError);
      }

      setSubscriptionHistory(history || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast.error('Failed to load payment history');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPaymentHistory();
    }
  }, [user, fetchPaymentHistory]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Success</Badge>;
      case 'pending':
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'failed':
      case 'failure':
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      case 'cancelled':
      case 'canceled':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cancelled</Badge>;
      default:
        return <Badge className={badgeVariants({ variant: 'outline' })}>{status || 'Unknown'}</Badge>;
    }
  };

  const getPaymentMethodDisplay = (method: string) => {
    if (!method) return 'N/A';
    
    switch (method.toLowerCase()) {
      case 'upi':
        return 'UPI';
      case 'card':
      case 'cc':
      case 'dc':
        return 'Card';
      case 'nb':
        return 'Net Banking';
      case 'wallet':
        return 'Wallet';
      default:
        return method.toUpperCase();
    }
  };

  const getSubscriptionStatusBadge = (status: string, endsAt: string | null) => {
    // Check if subscription is expired based on end date
    const now = new Date();
    const endDate = endsAt ? new Date(endsAt) : null;
    const isExpired = endDate && endDate < now;

    // Override status if subscription has passed its end date
    const effectiveStatus = isExpired ? 'expired' : status;

    switch (effectiveStatus?.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Expired</Badge>;
      case 'inactive':
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cancelled</Badge>;
      default:
        return <Badge className={badgeVariants({ variant: 'outline' })}>{effectiveStatus || 'Unknown'}</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      activated: 'default',
      renewed: 'default',
      cancelled: 'destructive',
      expired: 'secondary',
      upgraded: 'default',
      downgraded: 'secondary'
    };

    const variant = variants[action] ?? 'outline';

    return (
      <Badge className={badgeVariants({ variant })}>
        {action.charAt(0).toUpperCase() + action.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPlanName = (planId: string) => {
    return planId
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please log in to view your payment history.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Payment History</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">View your payment transactions and subscription history</p>
        </div>
        <Button 
          onClick={() => {
            setIsRefreshing(true);
            fetchPaymentHistory().finally(() => setIsRefreshing(false));
          }}
          variant="outline"
          className="flex items-center gap-2"
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payments" className="text-xs sm:text-sm">Payment Transactions</TabsTrigger>
          <TabsTrigger value="subscriptions" className="text-xs sm:text-sm">Subscription History</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-4 sm:p-6 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-sm sm:text-base">Loading payment transactions...</p>
              </CardContent>
            </Card>
          ) : paymentTransactions.length === 0 ? (
            <Card>
              <CardContent className="p-4 sm:p-6 text-center">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm sm:text-base text-gray-600">No payment transactions found.</p>
              </CardContent>
            </Card>
          ) : (
            paymentTransactions.map((transaction) => {
              const isTopUp = transaction.transaction_type === 'topup';
              const transactionTitle = isTopUp
                ? ('pack_name' in transaction ? transaction.pack_name : 'Top-Up Pack')
                : ('plan_id' in transaction ? formatPlanName(transaction.plan_id) : 'Subscription');
              
              return (
              <Card key={transaction.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(transaction.status)}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm sm:text-base truncate">
                            {transactionTitle}
                          </h3>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {isTopUp ? 'Top-Up' : 'Subscription'}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          ID: {transaction.transaction_id}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="font-semibold text-base sm:text-lg">
                        ₹{transaction.amount}
                      </p>
                      <div className="mt-1">
                        {getStatusBadge(transaction.status)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
                    <div className="min-w-0">
                      <p className="text-gray-600 text-xs sm:text-sm">
                        {isTopUp ? 'Identifications' : 'Billing Cycle'}
                      </p>
                      <p className="font-medium capitalize text-sm truncate">
                        {isTopUp
                          ? ('identifications_count' in transaction ? `${transaction.identifications_count} IDs` : '-')
                          : ('billing_cycle' in transaction ? transaction.billing_cycle : '-')}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-600 text-xs sm:text-sm">Payment Method</p>
                      <p className="font-medium capitalize text-sm truncate">{getPaymentMethodDisplay(transaction.payment_method)}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-600 text-xs sm:text-sm">Created</p>
                      <p className="font-medium text-sm truncate">{formatDate(transaction.created_at)}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-gray-600 text-xs sm:text-sm">Completed</p>
                      <p className="font-medium text-sm truncate">
                        {transaction.completed_at 
                          ? formatDate(transaction.completed_at)
                          : 'Pending'
                        }
                      </p>
                    </div>
                  </div>

                  {'error_message' in transaction && transaction.error_message && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs sm:text-sm text-red-700 break-words">
                        <strong>Error:</strong> {transaction.error_message}
                      </p>
                    </div>
                  )}

                  {transaction.razorpay_order_id && (
                    <div className="mt-4 text-xs text-gray-500 break-all">
                      Razorpay Order ID: {transaction.razorpay_order_id}
                    </div>
                  )}
                  {transaction.razorpay_payment_id && (
                    <div className="mt-1 text-xs text-gray-500 break-all">
                      Razorpay Payment ID: {transaction.razorpay_payment_id}
                    </div>
                  )}
                </CardContent>
              </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-4 sm:p-6 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-sm sm:text-base">Loading subscription history...</p>
              </CardContent>
            </Card>
          ) : subscriptionHistory.length === 0 ? (
            <Card>
              <CardContent className="p-4 sm:p-6 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm sm:text-base text-gray-600">No subscription history found.</p>
              </CardContent>
            </Card>
          ) : (
            subscriptionHistory.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm sm:text-base truncate">
                        {formatPlanName(item.plan_id)}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {getSubscriptionStatusBadge(item.status, item.ends_at)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
                    <div className="min-w-0">
                      <p className="text-gray-600 text-xs sm:text-sm">Status</p>
                      <p className="font-medium capitalize text-sm truncate">{item.status}</p>
                    </div>
                    {item.starts_at && (
                      <div className="min-w-0">
                        <p className="text-gray-600 text-xs sm:text-sm">Starts</p>
                        <p className="font-medium text-sm truncate">{formatDate(item.starts_at)}</p>
                      </div>
                    )}
                    {item.ends_at && (
                      <div className="min-w-0">
                        <p className="text-gray-600 text-xs sm:text-sm">Ends</p>
                        <p className="font-medium text-sm truncate">{formatDate(item.ends_at)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentHistory;
