-- Drop old momentum surge function
DROP FUNCTION IF EXISTS fn_momentum_surge(int);

-- Drop old momentum MV if it exists
DROP MATERIALIZED VIEW IF EXISTS prop_momentum_15m CASCADE;

-- Add indexes for fast history lookups
CREATE INDEX IF NOT EXISTS idx_props_history_event_player_market 
  ON player_props_history(event_key, player, market, line, bookmaker, seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_props_history_player_market 
  ON player_props_history(player, market);

CREATE INDEX IF NOT EXISTS idx_props_snapshots_game_date 
  ON player_props_snapshots(game_date DESC);

-- Create latest minute view (rolling 90m)
CREATE OR REPLACE VIEW prop_latest_minute_v AS
WITH upcoming_games AS (
  SELECT DISTINCT
    md5(
      coalesce(sport,'')||'|'||coalesce(league,'')||'|'||
      coalesce(team1,'')||'|'||coalesce(team2,'')||'|'||
      to_char(game_date, 'YYYY-MM-DD"T"HH24:MI:SSOF')
    ) as event_key,
    game_date
  FROM player_props_snapshots
  WHERE game_date BETWEEN now() AND now() + interval '24 hours'
),
recent_history AS (
  SELECT 
    date_trunc('minute', h.seen_at) as minute_bucket,
    h.event_key,
    h.player,
    h.market,
    h.line,
    h.bookmaker,
    h.odds,
    h.seen_at,
    ROW_NUMBER() OVER (
      PARTITION BY h.event_key, h.player, h.market, h.line, h.bookmaker, date_trunc('minute', h.seen_at)
      ORDER BY h.seen_at DESC
    ) as rn
  FROM player_props_history h
  INNER JOIN upcoming_games ug ON h.event_key = ug.event_key
  WHERE h.seen_at >= now() - interval '90 minutes'
    AND h.seen_at <= now()
)
SELECT 
  minute_bucket,
  event_key,
  player,
  market,
  line,
  bookmaker,
  odds
FROM recent_history
WHERE rn = 1;

GRANT SELECT ON prop_latest_minute_v TO authenticated;

-- Create consensus probability helper function
CREATE OR REPLACE FUNCTION fn_consensus_prob_at(
  anchor timestamptz,
  p_event_key text,
  p_player text,
  p_market text,
  p_line numeric
)
RETURNS TABLE (
  consensus_prob numeric,
  book_count int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH anchor_odds AS (
    SELECT 
      bookmaker,
      odds,
      1.0 / NULLIF(odds, 0) as implied_prob
    FROM prop_latest_minute_v
    WHERE minute_bucket <= anchor
      AND event_key = p_event_key
      AND player = p_player
      AND market = p_market
      AND line = p_line
      AND odds > 0
  )
  SELECT 
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY implied_prob)::numeric as consensus_prob,
    COUNT(*)::int as book_count
  FROM anchor_odds;
$$;

GRANT EXECUTE ON FUNCTION fn_consensus_prob_at(timestamptz, text, text, text, numeric) TO authenticated;
