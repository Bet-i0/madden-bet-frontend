import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';

interface OddsSnapshot {
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

const MatchSpotlight = () => {
  const [games, setGames] = useState<OddsSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveGames = async () => {
      try {
        const now = new Date();
        const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        const { data, error } = await supabase
          .from('odds_snapshots')
          .select('*')
          .in('sport', ['americanfootball_nfl', 'americanfootball_ncaaf']) // Focus strictly on football
          .in('bookmaker', ['draftkings', 'betmgm', 'fanduel', 'caesars', 'williamhill_us']) // Target bookmakers only
          .like('market', 'h2h%') // head-to-head/moneyline odds (includes team selections)
          .gte('game_date', sixHoursAgo.toISOString())
          .lte('game_date', oneDayFromNow.toISOString())
          .order('last_updated', { ascending: false })
          .limit(16);

        if (error) {
          console.error('Error fetching odds:', error);
          return;
        }

        // Group by matchup and take the most recent odds
        const uniqueGames = data?.reduce((acc, curr) => {
          const matchKey = `${curr.team1}-${curr.team2}`;
          if (!acc[matchKey] || new Date(curr.last_updated) > new Date(acc[matchKey].last_updated)) {
            acc[matchKey] = curr;
          }
          return acc;
        }, {} as Record<string, OddsSnapshot>);

        setGames(Object.values(uniqueGames || {}).slice(0, 4));
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveGames();
  }, []);

  if (loading) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-sports mb-3 text-foreground">Live Odds</h2>
        <div className="flex space-x-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="gaming-card min-w-[200px] animate-pulse">
              <CardContent className="p-3">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-sports mb-3 text-foreground">Live Odds</h2>
      <ScrollArea className="w-full">
        <div className="flex space-x-4 pb-2">
          {games.length > 0 ? games.map((game) => (
            <Card 
              key={game.id} 
              className="gaming-card min-w-[200px] cursor-pointer hover:animate-card-hover"
            >
              <CardContent className="p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary">
                    {game.league}
                  </span>
                  <span className="text-xs text-muted-foreground">{game.bookmaker}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{game.team1}</span>
                    <span className="text-sm font-mono text-neon-green">
                      {game.odds > 0 ? `+${game.odds}` : game.odds}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{game.team2}</span>
                    <span className="text-sm text-muted-foreground">vs</span>
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    Updated: {new Date(game.last_updated).toLocaleTimeString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="text-center py-8 text-muted-foreground w-full">
              <p>No live odds available</p>
              <p className="text-sm">Odds refresh every 4 hours</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MatchSpotlight;