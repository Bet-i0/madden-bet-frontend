import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OddsData {
  id: string;
  team1: string;
  team2: string;
  league: string;
  sport: string;
  market: string;
  odds: number;
  bookmaker: string;
  game_date: string | null;
  last_updated: string;
}

interface GroupedOdds {
  matchup: string;
  team1: string;
  team2: string;
  league: string;
  sport: string;
  game_date: string | null;
  h2h_odds: { bookmaker: string; odds: number }[];
  spread_odds: { bookmaker: string; odds: number; market: string }[];
  total_odds: { bookmaker: string; odds: number; market: string }[];
}

export const useOddsForStrategies = () => {
  const [odds, setOdds] = useState<GroupedOdds[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOdds = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get odds for live and upcoming games within 1 day
        const now = new Date();
        const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        const { data: allOdds, error: fetchError } = await supabase
          .from('odds_snapshots')
          .select('*')
          .gte('game_date', sixHoursAgo.toISOString())
          .lte('game_date', oneDayFromNow.toISOString())
          .order('last_updated', { ascending: false })
          .limit(200); // Get enough data to work with

        if (fetchError) {
          throw fetchError;
        }

        if (!allOdds || allOdds.length === 0) {
          setOdds([]);
          return;
        }

        // Group odds by matchup and organize by market type
        const groupedOdds = allOdds.reduce((acc, curr) => {
          const matchKey = `${curr.team1}-${curr.team2}-${curr.league}`;
          
          if (!acc[matchKey]) {
            acc[matchKey] = {
              matchup: matchKey,
              team1: curr.team1,
              team2: curr.team2,
              league: curr.league,
              sport: curr.sport,
              game_date: curr.game_date,
              h2h_odds: [],
              spread_odds: [],
              total_odds: []
            };
          }

          // Categorize odds by market type
          if (curr.market.startsWith('h2h')) {
            acc[matchKey].h2h_odds.push({
              bookmaker: curr.bookmaker,
              odds: curr.odds
            });
          } else if (curr.market.includes('spread')) {
            acc[matchKey].spread_odds.push({
              bookmaker: curr.bookmaker,
              odds: curr.odds,
              market: curr.market
            });
          } else if (curr.market.includes('total')) {
            acc[matchKey].total_odds.push({
              bookmaker: curr.bookmaker,
              odds: curr.odds,
              market: curr.market
            });
          }

          return acc;
        }, {} as Record<string, GroupedOdds>);

        // Convert to array and sort by game date (prioritize today's games)
        const oddsArray = Object.values(groupedOdds)
          .filter(game => 
            game.h2h_odds.length > 0 || 
            game.spread_odds.length > 0 || 
            game.total_odds.length > 0
          )
          .sort((a, b) => {
            const dateA = a.game_date ? new Date(a.game_date) : new Date('2099-01-01');
            const dateB = b.game_date ? new Date(b.game_date) : new Date('2099-01-01');
            return dateA.getTime() - dateB.getTime();
          })
          .slice(0, 12); // Limit to 12 games for performance

        setOdds(oddsArray);
      } catch (err) {
        console.error('Error fetching strategy odds:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch odds');
      } finally {
        setLoading(false);
      }
    };

    fetchOdds();
  }, []);

  return { odds, loading, error };
};