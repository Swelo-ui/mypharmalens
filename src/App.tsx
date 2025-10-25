
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { useEffect, lazy, Suspense } from 'react';
import { playAppAccessSound } from '@/utils/audioService';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BottomNavigation from "./components/BottomNavigation";

// Lazy load heavy components
const SearchResults = lazy(() => import("./pages/SearchResults"));
const DrugIdentify = lazy(() => import("./pages/DrugIdentify"));
const DrugPage = lazy(() => import("./pages/DrugPage"));
const About = lazy(() => import("./pages/About"));
const FAQ = lazy(() => import("./pages/FAQ"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const HelpCategory = lazy(() => import("./pages/HelpCategory"));
const HelpArticlePage = lazy(() => import("./pages/HelpArticle"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const Auth = lazy(() => import("./pages/Auth"));
const IdentificationHistory = lazy(() => import("./pages/IdentificationHistory"));
const Profile = lazy(() => import("./pages/Profile"));
const AccountSubscriptionPage = lazy(() => import("./pages/AccountSubscription"));
const PaymentResult = lazy(() => import("./components/PaymentResult"));
// Replace direct component import with page wrappers
const PaymentHistoryPage = lazy(() => import("./pages/PaymentHistoryPage"));
const SubscriptionManagerPage = lazy(() => import("./pages/SubscriptionManagerPage"));

const queryClient = new QueryClient();

// Loading component for lazy-loaded routes
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
);

const App = () => {
  useEffect(() => {
    // Play access alert sound when PharmaLens is accessed
    playAppAccessSound();
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="flex flex-col min-h-screen">
            <div className="flex-1">
              <Suspense fallback={<LoadingSpinner />}>
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
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/account-subscription" element={<AccountSubscriptionPage />} />
                  <Route path="/payment-result" element={<PaymentResult />} />
                  <Route path="/payment-history" element={<PaymentHistoryPage />} />
                  <Route path="/subscription" element={<SubscriptionManagerPage />} />
                  <Route path="/subscription-manager" element={<SubscriptionManagerPage />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </div>
            <BottomNavigation />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;