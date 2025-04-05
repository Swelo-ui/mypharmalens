
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface Plan {
  id: string;
  name: string;
  description: string;
  price_inr: number;
  monthly_identifications: number;
  features: string[];
}

interface SubscriptionData {
  id: string;
  status: string;
  subscription_start: string;
  subscription_end: string;
  subscription_plans: Plan;
}

interface UsageData {
  used: number;
  total: number;
  remaining: number;
  percentage: number;
}

interface CurrentSubscriptionProps {
  subscription: SubscriptionData;
  usage: UsageData | null;
}

const CurrentSubscription = ({ subscription, usage }: CurrentSubscriptionProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 mb-8 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center mb-2">
            <span className="text-lg font-medium">{subscription.subscription_plans.name} Plan</span>
            <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">
              Active
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {subscription.subscription_plans.description}
          </p>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Started:</span> {formatDate(subscription.subscription_start)}</p>
            <p><span className="font-medium">Expires:</span> {formatDate(subscription.subscription_end)}</p>
            <p><span className="font-medium">Monthly identifications:</span> {subscription.subscription_plans.monthly_identifications}</p>
          </div>
        </div>

        {usage && (
          <div className="flex flex-col justify-center">
            <p className="text-sm font-medium mb-1">Usage this month</p>
            <div className="flex justify-between text-sm mb-1">
              <span>{usage.used} used</span>
              <span>{usage.remaining} remaining</span>
            </div>
            <Progress value={usage.percentage} className="h-2 mb-4" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {usage.percentage}% of your monthly limit
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentSubscription;
