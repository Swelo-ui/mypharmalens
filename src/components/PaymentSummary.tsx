import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Crown, Zap, Shield, Clock, IndianRupee, Tag, Gift } from 'lucide-react';

interface PaymentSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  planName: string;
  planPrice: number;
  originalPrice?: number;
  features: string[];
  identificationsLimit: number;
  searchLimit?: number;
  billingCycle?: 'monthly' | 'yearly';
  isProcessing?: boolean;
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  isOpen,
  onClose,
  onConfirm,
  planName,
  planPrice,
  originalPrice,
  features,
  identificationsLimit,
  searchLimit,
  billingCycle = 'monthly',
  isProcessing = false
}) => {
  const hasDiscount = originalPrice && originalPrice > planPrice;
  const discountAmount = hasDiscount ? originalPrice - planPrice : 0;
  const discountPercentage = hasDiscount ? Math.round((discountAmount / originalPrice) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Crown className="h-5 w-5 text-pharma-600" />
            Payment Summary
          </DialogTitle>
          <DialogDescription>
            Review your subscription details before proceeding
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plan Card */}
          <Card className="border-pharma-200 dark:border-pharma-800 bg-gradient-to-br from-pharma-50 to-pharma-100 dark:from-pharma-900/20 dark:to-pharma-800/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-pharma-900 dark:text-pharma-100">
                    {planName}
                  </h3>
                  <p className="text-sm text-pharma-700 dark:text-pharma-300 capitalize">
                    {billingCycle} subscription
                  </p>
                </div>
                {hasDiscount && (
                  <Badge className="bg-green-500 text-white">
                    Save {discountPercentage}%
                  </Badge>
                )}
              </div>

              {/* Identification Limit */}
              <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                <Zap className="h-4 w-4 text-pharma-600" />
                <span className="text-sm font-medium">
                  {identificationsLimit} AI identifications/month
                </span>
              </div>

              {/* Search Limit */}
              {searchLimit && (
                <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-pharma-600" />
                  <span className="text-sm font-medium">
                    Advanced search up to {searchLimit} results
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features List */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Included Features
            </h4>
            <div className="max-h-32 overflow-y-auto pr-2 space-y-1.5">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300 leading-tight">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Pricing Breakdown */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Pricing Details
            </h4>

            <div className="space-y-2">
              {/* Original Price */}
              {hasDiscount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Original Price</span>
                  <span className="line-through text-gray-400">₹{originalPrice}</span>
                </div>
              )}

              {/* Discount */}
              {hasDiscount && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" />
                    Discount ({discountPercentage}% OFF)
                  </span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    -₹{discountAmount}
                  </span>
                </div>
              )}

              <Separator />

              {/* Subtotal */}
              <div className="flex justify-between text-sm font-medium">
                <span>Subtotal</span>
                <span>₹{planPrice}</span>
              </div>

              {/* Taxes & Fees */}
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Taxes & Fees</span>
                <span>Included</span>
              </div>

              <Separator className="my-2" />

              {/* Grand Total */}
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount</span>
                <span className="text-pharma-600 dark:text-pharma-400">₹{planPrice}</span>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Billed {billingCycle}
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Info */}
          <div className="space-y-2">
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700 dark:text-blue-200">
                <p className="font-medium">Secure Payment</p>
                <p className="mt-1">Processed via Razorpay. Your data is encrypted and secure.</p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-700 dark:text-amber-200">
                <p className="font-medium">Instant Activation</p>
                <p className="mt-1">Your subscription activates immediately after payment.</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isProcessing}
            className="w-full sm:w-auto bg-pharma-600 hover:bg-pharma-700"
          >
            {isProcessing ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Proceed to Payment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentSummary;
