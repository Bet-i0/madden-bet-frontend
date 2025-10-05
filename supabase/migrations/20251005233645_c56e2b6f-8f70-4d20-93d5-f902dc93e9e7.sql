-- Create consensus odds view
CREATE OR REPLACE VIEW prop_consensus_odds_v AS
WITH upcoming_props AS (
  SELECT 
    game_date,
    player,
    market,
    line,
    bookmaker,
    odds,
    1.0 / NULLIF(odds, 0) as implied_prob
  FROM player_props_snapshots
  WHERE game_date >= now()
    AND game_date <= now() + interval '24 hours'
    AND odds > 0
),
consensus_calcs AS (
  SELECT 
    game_date,
    player,
    market,
    line,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY implied_prob) as median_prob,
    COUNT(DISTINCT bookmaker) as book_count
  FROM upcoming_props
  GROUP BY game_date, player, market, line
  HAVING COUNT(DISTINCT bookmaker) >= 2
)
SELECT 
  game_date,
  player,
  market,
  line,
  median_prob as consensus_prob,
  1.0 / NULLIF(median_prob, 0) as consensus_odds,
  book_count
FROM consensus_calcs;

-- Grant access to authenticated users
GRANT SELECT ON prop_consensus_odds_v TO authenticated;

-- Create fn_value_hunter function
CREATE OR REPLACE FUNCTION fn_value_hunter(
  as_of timestamptz DEFAULT now(),
  top_n int DEFAULT 30
)
RETURNS TABLE (
  game_date timestamptz,
  player text,
  market text,
  line numeric,
  best_book text,
  best_odds numeric,
  consensus_odds numeric,
  book_count bigint,
  edge_prob numeric,
  edge_bps numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH best_prices AS (
    SELECT 
      pps.game_date,
      pps.player,
      pps.market,
      pps.line,
      pps.bookmaker as best_book,
      pps.odds as best_odds,
      1.0 / NULLIF(pps.odds, 0) as best_prob
    FROM player_props_snapshots pps
    INNER JOIN (
      SELECT 
        game_date,
        player,
        market,
        line,
        MAX(odds) as max_odds
      FROM player_props_snapshots
      WHERE game_date >= as_of
        AND game_date <= as_of + interval '24 hours'
        AND odds > 0
      GROUP BY game_date, player, market, line
    ) best ON 
      pps.game_date = best.game_date
      AND pps.player = best.player
      AND pps.market = best.market
      AND pps.line = best.line
      AND pps.odds = best.max_odds
  ),
  value_picks AS (
    SELECT 
      bp.game_date,
      bp.player,
      bp.market,
      bp.line,
      bp.best_book,
      bp.best_odds,
      cv.consensus_odds,
      cv.book_count,
      cv.consensus_prob - bp.best_prob as edge_prob,
      10000 * (bp.best_odds / NULLIF(cv.consensus_odds, 0) - 1) as edge_bps
    FROM best_prices bp
    INNER JOIN prop_consensus_odds_v cv
      ON bp.game_date = cv.game_date
      AND bp.player = cv.player
      AND bp.market = cv.market
      AND bp.line = cv.line
    WHERE cv.book_count >= 2
      AND (cv.consensus_prob - bp.best_prob) >= 0.03
  )
  SELECT * 
  FROM value_picks
  ORDER BY edge_bps DESC, edge_prob DESC
  LIMIT top_n;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION fn_value_hunter(timestamptz, int) TO authenticated;

COMMENT ON FUNCTION fn_value_hunter IS 'Returns player props with positive value (best odds vs consensus), ordered by edge in basis points';
