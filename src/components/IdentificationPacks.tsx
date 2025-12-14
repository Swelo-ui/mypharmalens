import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Check, Loader2, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import PurchaseSuccessConfetti from '@/components/PurchaseSuccessConfetti';

interface IdentificationPack {
  id: string;
  name: string;
  description: string;
  identifications_count: number;
  price_inr: number;
  is_active: boolean;
}

const IdentificationPacks: React.FC = () => {
  const { user } = useAuthStatus();
  const [packs, setPacks] = useState<IdentificationPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [extraIdentifications, setExtraIdentifications] = useState(0);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [congratsPack, setCongratsPack] = useState<IdentificationPack | null>(null);

  useEffect(() => {
    if (user) {
      fetchPacks();
      fetchExtraIdentifications();
    }
  }, [user]);

  const fetchPacks = async () => {
    try {
      // Try to fetch from database first, fallback to mock data
      try {
        const { data: packsData, error: packsError } = await supabase
          .from('identification_packs')
          .select('*')
          .eq('is_active', true)
          .order('price_inr', { ascending: true });

        if (packsError) throw packsError;

        setPacks((packsData as any[]) || []);
      } catch (dbError) {
        console.log('Database table not ready, using mock data');
      }

      // Fallback to mock data
      const mockPacks = [
        {
          id: 'pack-1',
          name: 'Starter Pack',
          description: '5 extra AI identifications',
          identifications_count: 5,
          price_inr: 10.00,
          is_active: true
        },
        {
          id: 'pack-2',
          name: 'Basic Pack',
          description: '10 extra AI identifications',
          identifications_count: 10,
          price_inr: 20.00,
          is_active: true
        },
        {
          id: 'pack-3',
          name: 'Value Pack',
          description: '20 extra AI identifications',
          identifications_count: 20,
          price_inr: 30.00,
          is_active: true
        }
      ];

      setPacks(mockPacks);
    } catch (error) {
      console.error('Error fetching packs:', error);
      toast.error('Failed to load identification packs');
    } finally {
      setLoading(false);
    }
  };

  const fetchExtraIdentifications = async () => {
    if (!user) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('extra_identifications')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setExtraIdentifications(profile?.extra_identifications || 0);
    } catch (error) {
      console.error('Error fetching extra identifications:', error);
      setExtraIdentifications(0);
    }
  };

  const handlePurchase = async (pack: IdentificationPack) => {
    if (!user) {
      toast.error('Please log in to purchase');
      return;
    }

    setPurchasing(pack.id);

    try {
      // First, create a top-up transaction record
      const transactionId = `pack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { error: txError } = await supabase
        .from('topup_transactions')
        .insert({
          transaction_id: transactionId,
          user_id: user.id,
          pack_id: pack.id,
          pack_name: pack.name,
          identifications_count: pack.identifications_count,
          amount: pack.price_inr,
          currency: 'INR',
          status: 'pending',
          payment_method: 'razorpay',
          payment_gateway: 'razorpay',
          metadata: {
            type: 'identification_pack',
            price_inr: pack.price_inr
          }
        });

      if (txError) {
        console.error('Transaction creation error:', txError);
        throw new Error(`Failed to initialize payment: ${txError.message}`);
      }

      console.log('Top-up transaction created:', transactionId);

      // Create Razorpay order
      const { data: orderData, error: orderError } = await supabase.functions.invoke('razorpay-order', {
        body: {
          amount: pack.price_inr,
          currency: 'INR',
          receipt: transactionId,
          notes: {
            user_id: user.id,
            pack_id: pack.id,
            identifications_count: pack.identifications_count,
            type: 'identification_pack',
            transaction_id: transactionId
          }
        }
      });

      if (orderError) {
        console.error('Razorpay order error:', orderError);
        throw new Error(orderError.message || 'Failed to create Razorpay order');
      }

      if (!orderData || !orderData.order_id) {
        console.error('Invalid order response:', orderData);
        throw new Error('Invalid order response from Razorpay');
      }

      console.log('Razorpay order created successfully:', orderData.order_id);

      // Update transaction with Razorpay order ID - MUST WAIT!
      const { error: updateOrderError } = await supabase
        .from('topup_transactions')
        .update({
          razorpay_order_id: orderData.order_id,
          updated_at: new Date().toISOString()
        })
        .eq('transaction_id', transactionId);

      if (updateOrderError) {
        console.error('Failed to update transaction with order_id:', updateOrderError);
        throw new Error(`Failed to save order details: ${updateOrderError.message}`);
      }

      console.log('Transaction updated with order_id:', orderData.order_id);

      // Initialize Razorpay using server-provided fields
      let razorpay: any;
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'PharmaLens',
        description: pack.name,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            console.log('✅ Payment successful! Razorpay response:', {
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature ? 'present' : 'missing'
            });

            // Update transaction with payment details
            console.log('Updating transaction with payment details...');
            const { error: updateError, data: updatedTx } = await supabase
              .from('topup_transactions')
              .update({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                status: 'processing',
                updated_at: new Date().toISOString()
              })
              .eq('razorpay_order_id', response.razorpay_order_id)
              .select()
              .single();

            if (updateError) {
              console.error('❌ Failed to update transaction:', updateError);
              throw new Error('Failed to record payment details');
            }

            console.log('✅ Transaction updated:', updatedTx);

            // Show processing message
            const processingToast = toast.loading('Processing payment instantly...', {
              description: 'Verifying and adding identifications to your account'
            });

            try {
              // INSTANT PROCESSING: Call verify-payment immediately
              console.log('⚡ Calling verify-payment for instant processing...');

              const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('verify-payment', {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id
                }
              });

              toast.dismiss(processingToast);

              if (verifyError) {
                console.error('❌ Verification error:', verifyError);
                const message = (verifyError as any)?.message || 'Payment verification failed';
                // Gracefully handle non-captured payments (HTTP 400 from verify-payment)
                if (message.toLowerCase().includes('payment not captured')) {
                  toast.error('Payment not captured — please retry.', {
                    description: 'No money should be captured for this attempt. You can safely try again.'
                  });
                  setPurchasing(null);
                  return;
                }
                throw new Error(message);
              }

              if (verifyResult?.success) {
                console.log('✅ Payment processed instantly!', verifyResult);

                // Fetch updated balance
                await fetchExtraIdentifications();

                // Show instant success confetti
                setCongratsPack(pack);
                setShowCongratulations(true);

                setPurchasing(null);
              } else {
                throw new Error(verifyResult?.message || 'Payment processing failed');
              }
            } catch (instantError) {
              console.warn('⚠️ Instant verification failed, trying webhook fallback...', instantError);

              // FALLBACK: Quick check if webhook already processed
              let attempts = 0;
              const maxAttempts = 3; // Only 3 quick attempts
              const pollInterval = 2000; // 2 seconds

              const quickCheck = async () => {
                attempts++;
                console.log(`🔄 Quick check (${attempts}/${maxAttempts})`);

                const { data: transaction } = await supabase
                  .from('topup_transactions')
                  .select('status')
                  .eq('razorpay_order_id', response.razorpay_order_id)
                  .single();

                if (transaction?.status === 'success') {
                  toast.dismiss(processingToast);
                  await fetchExtraIdentifications();
                  setCongratsPack(pack);
                  setShowCongratulations(true);
                  setPurchasing(null);
                  return true;
                }

                if (attempts < maxAttempts) {
                  setTimeout(quickCheck, pollInterval);
                } else {
                  toast.dismiss(processingToast);
                  toast.info('Payment is being processed', {
                    description: 'Your payment was successful. Identifications will be added shortly. Please refresh in a moment.',
                    duration: 6000
                  });
                  setPurchasing(null);
                }
              };

              setTimeout(quickCheck, 1000);
            }

          } catch (error) {
            console.error('Payment processing error:', error);
            toast.error('Payment processing failed', {
              description: error instanceof Error ? error.message : 'Please contact support if amount was deducted'
            });
            setPurchasing(null);
          }
        },
        prefill: {
          email: user.email,
        },
        theme: {
          color: '#0384c6'
        },
        modal: {
          ondismiss: () => {
            setPurchasing(null);
            document.body.style.overflow = '';
          }
        }
      };

      // Check if Razorpay SDK is loaded
      if (!(window as any).Razorpay) {
        toast.error('Payment system is loading. Please try again in a moment.');
        setPurchasing(null);
        return;
      }

      razorpay = new (window as any).Razorpay(options);

      razorpay.on('payment.failed', (response: any) => {
        console.error('Razorpay payment failed:', response);
        const errorMsg = response?.error?.description || 'Payment failed. Please try again.';
        toast.error(errorMsg);
        setPurchasing(null);
        document.body.style.overflow = '';
      });

      razorpay.open();
    } catch (error: any) {
      console.error('Error creating order:', error);
      const errorMessage = error?.message || 'Failed to create order. Please try again.';
      toast.error(errorMessage);
      setPurchasing(null);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <PurchaseSuccessConfetti
        isOpen={showCongratulations}
        onComplete={() => setShowCongratulations(false)}
        message="Top-Up Successful!"
        subMessage={`${congratsPack?.identifications_count || 0} AI identifications added to your account!`}
        duration={4000}
      />

      <div className="space-y-4">
        {/* Identification Packs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Top-Up Identification Packs
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Need more AI identifications? Purchase a top-up pack instantly!
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packs.map((pack) => (
                  <Card
                    key={pack.id}
                    className="relative hover:shadow-lg transition-all border-2 hover:border-blue-300"
                  >
                    <CardHeader className="text-center pb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-3">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-lg">{pack.name}</CardTitle>
                      <p className="text-sm text-gray-600">{pack.description}</p>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          ₹{pack.price_inr}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {pack.identifications_count} identifications
                        </div>
                        <div className="text-xs text-green-600 font-semibold mt-2">
                          ₹{(pack.price_inr / pack.identifications_count).toFixed(1)} per identification
                        </div>
                      </div>

                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>Instant activation</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>Valid for 1 year</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>Use anytime</span>
                        </li>
                      </ul>

                      <Button
                        className="w-full"
                        onClick={() => handlePurchase(pack)}
                        disabled={purchasing === pack.id}
                      >
                        {purchasing === pack.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Buy Now
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default IdentificationPacks;
