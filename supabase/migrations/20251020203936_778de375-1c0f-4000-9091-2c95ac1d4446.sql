-- Phase 1-3: Critical UX & Data Quality Infrastructure (FIXED)
-- Adds CLV tracking, odds closing prices, line movement views, and user settings

-- ============================================================================
-- PHASE 1: CLV TRACKING INFRASTRUCTURE
-- ============================================================================

-- Table: odds_closing (store closing prices at game kickoff)
CREATE TABLE IF NOT EXISTS odds_closing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sport text NOT NULL,
  league text NOT NULL,
  team1 text NOT NULL,
  team2 text NOT NULL,
  game_date timestamptz NOT NULL,
  market text NOT NULL,
  selection text NOT NULL,
  line numeric,
  decimal_odds numeric NOT NULL,
  bookmaker text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sport, league, team1, team2, game_date, market, selection, bookmaker)
);

-- Enable RLS on odds_closing
ALTER TABLE odds_closing ENABLE ROW LEVEL SECURITY;

-- Public read policy for odds_closing
CREATE POLICY odds_closing_select_public ON odds_closing
  FOR SELECT USING (true);

-- Service role can insert/update closing odds
CREATE POLICY odds_closing_service_role ON odds_closing
  FOR ALL USING (auth.role() = 'service_role');

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_odds_closing_lookup 
  ON odds_closing(sport, league, team1, team2, game_date, market, selection);

-- ============================================================================
-- VIEW: user_clv (calculate CLV per bet leg)
-- NOTE: bet_legs doesn't track line separately, so we match without line
-- ============================================================================
CREATE OR REPLACE VIEW user_clv AS
SELECT 
  bl.id as bet_leg_id,
  b.id as bet_id,
  b.user_id,
  bl.sport,
  bl.league,
  bl.team1,
  bl.team2,
  bl.game_date,
  bl.bet_market as market,
  bl.bet_selection as selection,
  bl.odds as placed_decimal_odds,
  bl.closing_odds as closing_decimal_odds,
  oc.bookmaker as closing_bookmaker,
  CASE 
    WHEN bl.closing_odds IS NULL THEN NULL
    ELSE ROUND(((bl.closing_odds - bl.odds) / NULLIF(bl.odds, 0) * 10000.0)::numeric, 2)
  END as clv_bps,
  CASE 
    WHEN bl.closing_odds IS NULL THEN 'unknown'
    WHEN ((bl.closing_odds - bl.odds) / NULLIF(bl.odds, 0) * 10000.0) > 50 THEN 'positive'
    WHEN ((bl.closing_odds - bl.odds) / NULLIF(bl.odds, 0) * 10000.0) < -50 THEN 'negative'
    ELSE 'neutral'
  END as clv_tier,
  b.status as bet_status,
  b.settled_at
FROM bet_legs bl
JOIN bets b ON b.id = bl.bet_id
LEFT JOIN odds_closing oc 
  ON oc.sport = bl.sport
  AND oc.league = bl.league
  AND oc.team1 = bl.team1
  AND oc.team2 = bl.team2
  AND oc.market = bl.bet_market
  AND oc.selection = bl.bet_selection
  AND DATE_TRUNC('day', oc.game_date) = DATE_TRUNC('day', bl.game_date);

GRANT SELECT ON user_clv TO authenticated, anon;

-- ============================================================================
-- PHASE 2: LINE MOVEMENT & BEST PRICE VIEWS
-- ============================================================================

-- VIEW: line_moves (minute-bucketed odds history for sparklines)
CREATE OR REPLACE VIEW line_moves AS
SELECT
  pps.sport,
  pps.league,
  pps.team1,
  pps.team2,
  pps.game_date,
  pps.market,
  pps.player,
  pps.line,
  DATE_TRUNC('minute', pps.last_updated) as minute_bucket,
  AVG(pps.odds) as avg_odds,
  COUNT(DISTINCT pps.bookmaker) as book_count
FROM player_props_snapshots pps
WHERE pps.last_updated > NOW() - INTERVAL '7 days'
GROUP BY 1,2,3,4,5,6,7,8,9
ORDER BY minute_bucket DESC;

GRANT SELECT ON line_moves TO authenticated, anon;

-- VIEW: next_best_odds (best and second-best odds for edge display)
CREATE OR REPLACE VIEW next_best_odds AS
WITH ranked_odds AS (
  SELECT 
    pps.sport,
    pps.league,
    pps.team1,
    pps.team2,
    pps.game_date,
    pps.market,
    pps.player,
    pps.line,
    pps.bookmaker,
    pps.odds,
    ROW_NUMBER() OVER (
      PARTITION BY pps.sport, pps.league, pps.team1, pps.team2, pps.market, pps.player, pps.line
      ORDER BY pps.odds DESC
    ) as rank
  FROM player_props_snapshots pps
  WHERE pps.last_updated > NOW() - INTERVAL '2 hours'
    AND pps.game_date >= NOW()
    AND pps.odds > 0
)
SELECT 
  sport,
  league,
  team1,
  team2,
  game_date,
  market,
  player,
  line,
  MAX(CASE WHEN rank = 1 THEN bookmaker END) as best_bookmaker,
  MAX(CASE WHEN rank = 1 THEN odds END) as best_odds,
  MAX(CASE WHEN rank = 2 THEN bookmaker END) as next_best_bookmaker,
  MAX(CASE WHEN rank = 2 THEN odds END) as next_best_odds,
  ROUND(((MAX(CASE WHEN rank = 1 THEN odds END) - MAX(CASE WHEN rank = 2 THEN odds END)) 
    / NULLIF(MAX(CASE WHEN rank = 2 THEN odds END), 0) * 10000.0)::numeric, 0) as edge_bps
FROM ranked_odds
WHERE rank <= 2
GROUP BY 1,2,3,4,5,6,7,8;

GRANT SELECT ON next_best_odds TO authenticated, anon;

-- ============================================================================
-- PHASE 3: USER SETTINGS ENHANCEMENTS
-- ============================================================================

-- Add unit_size and accessibility preferences to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS unit_size numeric(10,2),
  ADD COLUMN IF NOT EXISTS accessibility_preferences jsonb DEFAULT '{
    "reduceMotion": false,
    "highContrast": false,
    "screenReaderOptimized": false
  }'::jsonb;

-- ============================================================================
-- FUNCTION: get_closing_prices (snapshot closing odds at kickoff)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_closing_prices(
  p_sport text,
  p_league text,
  p_team1 text,
  p_team2 text,
  p_game_date timestamptz
)
RETURNS TABLE(
  market text,
  selection text,
  line numeric,
  bookmaker text,
  decimal_odds numeric,
  captured_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (pps.market, pps.bookmaker)
    pps.market,
    pps.side as selection,
    pps.line,
    pps.bookmaker,
    pps.odds as decimal_odds,
    pps.last_updated as captured_at
  FROM player_props_snapshots pps
  WHERE pps.sport = p_sport
    AND pps.league = p_league
    AND pps.team1 = p_team1
    AND pps.team2 = p_team2
    AND DATE_TRUNC('day', pps.game_date) = DATE_TRUNC('day', p_game_date)
    AND pps.last_updated >= p_game_date - INTERVAL '30 minutes'
    AND pps.last_updated <= p_game_date + INTERVAL '5 minutes'
  ORDER BY pps.market, pps.bookmaker, pps.last_updated DESC;
$$;

GRANT EXECUTE ON FUNCTION get_closing_prices(text, text, text, text, timestamptz) TO authenticated, service_role;