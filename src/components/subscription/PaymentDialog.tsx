
import React, { useEffect, useRef } from 'react';
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
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  
  // Effect to render the Razorpay button when the dialog opens and plan is selected
  useEffect(() => {
    if (open && selectedPlan && buttonContainerRef.current) {
      // Clear any existing content first
      buttonContainerRef.current.innerHTML = '';
      
      if (selectedPlan.subscription_button_id) {
        // Create the form and script elements for the button
        const form = document.createElement('form');
        const script = document.createElement('script');
        
        // Set attributes for the script
        script.src = 'https://cdn.razorpay.com/static/widget/subscription-button.js';
        script.setAttribute('data-subscription_button_id', selectedPlan.subscription_button_id);
        script.setAttribute('data-button_theme', 'brand-color');
        script.async = true;
        
        // Append script to form and form to container
        form.appendChild(script);
        buttonContainerRef.current.appendChild(form);
        
        // Log for debugging
        console.log(`Rendering Razorpay button for plan: ${selectedPlan.name} with ID: ${selectedPlan.subscription_button_id}`);
      }
    }
  }, [open, selectedPlan]);

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
              
              {/* Razorpay button container */}
              <div className="mt-6">
                <div ref={buttonContainerRef} className="razorpay-button-container"></div>
                
                {/* Fallback if button doesn't load properly */}
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-500 mb-2">
                    If the payment button doesn't appear, please try the direct link below:
                  </p>
                  {selectedPlan.name === 'Advanced' && (
                    <a 
                      href="https://rzp.io/l/pl_QF1itg7gdfQFbF" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Pay for Advanced Plan (₹299/month)
                    </a>
                  )}
                  {selectedPlan.name === 'Elite' && (
                    <a 
                      href="https://rzp.io/l/pl_QFGGMMuM37x0Sp" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Pay for Elite Plan (₹599/month)
                    </a>
                  )}
                </div>
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
