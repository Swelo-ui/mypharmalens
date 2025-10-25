import React, { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { Tables } from '@/types/database.types';

type PaymentTransaction = Tables<"payment_transactions">;
type SubscriptionHistoryItem = Tables<"user_subscriptions">;


const PaymentHistory: React.FC = () => {
  const { user } = useAuthStatus();
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('payments');

  useEffect(() => {
    if (user) {
      fetchPaymentHistory();
    }
  }, [user]);

  const fetchPaymentHistory = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch payment transactions
      const { data: payments, error: paymentsError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (paymentsError) {
        throw paymentsError;
      }

      // Fetch subscription history
      const { data: history, error: historyError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (historyError) {
        throw historyError;
      }

      setPaymentTransactions(payments || []);
      setSubscriptionHistory(history || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast.error('Failed to load payment history');
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment History</h2>
          <p className="text-gray-600">View your payment transactions and subscription history</p>
        </div>
        <Button
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
          onClick={fetchPaymentHistory}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payments">Payment Transactions</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscription History</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p>Loading payment transactions...</p>
              </CardContent>
            </Card>
          ) : paymentTransactions.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No payment transactions found.</p>
              </CardContent>
            </Card>
          ) : (
            paymentTransactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(transaction.status)}
                      <div>
                        <h3 className="font-semibold">
                          {formatPlanName(transaction.plan_id)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Transaction ID: {transaction.transaction_id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        ₹{transaction.amount}
                      </p>
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Billing Cycle</p>
                      <p className="font-medium capitalize">{transaction.billing_cycle}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Payment Method</p>
                      <p className="font-medium capitalize">{transaction.payment_method}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Created</p>
                      <p className="font-medium">{formatDate(transaction.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Completed</p>
                      <p className="font-medium">
                        {transaction.completed_at 
                          ? formatDate(transaction.completed_at)
                          : 'Pending'
                        }
                      </p>
                    </div>
                  </div>

                  {transaction.error_message && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        <strong>Error:</strong> {transaction.error_message}
                      </p>
                    </div>
                  )}

                  {transaction.payu_payment_id && (
                    <div className="mt-4 text-xs text-gray-500">
                      PayU Payment ID: {transaction.payu_payment_id}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p>Loading subscription history...</p>
              </CardContent>
            </Card>
          ) : subscriptionHistory.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No subscription history found.</p>
              </CardContent>
            </Card>
          ) : (
            subscriptionHistory.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">
                        {formatPlanName(item.plan_id)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      {getActionBadge(item.status)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Status</p>
                      <p className="font-medium capitalize">{item.status}</p>
                    </div>
                    {item.starts_at && (
                      <div>
                        <p className="text-gray-600">Starts</p>
                        <p className="font-medium">{formatDate(item.starts_at)}</p>
                      </div>
                    )}
                    {item.ends_at && (
                      <div>
                        <p className="text-gray-600">Ends</p>
                        <p className="font-medium">{formatDate(item.ends_at)}</p>
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