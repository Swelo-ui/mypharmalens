
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SearchResults from "./pages/SearchResults";
import DrugIdentify from "./pages/DrugIdentify";

const queryClient = new QueryClient();

const About = () => (
  <div className="pt-24 pb-8 container">
    <h1 className="text-3xl font-bold mb-6">About PharmaLens</h1>
    <p className="mb-4">PharmaLens is a comprehensive medication identification and information platform designed to help users quickly identify medications and access detailed information about them.</p>
    <p className="mb-4">Our mission is to improve medication safety and education by providing accurate, reliable information about prescription and over-the-counter drugs.</p>
  </div>
);

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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
