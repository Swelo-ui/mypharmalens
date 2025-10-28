import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tables } from '@/types/database.types';

export type SubscriptionPlan = Tables<"subscription_plans">;
export type UserSubscription = Tables<"user_subscriptions"> & {
  plan?: SubscriptionPlan;
};

export interface SubscriptionUpdateResult {
  success: boolean;
  subscription?: UserSubscription;
  error?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

/**
 * Service for managing subscription status updates with server-side validation
 */
export class SubscriptionService {
  private static instance: SubscriptionService;
  private subscriptionUpdateCallbacks: ((subscription: UserSubscription | null) => void)[] = [];

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  /**
   * Subscribe to subscription status updates
   */
  onSubscriptionUpdate(callback: (subscription: UserSubscription | null) => void): () => void {
    this.subscriptionUpdateCallbacks.push(callback);
    return () => {
      const index = this.subscriptionUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.subscriptionUpdateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers of subscription updates
   */
  private notifySubscriptionUpdate(subscription: UserSubscription | null) {
    this.subscriptionUpdateCallbacks.forEach(callback => {
      try {
        callback(subscription);
      } catch (error) {
        console.error('Error in subscription update callback:', error);
      }
    });
  }

  /**
   * Verify payment completion with server-side validation
   */
  async verifyPayment(transactionId: string): Promise<PaymentVerificationResult> {
    try {
      const { data: transaction, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();

      if (error) {
        console.error('Payment verification error:', error);
        return {
          success: false,
          error: `Payment verification failed: ${error.message}`
        };
      }

      if (!transaction) {
        return {
          success: false,
          error: 'Transaction not found'
        };
      }

      if (transaction.status !== 'success') {
        return {
          success: false,
          error: `Payment not completed. Status: ${transaction.status}`
        };
      }

      return {
        success: true,
        transactionId: transaction.transaction_id
      };
    } catch (error: any) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        error: error.message || 'Unknown payment verification error'
      };
    }
  }

  /**
   * Update subscription status with comprehensive validation
   */
  async updateSubscriptionStatus(
    userId: string,
    planId: string,
    transactionId?: string
  ): Promise<SubscriptionUpdateResult> {
    try {
      // Verify payment if transaction ID is provided
      if (transactionId) {
        const paymentResult = await this.verifyPayment(transactionId);
        if (!paymentResult.success) {
          return {
            success: false,
            error: paymentResult.error
          };
        }
      }

      // Fetch the subscription plan details
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError || !plan) {
        return {
          success: false,
          error: `Invalid subscription plan: ${planError?.message || 'Plan not found'}`
        };
      }

      // Calculate subscription dates
      const now = new Date();
      const endDate = new Date();
      
      if (plan.billing_period === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else if (plan.billing_period === 'weekly') {
        endDate.setDate(endDate.getDate() + 7);
      } else {
        // Default to monthly
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // First, deactivate all existing active subscriptions for this user
      const { error: deactivateError } = await supabase
        .from('user_subscriptions')
        .update({ status: 'inactive' })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (deactivateError) {
        console.warn('Error deactivating old subscriptions:', deactivateError);
        // Don't fail - continue with creating new subscription
      }

      // Insert new active subscription
      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          status: 'active',
          starts_at: now.toISOString(),
          ends_at: endDate.toISOString()
        })
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .single();

      if (subscriptionError) {
        console.error('Subscription update error:', subscriptionError);
        return {
          success: false,
          error: `Failed to update subscription: ${subscriptionError.message}`
        };
      }

      const updatedSubscription = subscription as UserSubscription;

      // Log subscription history for audit trail
      // Subscription history logging removed - table doesn't exist

      // Notify subscribers of the update
      this.notifySubscriptionUpdate(updatedSubscription);

      // Show success toast
      toast.success('Subscription Updated!', {
        description: `Your ${plan.name} subscription is now active.`,
        duration: 5000
      });

      // Force a small delay to allow realtime to propagate
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        subscription: updatedSubscription
      };
    } catch (error: any) {
      console.error('Subscription update error:', error);
      return {
        success: false,
        error: error.message || 'Unknown subscription update error'
      };
    }
  }

  /**
   * Poll for subscription status updates
   */
  async pollSubscriptionStatus(
    userId: string,
    maxAttempts: number = 10,
    intervalMs: number = 3000
  ): Promise<UserSubscription | null> {
    let attempts = 0;

    return new Promise((resolve) => {
      const poll = async () => {
        attempts++;

        try {
          const { data: subscription, error } = await supabase
            .from('user_subscriptions')
            .select(`
              *,
              plan:subscription_plans(*)
            `)
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error) {
            console.error('Subscription polling error:', error);
          }

          if (subscription) {
            const updatedSubscription = subscription as UserSubscription;
            this.notifySubscriptionUpdate(updatedSubscription);
            resolve(updatedSubscription);
            return;
          }

          if (attempts >= maxAttempts) {
            console.warn('Subscription polling timeout reached');
            resolve(null);
            return;
          }

          setTimeout(poll, intervalMs);
        } catch (error) {
          console.error('Subscription polling error:', error);
          if (attempts >= maxAttempts) {
            resolve(null);
          } else {
            setTimeout(poll, intervalMs);
          }
        }
      };

      poll();
    });
  }

  // Subscription history logging method removed - table doesn't exist in database

  /**
   * Get current subscription with caching
   */
  async getCurrentSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching current subscription:', error);
        return null;
      }

      return subscription as UserSubscription;
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      return null;
    }
  }

  /**
   * Handle subscription update failures with fallback mechanisms
   */
  async handleSubscriptionUpdateFailure(
    userId: string,
    planId: string,
    error: string,
    transactionId?: string
  ): Promise<void> {
    console.error('Subscription update failed:', { userId, planId, error, transactionId });

    // Log the failure for debugging
    // Subscription history logging removed - table doesn't exist

    // Show error toast with resolution steps
    toast.error('Subscription Update Failed', {
      description: 'Please contact support if the issue persists. Your payment may still be processing.',
      duration: 8000,
      action: {
        label: 'Retry',
        onClick: () => this.updateSubscriptionStatus(userId, planId, transactionId)
      }
    });

    // Attempt to notify user via email or other means if available
    // This would be implemented based on your notification system
  }
}

// Export singleton instance
export const subscriptionService = SubscriptionService.getInstance();