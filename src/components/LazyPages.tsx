import { lazy } from 'react';

// Lazy load heavy pages for better performance
export const LazyAnalytics = lazy(() => import('@/pages/Analytics'));
export const LazySocial = lazy(() => import('@/pages/Social'));
export const LazyAICoach = lazy(() => import('@/pages/AICoach'));
export const LazyAnalyzeStrategies = lazy(() => import('@/pages/AnalyzeStrategies'));
export const LazyTrendingNow = lazy(() => import('@/pages/TrendingNow'));
export const LazyInjuries = lazy(() => import('@/pages/Injuries'));
export const LazyProfile = lazy(() => import('@/pages/Profile'));