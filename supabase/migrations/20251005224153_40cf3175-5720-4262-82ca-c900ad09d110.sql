-- Create function to compute prop edges for AI analysis
CREATE OR REPLACE FUNCTION public.compute_prop_edges()
RETURNS TABLE (
  sport text,
  league text,
  team1 text,
  team2 text,
  player text,
  market text,
  side text,
  line numeric,
  event_id text,
  game_date timestamptz,
  consensus_odds numeric,
  best_odds numeric,
  best_book text,
  book_count bigint,
  edge_percent numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH prop_stats AS (
    SELECT 
      pps.sport,
      pps.league,
      pps.team1,
      pps.team2,
      pps.player,
      pps.market,
      pps.side,
      pps.line,
      pps.event_id,
      pps.game_date,
      AVG(pps.odds) as consensus_odds,
      MAX(pps.odds) as best_odds,
      (array_agg(pps.bookmaker ORDER BY pps.odds DESC))[1] as best_book,
      COUNT(DISTINCT pps.bookmaker) as book_count
    FROM player_props_snapshots pps
    WHERE pps.game_date >= now()
      AND pps.game_date <= now() + interval '24 hours'
    GROUP BY 
      pps.sport, pps.league, pps.team1, pps.team2, 
      pps.player, pps.market, pps.side, pps.line, 
      pps.event_id, pps.game_date
    HAVING COUNT(DISTINCT pps.bookmaker) >= 2
  )
  SELECT 
    ps.*,
    ROUND(((ps.best_odds - ps.consensus_odds) / ps.consensus_odds * 100)::numeric, 2) as edge_percent
  FROM prop_stats ps
  WHERE ps.best_odds > ps.consensus_odds
  ORDER BY edge_percent DESC;
$$;