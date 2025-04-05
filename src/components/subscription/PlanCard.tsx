
import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Plan {
  id: string;
  name: string;
  description: string;
  price_inr: number;
  monthly_identifications: number;
  features: string[];
  razorpay_plan_id?: string;
  subscription_button_id?: string;
}

interface PlanCardProps {
  plan: Plan;
  isActive: boolean;
  processingPayment: boolean;
  selectedPlan: Plan | null;
  onSelectPlan: (plan: Plan) => void;
}

const PlanCard = ({ plan, isActive, processingPayment, selectedPlan, onSelectPlan }: PlanCardProps) => {
  return (
    <div 
      className={`border rounded-lg overflow-hidden ${
        isActive 
          ? 'border-primary border-2 bg-primary/5' 
          : 'bg-white dark:bg-gray-800'
      } shadow-sm hover:shadow-md transition-all duration-300`}
    >
      <div className="p-6">
        <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{plan.description}</p>
        
        <div className="mb-6">
          <span className="text-3xl font-bold">₹{plan.price_inr}</span>
          <span className="text-gray-500 dark:text-gray-400 ml-1">/month</span>
        </div>
        
        <ul className="space-y-3 mb-6">
          <li className="flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span>{plan.monthly_identifications} identifications / month</span>
          </li>
          {Array.isArray(plan.features) && plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        {/* Different button types based on plan */}
        {plan.name === 'Free' ? (
          <Button
            className="w-full"
            variant={isActive ? "outline" : "default"}
            disabled={isActive || processingPayment}
            onClick={() => onSelectPlan(plan)}
          >
            {processingPayment && plan.name === selectedPlan?.name ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {isActive 
              ? "Current Plan" 
              : "Start Free"
            }
          </Button>
        ) : (
          <>
            {/* Only render this button for UI/navigation purposes */}
            <Button
              className="w-full mb-4"
              variant={isActive ? "outline" : "default"}
              disabled={isActive}
              onClick={() => onSelectPlan(plan)}
            >
              {isActive 
                ? "Current Plan" 
                : `Subscribe - ₹${plan.price_inr}`
              }
            </Button>
            
            {/* Hidden div that will be revealed in the dialog */}
            {plan.subscription_button_id && !isActive && (
              <div id={`razorpay-button-${plan.name}`} className="hidden">
                <form>
                  <script 
                    src="https://cdn.razorpay.com/static/widget/subscription-button.js" 
                    data-subscription_button_id={plan.subscription_button_id} 
                    data-button_theme="brand-color"
                    async
                  ></script>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PlanCard;
