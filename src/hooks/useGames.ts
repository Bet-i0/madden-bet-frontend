import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Game {
  id: string;
  provider: string;
  provider_game_id: string;
  league: string;
  season: string | null;
  starts_at: string;
  status: string;
  home_team: string;
  away_team: string;
  venue: string | null;
  created_at: string;
  updated_at: string;
}

interface UseGamesOptions {
  league?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export const useGames = (options: UseGamesOptions = {}) => {
  return useQuery({
    queryKey: ['games', options],
    queryFn: async () => {
      let query = supabase
        .from('games')
        .select('*')
        .order('starts_at', { ascending: true });

      if (options.league) {
        query = query.eq('league', options.league);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.startDate) {
        query = query.gte('starts_at', options.startDate.toISOString());
      }

      if (options.endDate) {
        query = query.lte('starts_at', options.endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Game[];
    },
  });
};

export const useUpcomingGames = (league?: string) => {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return useGames({
    league,
    status: 'scheduled',
    startDate: now,
    endDate: tomorrow,
  });
};
