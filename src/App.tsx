
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
import DrugDetails from "./pages/DrugDetails";
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
          <Route path="/drug-details" element={<DrugDetails />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/history" element={<IdentificationHistory />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
