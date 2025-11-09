import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import PaymentHistory from '@/components/PaymentHistory';
import { Calendar, CreditCard, Info, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';

const AccountSubscription: React.FC = () => {
  const { currentSubscription, usageStats, loading } = useSubscription();
  const { user } = useAuthStatus();
  const navigate = useNavigate();
  const [extraIdentifications, setExtraIdentifications] = useState(0);

  useEffect(() => {
    const fetchExtraIdentifications = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('extra_identifications')
          .eq('id', user.id)
          .single();
        
        if (!error && data) {
          setExtraIdentifications(data.extra_identifications || 0);
        }
      }
    };
    
    if (user) {
      fetchExtraIdentifications();
    }
  }, [user]);

  const formatDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : '—');
  const isFree = currentSubscription?.plan?.id === 'free-plan';
  const endDisplay = isFree ? 'No expiration' : formatDate(currentSubscription?.ends_at);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 md:px-8 pt-20 sm:pt-24 pb-12">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card className="border-0 sm:border shadow-none sm:shadow-sm">
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>Overview of your active plan and usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading subscription and usage...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border bg-muted/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4" />
                      <span className="font-medium">Current Plan</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><span className="text-gray-600">Plan:</span> {currentSubscription?.plan?.name || 'Free'}</p>
                      <p><span className="text-gray-600">Status:</span> {currentSubscription?.status || 'active'}</p>
                      <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> <span className="text-gray-600">Start:</span> {formatDate(currentSubscription?.starts_at || currentSubscription?.created_at)}</p>
                      <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> <span className="text-gray-600">End:</span> {endDisplay}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border bg-muted/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4" />
                      <span className="font-medium">AI Identifications Usage</span>
                    </div>
                    <div className="text-sm space-y-2">
                      <p>Total Used: <span className="font-semibold">{usageStats.identificationsUsed}</span>{usageStats.monthlyLimit >= 0 ? ` / ${(() => {
                        const planName = usageStats.planName || 'Free';
                        let monthlyLimit = 5;
                        if (planName === 'Free' || planName.toLowerCase().includes('free')) {
                          monthlyLimit = 5;
                        } else if (planName === 'Lite' || planName.toLowerCase().includes('lite')) {
                          monthlyLimit = 39;
                        } else if (planName === 'Pro' || planName.toLowerCase().includes('pro')) {
                          monthlyLimit = 101;
                        }
                        return monthlyLimit + extraIdentifications;
                      })()}` : ' (Unlimited)'}
                      </p>
                      {extraIdentifications > 0 && (
                        <p className={`text-xs flex items-center gap-1 ${
                          extraIdentifications >= 50 ? 'text-violet-600 dark:text-violet-400' :
                          extraIdentifications >= 30 ? 'text-green-600 dark:text-green-400' :
                          extraIdentifications >= 10 ? 'text-blue-600 dark:text-blue-400' :
                          extraIdentifications >= 5 ? 'text-amber-600 dark:text-amber-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          <span className="inline-block">⚡</span>{extraIdentifications} bonus remaining
                        </p>
                      )}
                      {usageStats.monthlyLimit >= 0 && (
                        <div className="w-full h-2 bg-gray-200 rounded">
                          <div className="h-2 bg-[#0384c6] rounded" style={{ width: `${Math.min(100, (usageStats.identificationsUsed / Math.max((() => {
                            const planName = usageStats.planName || 'Free';
                            let monthlyLimit = 5;
                            if (planName === 'Free' || planName.toLowerCase().includes('free')) {
                              monthlyLimit = 5;
                            } else if (planName === 'Lite' || planName.toLowerCase().includes('lite')) {
                              monthlyLimit = 39;
                            } else if (planName === 'Pro' || planName.toLowerCase().includes('pro')) {
                              monthlyLimit = 101;
                            }
                            return monthlyLimit + extraIdentifications;
                          })(), 1)) * 100)}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <Button variant="outline" onClick={() => navigate('/payment-history')}>View Purchase History</Button>
                <Button variant="outline" onClick={() => navigate('/subscription')}>Manage Subscription</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 sm:border shadow-none sm:shadow-sm">
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
              <CardDescription>Your recent transactions and billing cycles</CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentHistory />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AccountSubscription;