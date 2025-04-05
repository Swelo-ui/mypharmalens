
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SearchResults from "./pages/SearchResults";
import DrugIdentify from "./pages/DrugIdentify";
import DrugPage from "./pages/DrugPage";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import HelpCenter from "./pages/HelpCenter";
import HelpCategory from "./pages/HelpCategory";
import HelpArticlePage from "./pages/HelpArticle";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Disclaimer from "./pages/Disclaimer";
import Auth from "./pages/Auth";
import IdentificationHistory from "./pages/IdentificationHistory";
import Subscription from "./pages/Subscription";

// Add a callback URL route for handling Razorpay redirects
const RazorpayCallback = () => {
  useEffect(() => {
    // Extract parameters from URL
    const params = new URLSearchParams(window.location.search);
    const razorpay_payment_id = params.get('razorpay_payment_id');
    const razorpay_subscription_id = params.get('razorpay_subscription_id');
    const razorpay_signature = params.get('razorpay_signature');
    const plan_name = params.get('plan_name');
    
    // If we have payment info, verify it with our backend
    if (razorpay_payment_id && razorpay_subscription_id) {
      const verifySubscription = async () => {
        try {
          const { data, error } = await supabase.functions.invoke(
            'subscription-management/verify-subscription',
            {
              body: {
                razorpay_payment_id,
                razorpay_subscription_id,
                razorpay_signature,
                plan_name: plan_name || (razorpay_subscription_id.includes('QF1itg') ? 'Advanced' : 'Elite')
              }
            }
          );
          
          if (error) {
            toast.error('Payment verification failed');
            console.error('Payment verification error:', error);
          } else if (data?.success) {
            toast.success(data.message || 'Payment successful!');
          }
          
          // Redirect to subscription page
          window.location.href = '/subscription';
        } catch (error) {
          console.error('Error verifying payment:', error);
          toast.error('Payment verification failed');
          // Redirect to subscription page after a delay
          setTimeout(() => {
            window.location.href = '/subscription';
          }, 2000);
        }
      };
      
      verifySubscription();
    } else {
      // If no payment params, just redirect to subscription page
      window.location.href = '/subscription';
    }
  }, []);
  
  return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-2">Processing your payment...</p>
    </div>
  );
};

import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/identify" element={<DrugIdentify />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/help/:categoryId" element={<HelpCategory />} />
          <Route path="/help/article/:articleId" element={<HelpArticlePage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/drug/:id" element={<DrugPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/history" element={<IdentificationHistory />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/payment/callback" element={<RazorpayCallback />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
