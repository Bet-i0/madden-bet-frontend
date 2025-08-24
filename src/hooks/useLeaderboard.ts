
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DEMO_MODE = true;

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  bets_count: number;
  wins: number;
  losses: number;
  pushes: number;
  profit: number;
  total_staked: number;
  roi_percent: number;
  win_rate_percent: number;
  last_settled_at?: string;
}

export const useLeaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = async (sortBy: 'roi_percent' | 'win_rate_percent' | 'profit' = 'roi_percent') => {
    setLoading(true);
    try {
      if (DEMO_MODE) {
        // Demo leaderboard data for MVP presentation
        const demoEntries: LeaderboardEntry[] = [
          {
            user_id: 'demo-1',
            display_name: 'BettingKing92',
            avatar_url: null,
            bets_count: 47,
            wins: 32,
            losses: 13,
            pushes: 2,
            profit: 2847.50,
            total_staked: 9400,
            roi_percent: 30.3,
            win_rate_percent: 68.1,
            last_settled_at: new Date(Date.now() - 2 * 60 * 60000).toISOString()
          },
          {
            user_id: 'demo-2', 
            display_name: 'AnalyticsAce',
            avatar_url: null,
            bets_count: 38,
            wins: 25,
            losses: 11,
            pushes: 2,
            profit: 1923.75,
            total_staked: 7600,
            roi_percent: 25.3,
            win_rate_percent: 65.8,
            last_settled_at: new Date(Date.now() - 4 * 60 * 60000).toISOString()
          },
          {
            user_id: 'demo-3',
            display_name: 'ParlayPro',
            avatar_url: null,
            bets_count: 29,
            wins: 18,
            losses: 9,
            pushes: 2,
            profit: 1456.25,
            total_staked: 5800,
            roi_percent: 25.1,
            win_rate_percent: 62.1,
            last_settled_at: new Date(Date.now() - 1 * 60 * 60000).toISOString()
          },
          {
            user_id: 'demo-4',
            display_name: 'SportsBettor23',
            avatar_url: null,
            bets_count: 52,
            wins: 31,
            losses: 19,
            pushes: 2,
            profit: 1123.50,
            total_staked: 10400,
            roi_percent: 10.8,
            win_rate_percent: 59.6,
            last_settled_at: new Date(Date.now() - 6 * 60 * 60000).toISOString()
          }
        ];
        
        setEntries(demoEntries);
        return;
      }

      const { data, error } = await supabase
        .from('leaderboard_stats')
        .select('*')
        .gte('bets_count', 5) // Minimum 5 bets to be on leaderboard
        .order(sortBy, { ascending: false })
        .limit(50);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return {
    entries,
    loading,
    refetch: fetchLeaderboard
  };
};
