
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
