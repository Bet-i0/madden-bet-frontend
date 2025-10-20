import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LineMovementData {
  sport: string;
  league: string;
  team1: string;
  team2: string;
  game_date: string;
  market: string;
  player: string | null;
  line: number | null;
  minute_bucket: string;
  avg_odds: number;
  book_count: number;
}

interface LineMovementParams {
  sport: string;
  league: string;
  team1: string;
  team2: string;
  market: string;
  player?: string;
  line?: number;
}

export function useLineMovement(params: LineMovementParams) {
  return useQuery({
    queryKey: ['line-movement', params],
    queryFn: async () => {
      let query = supabase
        .from('line_moves')
        .select('*')
        .eq('sport', params.sport)
        .eq('league', params.league)
        .eq('team1', params.team1)
        .eq('team2', params.team2)
        .eq('market', params.market)
        .order('minute_bucket', { ascending: true })
        .limit(100);

      if (params.player) {
        query = query.eq('player', params.player);
      }

      if (params.line !== undefined) {
        query = query.eq('line', params.line);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as LineMovementData[];
    },
    enabled: !!params.sport && !!params.league && !!params.team1 && !!params.team2 && !!params.market,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

interface NextBestOddsData {
  sport: string;
  league: string;
  team1: string;
  team2: string;
  game_date: string;
  market: string;
  player: string | null;
  line: number | null;
  best_bookmaker: string;
  best_odds: number;
  next_best_bookmaker: string | null;
  next_best_odds: number | null;
  edge_bps: number | null;
}

export function useNextBestOdds(params: LineMovementParams) {
  return useQuery({
    queryKey: ['next-best-odds', params],
    queryFn: async () => {
      let query = supabase
        .from('next_best_odds')
        .select('*')
        .eq('sport', params.sport)
        .eq('league', params.league)
        .eq('team1', params.team1)
        .eq('team2', params.team2)
        .eq('market', params.market)
        .limit(1);

      if (params.player) {
        query = query.eq('player', params.player);
      }

      if (params.line !== undefined) {
        query = query.eq('line', params.line);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data?.[0] as NextBestOddsData | null;
    },
    enabled: !!params.sport && !!params.league && !!params.team1 && !!params.team2 && !!params.market,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
