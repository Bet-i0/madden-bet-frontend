import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CLVData {
  bet_leg_id: string;
  bet_id: string;
  user_id: string;
  sport: string;
  league: string;
  team1: string;
  team2: string;
  game_date: string;
  market: string;
  selection: string;
  placed_decimal_odds: number;
  closing_decimal_odds: number | null;
  closing_bookmaker: string | null;
  clv_bps: number | null;
  clv_tier: 'positive' | 'negative' | 'neutral' | 'unknown';
  bet_status: string;
  settled_at: string | null;
}

export function useCLV(userId?: string) {
  return useQuery({
    queryKey: ['clv', userId],
    queryFn: async () => {
      let query = supabase
        .from('user_clv')
        .select('*')
        .order('game_date', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CLVData[];
    },
    enabled: !!userId,
  });
}

export function useBetCLV(betId: string) {
  return useQuery({
    queryKey: ['bet-clv', betId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_clv')
        .select('*')
        .eq('bet_id', betId);

      if (error) throw error;
      return data as CLVData[];
    },
    enabled: !!betId,
  });
}

// Calculate aggregate CLV stats
export function useCLVStats(userId?: string) {
  const { data: clvData, ...rest } = useCLV(userId);

  const stats = {
    avgCLV: 0,
    positiveCLVCount: 0,
    negativeCLVCount: 0,
    totalWithCLV: 0,
    clvDistribution: [] as { tier: string; count: number }[],
  };

  if (clvData) {
    const withCLV = clvData.filter(d => d.clv_bps !== null);
    stats.totalWithCLV = withCLV.length;

    if (withCLV.length > 0) {
      stats.avgCLV = withCLV.reduce((sum, d) => sum + (d.clv_bps || 0), 0) / withCLV.length;
      stats.positiveCLVCount = withCLV.filter(d => (d.clv_bps || 0) > 50).length;
      stats.negativeCLVCount = withCLV.filter(d => (d.clv_bps || 0) < -50).length;
    }

    // Distribution
    const distribution = withCLV.reduce((acc, d) => {
      const tier = d.clv_tier;
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    stats.clvDistribution = Object.entries(distribution).map(([tier, count]) => ({
      tier,
      count,
    }));
  }

  return { ...rest, data: clvData, stats };
}
