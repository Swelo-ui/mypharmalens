import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  Wifi, 
  CreditCard, 
  Server, 
  Clock,
  ExternalLink,
  Copy,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PaymentError {
  type: 'payment_failed' | 'network_error' | 'server_error' | 'timeout' | 'validation_error' | 'unknown';
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
  retryable: boolean;
}

interface ErrorHandlerProps {
  error: PaymentError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showContactSupport?: boolean;
  className?: string;
}

const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  error,
  onRetry,
  onDismiss,
  showContactSupport = true,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const getErrorIcon = (type: PaymentError['type']) => {
    switch (type) {
      case 'payment_failed':
        return <CreditCard className="h-6 w-6 text-red-500" />;
      case 'network_error':
        return <Wifi className="h-6 w-6 text-orange-500" />;
      case 'server_error':
        return <Server className="h-6 w-6 text-red-500" />;
      case 'timeout':
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case 'validation_error':
        return <AlertTriangle className="h-6 w-6 text-orange-500" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
    }
  };

  const getErrorTitle = (type: PaymentError['type']) => {
    switch (type) {
      case 'payment_failed':
        return 'Payment Failed';
      case 'network_error':
        return 'Connection Problem';
      case 'server_error':
        return 'Server Error';
      case 'timeout':
        return 'Request Timeout';
      case 'validation_error':
        return 'Validation Error';
      default:
        return 'Something Went Wrong';
    }
  };

  const getErrorDescription = (error: PaymentError) => {
    switch (error.type) {
      case 'payment_failed':
        return 'Your payment could not be processed. Please check your payment details and try again.';
      case 'network_error':
        return 'Unable to connect to our servers. Please check your internet connection and try again.';
      case 'server_error':
        return 'Our servers are experiencing issues. Please try again in a few moments.';
      case 'timeout':
        return 'The request took too long to complete. Please try again.';
      case 'validation_error':
        return 'There was an issue with the provided information. Please review and try again.';
      default:
        return error.message || 'An unexpected error occurred. Please try again or contact support.';
    }
  };

  const getResolutionSteps = (type: PaymentError['type']) => {
    switch (type) {
      case 'payment_failed':
        return [
          'Verify your payment method details',
          'Check if your card has sufficient funds',
          'Ensure your card is not expired',
          'Try a different payment method',
          'Contact your bank if the issue persists'
        ];
      case 'network_error':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Disable VPN if you\'re using one',
          'Try again in a few minutes',
          'Contact support if the problem continues'
        ];
      case 'server_error':
        return [
          'Wait a few minutes and try again',
          'Refresh the page',
          'Clear your browser cache',
          'Try using a different browser',
          'Contact support if the issue persists'
        ];
      case 'timeout':
        return [
          'Check your internet connection speed',
          'Try again with a stable connection',
          'Refresh the page and retry',
          'Contact support if timeouts continue'
        ];
      default:
        return [
          'Refresh the page and try again',
          'Clear your browser cache',
          'Try using a different browser',
          'Contact support for assistance'
        ];
    }
  };

  const handleRetry = async () => {
    if (!onRetry || !error?.retryable) return;
    
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const copyErrorDetails = () => {
    if (!error) return;
    
    const errorDetails = {
      type: error.type,
      message: error.message,
      code: error.code,
      timestamp: error.timestamp.toISOString(),
      retryCount
    };
    
    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
    setCopied(true);
  };

  const openSupportPage = () => {
    window.open('/help', '_blank');
  };

  if (!error) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`max-w-2xl mx-auto px-2 sm:px-0 ${className}`}
      >
        <Card className="border-red-200 shadow-lg">
          <CardHeader className="pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex-shrink-0">{getErrorIcon(error.type)}</div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-words">
                  {getErrorTitle(error.type)}
                </CardTitle>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                  {getErrorDescription(error)}
                </p>
              </div>
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6 pb-4 sm:pb-6">
            {/* Error Details */}
            {error.code && (
              <Alert>
                <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-mono text-xs sm:text-sm break-all">Error Code: {error.code}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyErrorDetails}
                    className="h-6 px-2"
                  >
                    {copied ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Resolution Steps */}
            <div>
              <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white mb-2 sm:mb-3">
                How to resolve this:
              </h4>
              <ol className="space-y-2">
                {getResolutionSteps(error.type).map((step, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    <span className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                      {index + 1}
                    </span>
                    <span className="break-words flex-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
              {error.retryable && onRetry && (
                <Button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? 'Retrying...' : `Try Again${retryCount > 0 ? ` (${retryCount})` : ''}`}
                </Button>
              )}
              
              {showContactSupport && (
                <Button
                  variant="outline"
                  onClick={openSupportPage}
                  className="flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
                  size="sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  Contact Support
                </Button>
              )}
            </div>

            {/* Additional Info */}
            <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t break-words">
              <p className="break-all">Error occurred at: {error.timestamp.toLocaleString()}</p>
              {retryCount > 0 && (
                <p>Retry attempts: {retryCount}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default ErrorHandler;