
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
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
import Profile from "./pages/Profile";
import BottomNavigation from "./components/BottomNavigation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    <BottomNavigation />
  </QueryClientProvider>
);

export default App;
