
import { useEffect } from 'react';

interface RazorpayScriptLoaderProps {
  children?: React.ReactNode;
}

const RazorpayScriptLoader = ({ children }: RazorpayScriptLoaderProps) => {
  useEffect(() => {
    // Load Razorpay script
    const loadRazorpayScript = () => {
      const script = document.createElement('script');
      script.src = 'https://cdn.razorpay.com/static/widget/subscription-button.js';
      script.async = true;
      script.id = 'razorpay-subscription-script';
      document.body.appendChild(script);

      // Add event listener for script load
      script.onload = () => {
        console.log('Razorpay script loaded successfully');
      };

      script.onerror = () => {
        console.error('Failed to load Razorpay script');
      };
    };

    // Check if script is already loaded
    if (!document.getElementById('razorpay-subscription-script')) {
      loadRazorpayScript();
    }

    // Cleanup
    return () => {
      // We don't remove the script to avoid reloading issues
    };
  }, []);

  return <>{children}</>;
};

export default RazorpayScriptLoader;
