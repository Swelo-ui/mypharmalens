
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
    };

    // Check if script is already loaded
    if (!document.getElementById('razorpay-subscription-script')) {
      loadRazorpayScript();
    }

    // Cleanup
    return () => {
      const script = document.getElementById('razorpay-subscription-script');
      if (script) {
        // Don't remove the script to avoid reloading issues
        // document.body.removeChild(script);
      }
    };
  }, []);

  return <>{children}</>;
};

export default RazorpayScriptLoader;
