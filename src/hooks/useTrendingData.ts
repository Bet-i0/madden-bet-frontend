import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

  const fetchTrendingData = async () => {
    try {
      setLoading(true);
      
      // Call the trending-data Edge Function for real-time data
      const { data, error } = await supabase.functions.invoke('trending-data');

      if (error) {
        console.error('Error calling trending-data function:', error);
        toast({
          title: "Trending data unavailable",
          description: "Using cached trending topics.",
          variant: "destructive",
        });
        
        // Use fallback data if API fails
        setTrendingTopics(getFallbackTopics());
        return;
      }

      const topics = data.trendingTopics || [];
      setTrendingTopics(topics);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error fetching trending data:', error);
      toast({
        title: "Error loading trends",
        description: "Unable to load trending data right now.",
        variant: "destructive",
      });
      
      // Use fallback data on error
      setTrendingTopics(getFallbackTopics());
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTrendingData();
  }, []);

  // Update every 5 minutes for real-time feel
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTrendingData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const getFallbackTopics = (): TrendingTopic[] => {
    // Minimal fallback data for when API is unavailable
    return [
      {
        id: 1,
        hashtag: "#NFLSunday",
        tweets: 245000,
        category: "Sports",
        volume: "245K Tweets",
        sentiment: "excited",
        relevance: 92,
        keyInsights: [
          "Home favorites covering at higher rate this week",
          "Weather conditions affecting outdoor game totals", 
          "Key injury reports creating line movement"
        ],
        change24h: 35
      },
      {
        id: 2,
        hashtag: "#NBABets",
        tweets: 156000,
        category: "Sports",
        volume: "156K Tweets",
        sentiment: "analytical",
        relevance: 88,
        keyInsights: [
          "Road teams performing better ATS lately",
          "Player prop overs hitting at high clip",
          "Back-to-back situations creating value"
        ],
        change24h: -12
      },
      {
        id: 3,
        hashtag: "#SportsBetting",
        tweets: 198000,
        category: "Betting",
        volume: "198K Tweets",
        sentiment: "positive",
        relevance: 85,
        keyInsights: [
          "Sharp money identifying value in contrarian plays",
          "Public perception vs actual line value showing gaps",
          "Live betting volume increasing significantly"
        ],
        change24h: 67
      }
    ];
  };

  return {
    trendingTopics,
    loading,
    lastUpdated,
    refetch: fetchTrendingData
  };
};