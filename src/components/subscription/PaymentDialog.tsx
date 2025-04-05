
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Plan {
  id: string;
  name: string;
  description: string;
  price_inr: number;
  monthly_identifications: number;
  features: string[];
  subscription_button_id?: string;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlan: Plan | null;
}

const PaymentDialog = ({ open, onOpenChange, selectedPlan }: PaymentDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Subscription</DialogTitle>
          <DialogDescription>
            Make a secure payment using Razorpay to activate your subscription.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {selectedPlan && (
            <>
              <div className="flex justify-between">
                <span className="font-medium">{selectedPlan.name} Plan</span>
                <span>₹{selectedPlan.price_inr}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{selectedPlan.price_inr}</span>
                </div>
              </div>
              
              {/* Render the appropriate Razorpay button */}
              <div className="mt-6">
                {selectedPlan.name === 'Advanced' && (
                  <form>
                    <script 
                      src="https://cdn.razorpay.com/static/widget/subscription-button.js" 
                      data-subscription_button_id="pl_QF1itg7gdfQFbF" 
                      data-button_theme="brand-color"
                      async
                    ></script>
                  </form>
                )}
                
                {selectedPlan.name === 'Elite' && (
                  <form>
                    <script 
                      src="https://cdn.razorpay.com/static/widget/subscription-button.js" 
                      data-subscription_button_id="pl_QFGGMMuM37x0Sp" 
                      data-button_theme="brand-color"
                      async
                    ></script>
                  </form>
                )}
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
