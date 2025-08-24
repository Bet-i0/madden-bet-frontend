
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Analytics from "./pages/Analytics";
import Social from "./pages/Social";
import Profile from "./pages/Profile";
import TrendingNow from "./pages/TrendingNow";
import Injuries from "./pages/Injuries";
import AnalyzeStrategies from "./pages/AnalyzeStrategies";
import AICoach from "./pages/AICoach";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";
import RightSidePanel from "./components/RightSidePanel";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/social" element={<Social />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/me" element={<Profile />} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route path="/trending" element={<TrendingNow />} />
                <Route path="/injuries" element={<Injuries />} />
                <Route path="/strategies" element={<AnalyzeStrategies />} />
                <Route path="/analyze-strategies" element={<AnalyzeStrategies />} />
                <Route path="/build-strategy" element={<AnalyzeStrategies />} />
                <Route path="/ai-coach" element={<AICoach />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <BottomNav />
              <RightSidePanel />
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
