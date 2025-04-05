
import { useEffect, useState } from 'react';

interface RazorpayScriptLoaderProps {
  children?: React.ReactNode;
  onLoaded?: () => void;
  onError?: () => void;
}

const RazorpayScriptLoader = ({ 
  children, 
  onLoaded, 
  onError 
}: RazorpayScriptLoaderProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Load Razorpay script
    const loadRazorpayScript = () => {
      // Check if script already exists
      if (document.getElementById('razorpay-subscription-script')) {
        setIsLoaded(true);
        onLoaded?.();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.razorpay.com/static/widget/subscription-button.js';
      script.async = true;
      script.defer = true;
      script.id = 'razorpay-subscription-script';
      
      // Add event listeners
      script.onload = () => {
        console.log('Razorpay script loaded successfully');
        setIsLoaded(true);
        onLoaded?.();
      };

      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        setHasError(true);
        onError?.();
      };

      // Append to document
      document.body.appendChild(script);
    };

    loadRazorpayScript();

    // Cleanup
    return () => {
      // We don't remove the script to avoid reloading issues
    };
  }, [onLoaded, onError]);

  return <>{children}</>;
};

export default RazorpayScriptLoader;
