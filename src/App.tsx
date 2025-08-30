
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { APIToggleProvider } from "./contexts/APIToggleContext";
import { APICommandInput } from "./components/APICommandInput";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";
import RightSidePanel from "./components/RightSidePanel";
import {
  LazyAnalytics,
  LazySocial,
  LazyProfile,
  LazyTrendingNow,
  LazyInjuries,
  LazyAnalyzeStrategies,
  LazyAICoach
} from "./components/LazyPages";
import "./App.css";

// Optimized QueryClient for better caching and performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        if (failureCount < 2) return true;
        return false;
      },
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <APIToggleProvider>
              <Toaster />
              <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/analytics" element={
                  <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>}>
                    <LazyAnalytics />
                  </Suspense>
                } />
                <Route path="/social" element={
                  <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>}>
                    <LazySocial />
                  </Suspense>
                } />
                <Route path="/profile" element={
                  <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>}>
                    <LazyProfile />
                  </Suspense>
                } />
                <Route path="/profile/me" element={
                  <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>}>
                    <LazyProfile />
                  </Suspense>
                } />
                <Route path="/profile/:userId" element={
                  <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>}>
                    <LazyProfile />
                  </Suspense>
                } />
                <Route path="/trending" element={
                  <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>}>
                    <LazyTrendingNow />
                  </Suspense>
                } />
                <Route path="/injuries" element={
                  <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>}>
                    <LazyInjuries />
                  </Suspense>
                } />
                <Route path="/strategies" element={
                  <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>}>
                    <LazyAnalyzeStrategies />
                  </Suspense>
                } />
                <Route path="/analyze-strategies" element={
                  <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>}>
                    <LazyAnalyzeStrategies />
                  </Suspense>
                } />
                <Route path="/build-strategy" element={
                  <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>}>
                    <LazyAnalyzeStrategies />
                  </Suspense>
                } />
                <Route path="/ai-coach" element={
                  <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>}>
                    <LazyAICoach />
                  </Suspense>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <BottomNav />
              <RightSidePanel />
              <APICommandInput />
            </BrowserRouter>
          </APIToggleProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
}

export default App;
