-- Create materialized view for momentum tracking
CREATE MATERIALIZED VIEW IF NOT EXISTS prop_momentum_15m AS
WITH time_windows AS (
  SELECT 
    game_date,
    player,
    market,
    line,
    bookmaker,
    odds,
    seen_minute,
    LAG(odds, 1) OVER (PARTITION BY player, market, line, bookmaker ORDER BY seen_minute) as odds_15m_ago,
    LAG(odds, 4) OVER (PARTITION BY player, market, line, bookmaker ORDER BY seen_minute) as odds_60m_ago
  FROM player_props_history
  WHERE game_date >= now()
    AND game_date <= now() + interval '24 hours'
),
consensus_windows AS (
  SELECT 
    game_date,
    player,
    market,
    line,
    seen_minute,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY odds) as consensus_odds,
    LAG(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY odds), 1) OVER (PARTITION BY player, market, line ORDER BY seen_minute) as consensus_15m_ago,
    LAG(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY odds), 4) OVER (PARTITION BY player, market, line ORDER BY seen_minute) as consensus_60m_ago
  FROM player_props_history
  WHERE game_date >= now()
    AND game_date <= now() + interval '24 hours'
  GROUP BY game_date, player, market, line, seen_minute
)
SELECT DISTINCT ON (tw.player, tw.market, tw.line, tw.bookmaker)
  tw.game_date,
  tw.player,
  tw.market,
  tw.line,
  tw.bookmaker,
  tw.odds as odds_now,
  tw.odds_15m_ago,
  tw.odds_60m_ago,
  COALESCE(tw.odds - tw.odds_15m_ago, 0) as odds_change_15m,
  COALESCE(tw.odds - tw.odds_60m_ago, 0) as odds_change_60m,
  cw.consensus_odds as consensus_now,
  cw.consensus_15m_ago,
  cw.consensus_60m_ago,
  COALESCE(cw.consensus_odds - cw.consensus_15m_ago, 0) as consensus_change_15m,
  COALESCE(cw.consensus_odds - cw.consensus_60m_ago, 0) as consensus_change_60m,
  tw.seen_minute as last_seen
FROM time_windows tw
LEFT JOIN consensus_windows cw 
  ON tw.game_date = cw.game_date
  AND tw.player = cw.player
  AND tw.market = cw.market
  AND tw.line = cw.line
  AND tw.seen_minute = cw.seen_minute
WHERE tw.odds_15m_ago IS NOT NULL
ORDER BY tw.player, tw.market, tw.line, tw.bookmaker, tw.seen_minute DESC;

CREATE INDEX IF NOT EXISTS idx_prop_momentum_player_market ON prop_momentum_15m(player, market, line);
CREATE INDEX IF NOT EXISTS idx_prop_momentum_consensus_change ON prop_momentum_15m(consensus_change_15m, consensus_change_60m);

GRANT SELECT ON prop_momentum_15m TO authenticated;

CREATE OR REPLACE FUNCTION refresh_prop_momentum()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW prop_momentum_15m;
END;
$$;

GRANT EXECUTE ON FUNCTION refresh_prop_momentum() TO authenticated;

CREATE OR REPLACE FUNCTION fn_momentum_surge(result_limit int DEFAULT 30)
RETURNS TABLE (
  game_date timestamptz,
  player text,
  market text,
  line numeric,
  bookmaker text,
  odds_now numeric,
  odds_change_15m numeric,
  odds_change_60m numeric,
  consensus_change_15m numeric,
  consensus_change_60m numeric,
  momentum_score numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH momentum_calcs AS (
    SELECT 
      pm.game_date,
      pm.player,
      pm.market,
      pm.line,
      pm.bookmaker,
      pm.odds_now,
      pm.odds_change_15m,
      pm.odds_change_60m,
      pm.consensus_change_15m,
      pm.consensus_change_60m,
      (0.6 * ABS(pm.consensus_change_15m) + 0.4 * ABS(pm.consensus_change_60m))::numeric as momentum_score
    FROM prop_momentum_15m pm
    WHERE pm.game_date >= now()
      AND pm.game_date <= now() + interval '24 hours'
      AND (
        ABS(pm.consensus_change_15m) >= 0.05 
        OR ABS(pm.consensus_change_60m) >= 0.05
      )
  )
  SELECT 
    mc.game_date,
    mc.player,
    mc.market,
    mc.line,
    mc.bookmaker,
    mc.odds_now,
    mc.odds_change_15m,
    mc.odds_change_60m,
    mc.consensus_change_15m,
    mc.consensus_change_60m,
    round(mc.momentum_score, 4) as momentum_score
  FROM momentum_calcs mc
  ORDER BY mc.momentum_score DESC
  LIMIT result_limit;
$$;

GRANT EXECUTE ON FUNCTION fn_momentum_surge(int) TO authenticated;

COMMENT ON FUNCTION fn_momentum_surge IS 'Returns props with significant momentum (rapid line movement) in last 15-60 minutes';
