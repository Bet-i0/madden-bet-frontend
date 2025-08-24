import { useState, useEffect } from 'react';

export interface TrendingTopic {
  id: number;
  hashtag: string;
  tweets: number;
  category: string;
  volume: string;
  sentiment: string;
  relevance: number;
  keyInsights: string[];
  change24h?: number;
}

export const useTrendingData = () => {
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Simulate real-time data updates
  useEffect(() => {
    const generateRealtimeData = (): TrendingTopic[] => {
      const baseTopics = [
        {
          id: 1,
          hashtag: "#MondayNightFootball",
          category: "Sports",
          sentiment: "positive",
          keyInsights: [
            "Chiefs vs Ravens expected to be high-scoring",
            "Weather conditions favorable for passing game", 
            "Key players injury status trending"
          ]
        },
        {
          id: 2,
          hashtag: "#NBAPlayoffs",
          category: "Sports", 
          sentiment: "mixed",
          keyInsights: [
            "Underdog teams performing better than expected",
            "Home court advantage less significant this season",
            "Player prop bets gaining massive attention"
          ]
        },
        {
          id: 3,
          hashtag: "#MarchMadness",
          category: "Sports",
          sentiment: "excited", 
          keyInsights: [
            "Bracket busters creating massive upsets",
            "Low-seeded teams covering spreads consistently",
            "Total points trending lower than projected"
          ]
        },
        {
          id: 4,
          hashtag: "#SuperBowlOdds",
          category: "Betting",
          sentiment: "analytical",
          keyInsights: [
            "Early season odds showing major shifts",
            "Public money heavily on favorites",
            "Sharp money identifying value in underdogs"
          ]
        },
        {
          id: 5,
          hashtag: "#FantasyFootball", 
          category: "Sports",
          sentiment: "passionate",
          keyInsights: [
            "Waiver wire pickups creating huge impacts",
            "Injury reports affecting multiple lineups", 
            "Stack strategies proving most profitable"
          ]
        },
        {
          id: 6,
          hashtag: "#WorldCup2024",
          category: "Sports",
          sentiment: "euphoric",
          keyInsights: [
            "Underdog nations drawing massive support",
            "Goal totals exceeding expectations globally",
            "Live betting volume at record highs"
          ]
        }
      ];

      return baseTopics.map(topic => ({
        ...topic,
        tweets: Math.floor(Math.random() * 200000) + 50000,
        volume: `${Math.floor(Math.random() * 500 + 100)}K Tweets`,
        relevance: Math.floor(Math.random() * 20) + 80,
        change24h: Math.floor(Math.random() * 200) - 100
      }));
    };

    // Initial load
    const initialData = generateRealtimeData();
    setTrendingTopics(initialData);
    setLoading(false);

    // Update every 30 seconds to simulate real-time data
    const interval = setInterval(() => {
      const updatedData = generateRealtimeData();
      setTrendingTopics(updatedData);
      setLastUpdated(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    trendingTopics,
    loading,
    lastUpdated
  };
};