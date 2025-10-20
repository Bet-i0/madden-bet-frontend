-- Phase 4A: Canonical Games & Players Tables

-- 1. Games (canonical fixtures)
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'the-odds-api',
  provider_game_id TEXT NOT NULL,
  league TEXT NOT NULL CHECK (league IN ('NFL', 'NCAAF')),
  season TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  venue TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_game_id)
);

CREATE INDEX IF NOT EXISTS idx_games_league_start ON games(league, starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status) WHERE status IN ('scheduled', 'live');

ALTER TABLE games ENABLE ROW LEVEL SECURITY;
CREATE POLICY games_select_public ON games FOR SELECT USING (true);

-- 2. Players (minimal for props)
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL DEFAULT 'the-odds-api',
  provider_player_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position TEXT,
  team TEXT,
  league TEXT NOT NULL CHECK (league IN ('NFL', 'NCAAF')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_player_id)
);

CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY players_select_public ON players FOR SELECT USING (true);

-- 3. Add game_id FK to odds tables
ALTER TABLE player_props_snapshots ADD COLUMN IF NOT EXISTS game_id UUID REFERENCES games(id) ON DELETE CASCADE;
ALTER TABLE odds_closing ADD COLUMN IF NOT EXISTS game_id UUID REFERENCES games(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_props_game_id ON player_props_snapshots(game_id);
CREATE INDEX IF NOT EXISTS idx_closing_game_id ON odds_closing(game_id);

-- Phase 4B: Social Polish

-- 1. Drop old constraint FIRST
ALTER TABLE bet_reactions DROP CONSTRAINT IF EXISTS bet_reactions_type_check;
ALTER TABLE bet_reactions DROP CONSTRAINT IF EXISTS emoji_whitelist;
ALTER TABLE bet_reactions DROP CONSTRAINT IF EXISTS ux_bet_reactions_unique;

-- Migrate existing reactions to emojis
UPDATE bet_reactions SET type = '👍' WHERE type = 'like';
UPDATE bet_reactions SET type = '🔥' WHERE type = 'fire';
UPDATE bet_reactions SET type = '💯' WHERE type = 'tail';

-- Remove duplicates - keep only the most recent reaction per user per bet
DELETE FROM bet_reactions
WHERE id NOT IN (
  SELECT DISTINCT ON (shared_bet_id, user_id) id
  FROM bet_reactions
  ORDER BY shared_bet_id, user_id, created_at DESC
);

-- Add new emoji whitelist constraint
ALTER TABLE bet_reactions ADD CONSTRAINT emoji_whitelist CHECK (type IN ('👍','🔥','💯','😂','😮','😡'));
ALTER TABLE bet_reactions ADD CONSTRAINT ux_bet_reactions_unique UNIQUE (shared_bet_id, user_id);

-- 2. Add counters to shared_bets
ALTER TABLE shared_bets ADD COLUMN IF NOT EXISTS reactions_count INT DEFAULT 0;
ALTER TABLE shared_bets ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0;

-- Initialize counters from existing data
UPDATE shared_bets SET reactions_count = (
  SELECT COUNT(*) FROM bet_reactions WHERE bet_reactions.shared_bet_id = shared_bets.id
);
UPDATE shared_bets SET comments_count = (
  SELECT COUNT(*) FROM bet_comments WHERE bet_comments.shared_bet_id = shared_bets.id
);

-- 3. Triggers for counters
CREATE OR REPLACE FUNCTION inc_reactions() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE shared_bets SET reactions_count = reactions_count + 1 WHERE id = NEW.shared_bet_id;
  RETURN NEW;
END$$;

CREATE OR REPLACE FUNCTION dec_reactions() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE shared_bets SET reactions_count = GREATEST(reactions_count - 1, 0) WHERE id = OLD.shared_bet_id;
  RETURN OLD;
END$$;

CREATE OR REPLACE FUNCTION inc_comments() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE shared_bets SET comments_count = comments_count + 1 WHERE id = NEW.shared_bet_id;
  RETURN NEW;
END$$;

CREATE OR REPLACE FUNCTION dec_comments() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE shared_bets SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.shared_bet_id;
  RETURN OLD;
END$$;

DROP TRIGGER IF EXISTS trg_react_inc ON bet_reactions;
CREATE TRIGGER trg_react_inc AFTER INSERT ON bet_reactions FOR EACH ROW EXECUTE FUNCTION inc_reactions();

DROP TRIGGER IF EXISTS trg_react_dec ON bet_reactions;
CREATE TRIGGER trg_react_dec AFTER DELETE ON bet_reactions FOR EACH ROW EXECUTE FUNCTION dec_reactions();

DROP TRIGGER IF EXISTS trg_comment_inc ON bet_comments;
CREATE TRIGGER trg_comment_inc AFTER INSERT ON bet_comments FOR EACH ROW EXECUTE FUNCTION inc_comments();

DROP TRIGGER IF EXISTS trg_comment_dec ON bet_comments;
CREATE TRIGGER trg_comment_dec AFTER DELETE ON bet_comments FOR EACH ROW EXECUTE FUNCTION dec_comments();

-- 4. Add edit window to comments
ALTER TABLE bet_comments ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE bet_comments ADD COLUMN IF NOT EXISTS reports_count INT DEFAULT 0;

CREATE OR REPLACE FUNCTION enforce_comment_edit_window() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF (NOW() - OLD.created_at) > INTERVAL '5 minutes' THEN
    RAISE EXCEPTION 'Edit window closed';
  END IF;
  NEW.edited_at := NOW();
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS trg_comment_edit_window ON bet_comments;
CREATE TRIGGER trg_comment_edit_window BEFORE UPDATE ON bet_comments
FOR EACH ROW WHEN (OLD.content IS DISTINCT FROM NEW.content)
EXECUTE FUNCTION enforce_comment_edit_window();

-- 5. Helpful indexes
CREATE INDEX IF NOT EXISTS idx_comments_shared_created ON bet_comments(shared_bet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_shared_user ON bet_reactions(shared_bet_id, user_id);
CREATE INDEX IF NOT EXISTS idx_shared_bets_time_id ON shared_bets(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id, created_at DESC);

-- Phase 4C: Tiered Dashboards

-- 1. Add code column to subscription_plans if missing
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS code TEXT;

-- Update existing plans with codes
UPDATE subscription_plans SET code = 'starter' WHERE name = 'Free' AND code IS NULL;
UPDATE subscription_plans SET code = 'pro' WHERE name ILIKE '%pro%' AND code IS NULL;

-- Add Degenerate tier
INSERT INTO subscription_plans (name, code, ai_calls_per_month, price_per_month, is_active)
VALUES ('Degenerate', 'degenerate', 1000, 49.00, true)
ON CONFLICT DO NOTHING;

-- 2. Create user_tiers view
CREATE OR REPLACE VIEW user_tiers AS
SELECT 
  us.user_id,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = us.user_id AND ur.role = 'admin'
    ) THEN 'admin'
    ELSE COALESCE(sp.code, 'starter')
  END AS tier
FROM user_subscriptions us
LEFT JOIN subscription_plans sp ON sp.id = us.plan_id
WHERE us.is_active = true;

-- 3. Admin observability views

-- AI spend by user (last 7 days)
CREATE OR REPLACE VIEW ai_usage_by_user AS
SELECT 
  user_id,
  SUM(tokens_used) AS total_tokens,
  SUM(cost) AS total_cost,
  COUNT(*) AS call_count
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY user_id
ORDER BY total_cost DESC;

-- Odds ingestion health
CREATE OR REPLACE VIEW odds_ingestion_health AS
SELECT 
  sport,
  MAX(created_at) AS last_snapshot,
  COUNT(*) AS rows_last_hour,
  COUNT(DISTINCT bookmaker) AS active_books
FROM player_props_snapshots
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY sport;