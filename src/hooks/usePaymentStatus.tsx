import { useState, useEffect, useCallback, useRef } from 'react';
import { SubscriptionService, UserSubscription } from '@/services/subscriptionService';
import { PaymentError } from '@/components/ErrorHandler';

interface PaymentStatusState {
  isPolling: boolean;
  isVerifying: boolean;
  error: PaymentError | null;
  lastUpdate: Date | null;
  retryCount: number;
}

interface UsePaymentStatusOptions {
  pollInterval?: number;
  maxRetries?: number;
  timeoutDuration?: number;
  onSuccess?: (subscription: UserSubscription) => void;
  onError?: (error: PaymentError) => void;
}

export const usePaymentStatus = (options: UsePaymentStatusOptions = {}) => {
  const {
    pollInterval = 1000, // Poll every second
    maxRetries = 3,
    timeoutDuration = 30000, // 30 seconds timeout
    onSuccess,
    onError
  } = options;

  const [state, setState] = useState<PaymentStatusState>({
    isPolling: false,
    isVerifying: false,
    error: null,
    lastUpdate: null,
    retryCount: 0
  });

  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const verificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionService = useRef(SubscriptionService.getInstance());

  const clearTimers = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    if (verificationTimeoutRef.current) {
      clearTimeout(verificationTimeoutRef.current);
      verificationTimeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const createError = useCallback((
    type: PaymentError['type'],
    message: string,
    code?: string,
    retryable: boolean = true
  ): PaymentError => ({
    type,
    message,
    code,
    timestamp: new Date(),
    retryable
  }), []);

  const updateState = useCallback((updates: Partial<PaymentStatusState>) => {
    setState(prev => ({
      ...prev,
      ...updates,
      lastUpdate: new Date()
    }));
  }, []);

  const handleError = useCallback((error: PaymentError) => {
    updateState({ 
      error, 
      isPolling: false, 
      isVerifying: false 
    });
    onError?.(error);
    clearTimers();
  }, [updateState, onError, clearTimers]);

  const verifyPayment = useCallback(async (paymentId: string, userId: string): Promise<boolean> => {
    try {
      updateState({ isVerifying: true, error: null });

      const result = await subscriptionService.current.verifyPayment(paymentId);
      
      if (result.success) {
        // Get the updated subscription after successful verification
        const subscription = await subscriptionService.current.getCurrentSubscription(userId);
        if (subscription) {
          onSuccess?.(subscription);
          return true;
        }
      }
      
      const error = createError(
        'payment_failed',
        result.error || 'Payment verification failed',
        'PAYMENT_VERIFICATION_FAILED'
      );
      handleError(error);
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const paymentError = createError(
        'server_error',
        message || 'Failed to verify payment',
        'VERIFICATION_ERROR'
      );
      handleError(paymentError);
      return false;
    } finally {
      updateState({ isVerifying: false });
    }
  }, [updateState, createError, handleError, onSuccess]);

  const pollSubscriptionStatus = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const subscription = await subscriptionService.current.getCurrentSubscription(userId);
      
      if (subscription && subscription.status === 'active') {
        updateState({ isPolling: false });
        onSuccess?.(subscription);
        clearTimers();
        return true;
      }
      
      return false;
    } catch (error) {
      console.warn('Polling error:', error);
      return false;
    }
  }, [updateState, onSuccess, clearTimers]);

  const startPolling = useCallback((userId: string) => {
    if (state.isPolling) return;

    updateState({ 
      isPolling: true, 
      error: null, 
      retryCount: 0 
    });

    // Set overall timeout
    pollTimeoutRef.current = setTimeout(() => {
      const error = createError(
        'timeout',
        'Subscription update is taking longer than expected. Please check your subscription status manually.',
        'POLLING_TIMEOUT',
        true
      );
      handleError(error);
    }, timeoutDuration);

    // Start polling interval
    intervalRef.current = setInterval(async () => {
      const success = await pollSubscriptionStatus(userId);
      if (success) {
        clearTimers();
      }
    }, pollInterval);

    // Initial check
    pollSubscriptionStatus(userId);
  }, [
    state.isPolling,
    updateState,
    createError,
    handleError,
    timeoutDuration,
    pollSubscriptionStatus,
    pollInterval,
    clearTimers
  ]);

  const startPaymentVerification = useCallback((paymentId: string, userId: string) => {
    if (state.isVerifying) return;

    // Set verification timeout
    verificationTimeoutRef.current = setTimeout(() => {
      const error = createError(
        'timeout',
        'Payment verification is taking too long. Please try again.',
        'VERIFICATION_TIMEOUT'
      );
      handleError(error);
    }, 10000); // 10 seconds for verification

    verifyPayment(paymentId, userId);
  }, [state.isVerifying, createError, handleError, verifyPayment]);

  const retry = useCallback(() => {
    if (state.retryCount >= maxRetries) {
      const error = createError(
        'unknown',
        'Maximum retry attempts reached. Please try again later or contact support.',
        'MAX_RETRIES_EXCEEDED',
        false
      );
      handleError(error);
      return;
    }

    updateState({ 
      retryCount: state.retryCount + 1,
      error: null 
    });

    // Retry logic would depend on what was being attempted
    // This is a placeholder for retry functionality
  }, [state.retryCount, maxRetries, createError, handleError, updateState]);

  const reset = useCallback(() => {
    clearTimers();
    setState({
      isPolling: false,
      isVerifying: false,
      error: null,
      lastUpdate: null,
      retryCount: 0
    });
  }, [clearTimers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  // Auto-retry on network reconnection
  useEffect(() => {
    const handleOnline = () => {
      if (state.error?.type === 'network_error' && state.error.retryable) {
        retry();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [state.error, retry]);

  return {
    // State
    isPolling: state.isPolling,
    isVerifying: state.isVerifying,
    error: state.error,
    lastUpdate: state.lastUpdate,
    retryCount: state.retryCount,
    
    // Actions
    startPolling,
    startPaymentVerification,
    verifyPayment,
    retry,
    reset,
    
    // Computed
    isActive: state.isPolling || state.isVerifying,
    canRetry: state.error?.retryable && state.retryCount < maxRetries,
    
    // Utils
    clearError: () => updateState({ error: null })
  };
};
