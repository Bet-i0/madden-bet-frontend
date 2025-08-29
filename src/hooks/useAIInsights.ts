import { useState, useRef } from 'react';

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
  market: 'SPREAD' | 'TOTAL' | 'MONEYLINE' | 'PROP' | 'ALT_SPREAD' | 'LIVE';
  title: string;        // e.g., "Chiefs -3.5"
  odds: string;         // e.g., "-110"
  book?: string;        // e.g., "DraftKings"
  confidence: number;   // 0-100
  rationale: string;
  game?: string;        // e.g., "Chiefs vs Bills"
  league?: string;      // e.g., "NFL"
  startTime?: string;   // ISO
}

export const useAIInsights = () => {
  const [loading, setLoading] = useState(false);
  const [currentInsight, setCurrentInsight] = useState<AIInsight | null>(null);
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

  const getSuggestionPicks = async (trendId: number, category: SuggestionCategory): Promise<SuggestionPick[]> => {
    const cacheKey = `${trendId}:${category}`;
    
    // Check cache first
    if (suggestionCache.current.has(cacheKey)) {
      return suggestionCache.current.get(cacheKey)!;
    }

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));

    // Mock data generators based on category
    const generateMockPicks = (category: string, count: number = 4): SuggestionPick[] => {
      const markets: SuggestionPick['market'][] = ['SPREAD', 'TOTAL', 'MONEYLINE', 'PROP', 'ALT_SPREAD'];
      const books = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'BetRivers'];
      const leagues = ['NFL', 'NBA', 'MLB', 'NHL', 'NCAAF'];
      const teams = [
        'Chiefs vs Bills', 'Lakers vs Warriors', 'Cowboys vs Giants', 
        'Celtics vs Heat', 'Dodgers vs Yankees', 'Rangers vs Bruins'
      ];

      const categoryData = {
        'Over/Under Total Points': {
          titles: ['Over 47.5 Total Points', 'Under 52.5 Total Points', 'Over 215.5 Total Points', 'Under 6.5 Total Goals'],
          markets: ['TOTAL' as const],
          rationales: [
            'High-scoring teams averaging 28+ PPG in last 5 games',
            'Weather conditions favor under with 15mph winds',
            'Both defenses ranked bottom 10 in points allowed',
            'Recent games between these teams averaged 51+ points'
          ]
        },
        'Spread Coverage': {
          titles: ['Chiefs -3.5', 'Lakers +7.5', 'Cowboys -6.0', 'Celtics -2.5'],
          markets: ['SPREAD' as const],
          rationales: [
            'Home team 8-2 ATS in last 10 games',
            'Road dog getting too many points after back-to-back',
            'Key injury to opposing star player creates value',
            'Public heavily on favorite, sharp money on underdog'
          ]
        },
        'Player Performance Props': {
          titles: ['Mahomes Over 2.5 TD Passes', 'LeBron Over 26.5 Points', 'Dak Under 275.5 Passing Yards', 'Tatum Over 8.5 Rebounds'],
          markets: ['PROP' as const],
          rationales: [
            'Player averaging 3.2 TD passes in last 6 home games',
            'Matchup advantage against bottom-ranked defense',
            'Weather conditions limiting passing game effectiveness',
            'Increased usage with teammate injury'
          ]
        },
        'Parlay Leg Candidates': {
          titles: ['Chiefs ML', 'Over 47.5 Total', 'Lakers +7.5', 'Mahomes Over 275.5 Yards'],
          markets: ['MONEYLINE' as const, 'TOTAL' as const, 'SPREAD' as const, 'PROP' as const],
          rationales: [
            'Strong home favorite with playoff implications',
            'High-total game with weak defenses and perfect conditions',
            'Road dog getting inflated line due to public perception',
            'QB facing bottom-ranked pass defense'
          ]
        },
        'Live Betting Opportunities': {
          titles: ['Live Under 44.5 Total', 'Live Chiefs +3.5', 'Live Over 1.5 Goals 2nd Period', 'Live Lakers ML'],
          markets: ['TOTAL' as const, 'SPREAD' as const, 'PROP' as const, 'MONEYLINE' as const],
          rationales: [
            'Game tempo slower than expected, live total inflated',
            'Key injury occurred during game, line overreaction',
            'Teams playing aggressive in period after slow start',
            'Momentum shift after technical foul sequence'
          ]
        }
      };

      const data = categoryData[category as keyof typeof categoryData] || categoryData['Parlay Leg Candidates'];
      
      return Array.from({ length: count }, (_, i) => ({
        id: `pick_${trendId}_${category}_${i}`,
        category,
        market: data.markets[i % data.markets.length],
        title: data.titles[i % data.titles.length],
        odds: ['-110', '-105', '+105', '+120', '-115'][i % 5],
        book: books[i % books.length],
        confidence: Math.floor(Math.random() * 20) + 75, // 75-95%
        rationale: data.rationales[i % data.rationales.length],
        game: teams[i % teams.length],
        league: leagues[i % leagues.length],
        startTime: new Date(Date.now() + (i + 1) * 3600000).toISOString()
      }));
    };

    const picks = generateMockPicks(category);
    
    // Cache the result
    suggestionCache.current.set(cacheKey, picks);
    
    return picks;
  };

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