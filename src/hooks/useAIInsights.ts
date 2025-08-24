import { useState } from 'react';

export interface AIInsight {
  recommendation: 'STRONG ADD' | 'MODERATE ADD' | 'AVOID' | 'MONITOR';
  confidence: number;
  reasoning: string[];
  parlayFit: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedBets: string[];
  expectedValue: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const useAIInsights = () => {
  const [loading, setLoading] = useState(false);
  const [currentInsight, setCurrentInsight] = useState<AIInsight | null>(null);

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

  const clearInsight = () => {
    setCurrentInsight(null);
  };

  return {
    loading,
    currentInsight,
    generateInsight,
    clearInsight
  };
};