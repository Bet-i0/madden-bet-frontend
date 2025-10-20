-- Phase 5A: Markets & Selections Taxonomy

-- Markets taxonomy table
CREATE TABLE IF NOT EXISTS markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  settlement_rule TEXT,
  value_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_markets_code ON markets(code);

ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
CREATE POLICY markets_select_public ON markets FOR SELECT USING (true);

-- Selections taxonomy table
CREATE TABLE IF NOT EXISTS selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(market_id, code)
);

CREATE INDEX IF NOT EXISTS idx_selections_market ON selections(market_id);

ALTER TABLE selections ENABLE ROW LEVEL SECURITY;
CREATE POLICY selections_select_public ON selections FOR SELECT USING (true);

-- Seed NFL/NCAAF markets
INSERT INTO markets (code, display_name, settlement_rule, value_type) VALUES
  ('moneyline', 'Moneyline', 'Team wins the game', 'moneyline'),
  ('spread', 'Point Spread', 'Spread must be covered', 'points'),
  ('total', 'Game Total', 'Over/Under on total points', 'total'),
  ('player_passing_yards', 'Player Passing Yards', 'Includes OT if provider includes', 'player_prop'),
  ('player_rushing_yards', 'Player Rushing Yards', 'Includes OT if provider includes', 'player_prop'),
  ('player_receiving_yards', 'Player Receiving Yards', 'Includes OT if provider includes', 'player_prop'),
  ('player_anytime_td', 'Anytime TD Scorer', 'Player scores a TD anytime', 'player_prop'),
  ('player_passing_tds', 'Player Passing TDs', 'Total passing touchdowns', 'player_prop'),
  ('player_rushing_tds', 'Player Rushing TDs', 'Total rushing touchdowns', 'player_prop'),
  ('player_receptions', 'Player Receptions', 'Total catches', 'player_prop')
ON CONFLICT (code) DO NOTHING;

-- Team-market selections
INSERT INTO selections (market_id, code, display_name)
SELECT m.id, s.code, s.display_name
FROM markets m
CROSS JOIN (VALUES
  ('moneyline', 'home', 'Home'),
  ('moneyline', 'away', 'Away'),
  ('spread', 'home', 'Home - Spread'),
  ('spread', 'away', 'Away - Spread'),
  ('total', 'over', 'Over'),
  ('total', 'under', 'Under')
) AS s(market_code, code, display_name)
WHERE m.code = s.market_code
ON CONFLICT (market_id, code) DO NOTHING;

-- Player-prop selections (Over/Under)
INSERT INTO selections (market_id, code, display_name)
SELECT m.id, s.code, s.display_name
FROM markets m
CROSS JOIN (VALUES 
  ('over', 'Over'),
  ('under', 'Under')
) AS s(code, display_name)
WHERE m.code IN (
  'player_passing_yards', 
  'player_rushing_yards', 
  'player_receiving_yards', 
  'player_anytime_td',
  'player_passing_tds',
  'player_rushing_tds',
  'player_receptions'
)
ON CONFLICT (market_id, code) DO NOTHING;

-- Phase 5B: First-Party Analytics

-- Events analytics table
CREATE TABLE IF NOT EXISTS events_analytics (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id UUID NOT NULL,
  event TEXT NOT NULL,
  props JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_user ON events_analytics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_session ON events_analytics(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type ON events_analytics(event, created_at DESC);

ALTER TABLE events_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY events_analytics_ins_owner ON events_analytics FOR INSERT 
WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY events_analytics_sel_owner ON events_analytics FOR SELECT 
USING (
  user_id IS NULL OR 
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

-- Success Metrics Views

-- Social engagement metrics
CREATE OR REPLACE VIEW social_engagement_metrics AS
SELECT 
  COUNT(DISTINCT sb.id) AS total_shared_bets,
  COUNT(br.id) AS total_reactions,
  COUNT(bc.id) AS total_comments,
  COALESCE(AVG(reactions_per_bet), 0) AS avg_reactions_per_bet,
  COALESCE(AVG(comments_per_bet), 0) AS avg_comments_per_bet
FROM shared_bets sb
LEFT JOIN bet_reactions br ON br.shared_bet_id = sb.id
LEFT JOIN bet_comments bc ON bc.shared_bet_id = sb.id
CROSS JOIN LATERAL (
  SELECT 
    AVG(sb2.reactions_count)::numeric AS reactions_per_bet,
    AVG(sb2.comments_count)::numeric AS comments_per_bet
  FROM shared_bets sb2
  WHERE sb2.created_at >= NOW() - INTERVAL '7 days'
) stats;

-- CLV capture rate
CREATE OR REPLACE VIEW clv_capture_metrics AS
SELECT 
  COUNT(DISTINCT bl.id) AS total_bet_legs,
  COUNT(DISTINCT uc.bet_leg_id) AS legs_with_clv,
  ROUND((COUNT(DISTINCT uc.bet_leg_id)::numeric / NULLIF(COUNT(DISTINCT bl.id), 0)) * 100, 2) AS clv_capture_rate_percent
FROM bet_legs bl
LEFT JOIN user_clv uc ON uc.bet_leg_id = bl.id
WHERE bl.created_at >= NOW() - INTERVAL '7 days';

-- Tier conversion metrics
CREATE OR REPLACE VIEW tier_conversion_metrics AS
WITH user_tiers_history AS (
  SELECT 
    us.user_id,
    sp.code AS current_tier,
    us.created_at AS subscription_start,
    EXTRACT(DAY FROM NOW() - us.created_at) AS days_since_start
  FROM user_subscriptions us
  JOIN subscription_plans sp ON sp.id = us.plan_id
  WHERE us.is_active = true
)
SELECT 
  COUNT(*) FILTER (WHERE current_tier = 'starter') AS starter_users,
  COUNT(*) FILTER (WHERE current_tier = 'pro') AS pro_users,
  COUNT(*) FILTER (WHERE current_tier = 'degenerate') AS degenerate_users,
  COUNT(*) FILTER (
    WHERE current_tier IN ('pro', 'degenerate') 
    AND days_since_start <= 30
  ) AS upgraded_within_30_days,
  ROUND(
    (COUNT(*) FILTER (
      WHERE current_tier IN ('pro', 'degenerate') 
      AND days_since_start <= 30
    )::numeric / NULLIF(COUNT(*), 0)) * 100, 
    2
  ) AS conversion_rate_percent
FROM user_tiers_history
WHERE days_since_start <= 30;

-- Edge function latency tracking (requires function to log to this table)
CREATE TABLE IF NOT EXISTS edge_function_metrics (
  id BIGSERIAL PRIMARY KEY,
  function_name TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edge_metrics_func ON edge_function_metrics(function_name, created_at DESC);

-- P95 latency view
CREATE OR REPLACE VIEW edge_function_p95_latency AS
SELECT 
  function_name,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_latency_ms,
  AVG(duration_ms) AS avg_latency_ms,
  COUNT(*) AS request_count,
  COUNT(*) FILTER (WHERE status_code >= 500) AS error_count
FROM edge_function_metrics
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY function_name;