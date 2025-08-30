import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAPIToggle } from '@/contexts/APIToggleContext';

export interface AIInsight {
  recommendation: 'STRONG ADD' | 'MODERATE ADD' | 'AVOID' | 'MONITOR';
  confidence: number;
  reasoning: string[];
  parlayFit: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedBets: string[];
  expectedValue: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export type SuggestionCategory = string;

export interface SuggestionPick {
  id: string;
  category: string;
  market: string;
  title: string;
  odds: number;
  bookmaker: string;
  confidence: number;
  rationale: string;
  game: string;
  league: string;
  startTime: string;
}

export const useAIInsights = () => {
  const [loading, setLoading] = useState(false);
  const [currentInsight, setCurrentInsight] = useState<AIInsight | null>(null);
  const { isAPIEnabled } = useAPIToggle();
  const suggestionCache = useRef(new Map<string, SuggestionPick[]>());

  const generateInsight = async (trendId: number): Promise<AIInsight> => {
    setLoading(true);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    const recommendations = ['STRONG ADD', 'MODERATE ADD', 'AVOID', 'MONITOR'] as const;
    const parlayFits = ['HIGH', 'MEDIUM', 'LOW'] as const;
    const riskLevels = ['LOW', 'MEDIUM', 'HIGH'] as const;
    
    const reasoningOptions = [
      "Trend momentum shows sustained interest over 48 hours",
      "Historical data suggests positive correlation with betting outcomes", 
      "Social sentiment analysis indicates strong public backing",
      "Key influencer engagement rate above average threshold",
      "Volume surge correlates with recent team performance",
      "Market inefficiency detected in current odds pricing",
      "Cross-platform validation shows consistent signal",
      "Betting patterns align with professional sharp money"
    ];

    const betTypes = [
      "Over/Under Total Points",
      "Spread Coverage", 
      "Player Performance Props",
      "First Half Totals",
      "Team Total Points",
      "Alternate Spreads",
      "Live Betting Opportunities",
      "Parlay Leg Candidates"
    ];

    const insight: AIInsight = {
      recommendation: recommendations[Math.floor(Math.random() * recommendations.length)],
      confidence: Math.floor(Math.random() * 30) + 70,
      reasoning: reasoningOptions
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 3),
      parlayFit: parlayFits[Math.floor(Math.random() * parlayFits.length)],
      suggestedBets: betTypes
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 3),
      expectedValue: Math.random() * 20 - 5, // -5% to +15%
      riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)]
    };

    setCurrentInsight(insight);
    setLoading(false);
    return insight;
  };

  const getSuggestionPicks = useCallback(async (trendId: number, category: SuggestionCategory): Promise<SuggestionPick[]> => {
    const cacheKey = `${trendId}:${category}`;
    
    // Check cache first
    if (suggestionCache.current.has(cacheKey)) {
      return suggestionCache.current.get(cacheKey)!;
    }

    try {
      // Call the ai-suggestions Edge Function
      const { data, error } = await supabase.functions.invoke('ai-suggestions', {
        body: { trendId, category },
      });

      if (error) {
        // Handle AI suggestions function error
        if ((error as any).message?.includes('usage limit')) {
          toast.error('AI suggestion limit reached this month.');
        } else {
          toast.error('Unable to load AI suggestions right now.');
        }
        return [];
      }

      const suggestions = data.suggestions || [];
      
      // Cache the results
      suggestionCache.current.set(cacheKey, suggestions);
      
      return suggestions;
    } catch (error) {
      // Error fetching AI suggestions
      toast.error('Unable to load AI suggestions right now.');
      return [];
    }
  }, []);

  // Clear insight
  const clearInsight = () => {
    setCurrentInsight(null);
  };

  return {
    loading,
    currentInsight,
    generateInsight,
    clearInsight,
    getSuggestionPicks
  };
};