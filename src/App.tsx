
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { useEffect, lazy, Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { playAppAccessSound } from '@/utils/audioService';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BottomNavigation from "./components/BottomNavigation";
import { PWAUpdatePrompt } from "./components/PWAUpdatePrompt";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { useOfflineDetection } from "./hooks/useOfflineDetection";

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
const SymptomChecker = lazy(() => import("./pages/SymptomChecker"));
const DrugInteractionChecker = lazy(() => import("./pages/DrugInteractionChecker"));
const Profile = lazy(() => import("./pages/Profile"));
const AccountSubscriptionPage = lazy(() => import("./pages/AccountSubscription"));
const PaymentResult = lazy(() => import("./components/PaymentResult"));
// Replace direct component import with page wrappers
const PaymentHistoryPage = lazy(() => import("./pages/PaymentHistoryPage"));
const SubscriptionManagerPage = lazy(() => import("./pages/SubscriptionManagerPage"));
const DrugDirectory = lazy(() => import("./pages/DrugDirectory"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const ClaimCallback = lazy(() => import("./pages/ClaimCallback"));

const queryClient = new QueryClient();

// Premium shimmer loading component for lazy-loaded routes
const PageLoadingSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Top navigation skeleton */}
    <div className="h-16 border-b border-border/40 px-4 flex items-center gap-4">
      <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
      <div className="h-4 w-32 rounded bg-muted animate-pulse" />
      <div className="ml-auto h-8 w-8 rounded-full bg-muted animate-pulse" />
    </div>
    {/* Content skeleton */}
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="h-8 w-3/4 rounded-lg bg-muted animate-pulse" />
      <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        <div className="h-40 rounded-xl bg-muted animate-pulse" />
        <div className="h-40 rounded-xl bg-muted animate-pulse" />
      </div>
      <div className="h-4 w-full rounded bg-muted animate-pulse" />
      <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
      <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
    </div>
  </div>
);

const App = () => {
  // Initialize offline detection
  useOfflineDetection();

  useEffect(() => {
    // Play access alert sound when PharmaLens is accessed
    playAppAccessSound();
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {/* PWA Update & Install Prompts */}
          <PWAUpdatePrompt />
          <PWAInstallPrompt />

          <div className="flex flex-col min-h-screen">
            <div className="flex-1">
              <ErrorBoundary>
                <Suspense fallback={<PageLoadingSkeleton />}>
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
                    <Route path="/drugs" element={<DrugDirectory />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/symptom-checker" element={<SymptomChecker />} />
                    <Route path="/drug-interactions" element={<DrugInteractionChecker />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/account-subscription" element={<AccountSubscriptionPage />} />
                    <Route path="/payment-result" element={<PaymentResult />} />
                    <Route path="/payment-history" element={<PaymentHistoryPage />} />
                    <Route path="/subscription" element={<SubscriptionManagerPage />} />
                    <Route path="/subscription-manager" element={<SubscriptionManagerPage />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />
                    <Route path="/claim-callback/:token" element={<ClaimCallback />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </div>
            <BottomNavigation />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;