
import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Plan {
  id: string;
  name: string;
  description: string;
  price_inr: number;
  monthly_identifications: number;
  features: string[];
}

interface ComparisonTableProps {
  plans: Plan[];
  isPlanActive: (planName: string) => boolean;
  handleSelectPlan: (plan: Plan) => void;
}

const ComparisonTable = ({ plans, isPlanActive, handleSelectPlan }: ComparisonTableProps) => {
  const getFeatureAvailability = (featureName: string, planName: string) => {
    // Define which features are available for each plan
    const featureMap: Record<string, string[]> = {
      "Drug identification": ["Free", "Advanced", "Elite"],
      "History storage": ["Free", "Advanced", "Elite"],
      "Response time": ["Free", "Advanced", "Elite"],
      "Detailed reports": ["Advanced", "Elite"],
      "Bulk identification": ["Elite"],
      "Priority support": ["Elite"],
      "API access": ["Elite"],
      "Custom alerts": ["Advanced", "Elite"]
    };

    return featureMap[featureName]?.includes(planName) || false;
  };

  return (
    <div className="overflow-x-auto rounded-lg border shadow">
      <table className="w-full border-collapse bg-white dark:bg-gray-800">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/80">
            <th className="p-4 text-left border-b">Features</th>
            {plans.map((plan) => (
              <th key={plan.id} className="p-4 text-center border-b">
                <div className="font-bold text-lg">{plan.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">₹{plan.price_inr}/month</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            "Drug identification",
            "History storage",
            "Response time",
            "Detailed reports",
            "Bulk identification",
            "Priority support",
            "API access",
            "Custom alerts"
          ].map((feature, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}>
              <td className="p-4 border-b">{feature}</td>
              {plans.map((plan) => (
                <td key={`${plan.id}-${feature}`} className="p-4 text-center border-b">
                  {getFeatureAvailability(feature, plan.name) ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                  ) : (
                    <X className="h-5 w-5 text-gray-300 mx-auto" />
                  )}
                  {feature === 'History storage' && (
                    <div className="text-xs text-gray-500 mt-1">
                      {plan.name === 'Free' ? '10 items' : 
                       plan.name === 'Advanced' ? '100 items' : 
                       'Unlimited'}
                    </div>
                  )}
                  {feature === 'Response time' && (
                    <div className="text-xs text-gray-500 mt-1">
                      {plan.name === 'Free' ? 'Standard' : 
                       plan.name === 'Advanced' ? 'Fast' : 
                       'Priority'}
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
          <tr className="bg-gray-50 dark:bg-gray-800/80">
            <td className="p-4 border-b font-medium">Monthly identifications</td>
            {plans.map((plan) => (
              <td key={`${plan.id}-identifications`} className="p-4 text-center border-b font-medium">
                {plan.monthly_identifications}
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-4"></td>
            {plans.map((plan) => (
              <td key={`${plan.id}-action`} className="p-4 text-center">
                {plan.name === 'Free' ? (
                  <Button
                    variant="default"
                    disabled={isPlanActive(plan.name)}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {isPlanActive(plan.name) 
                      ? "Current Plan" 
                      : "Start Free" 
                    }
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    className={plan.name === 'Advanced' ? "bg-pharma-600 hover:bg-pharma-700" : ""}
                    disabled={isPlanActive(plan.name)}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {isPlanActive(plan.name) 
                      ? "Current Plan"
                      : `Choose ${plan.name}`
                    }
                  </Button>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ComparisonTable;
