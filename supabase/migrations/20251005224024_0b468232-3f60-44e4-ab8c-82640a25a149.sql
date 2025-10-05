-- Create ingest_runs table for health monitoring
CREATE TABLE IF NOT EXISTS public.ingest_runs (
  id bigserial PRIMARY KEY,
  function text NOT NULL,
  sport text,
  duration_ms integer NOT NULL,
  rows_inserted integer NOT NULL DEFAULT 0,
  books_seen jsonb,
  success boolean NOT NULL DEFAULT true,
  error_text text,
  requests_remaining integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for quick health checks
CREATE INDEX idx_ingest_runs_created_at ON public.ingest_runs(created_at DESC);
CREATE INDEX idx_ingest_runs_function_sport ON public.ingest_runs(function, sport);

-- Add event_id to player_props_snapshots
ALTER TABLE public.player_props_snapshots 
ADD COLUMN IF NOT EXISTS event_id text;

-- Index event_id for faster joins
CREATE INDEX IF NOT EXISTS idx_player_props_event_id ON public.player_props_snapshots(event_id);

-- Add check constraint for side column
ALTER TABLE public.player_props_snapshots 
ADD CONSTRAINT check_side_values CHECK (side IS NULL OR side IN ('Over', 'Under', 'Yes', 'No'));

-- Create best_prop_odds materialized view for instant best-price lookups
CREATE MATERIALIZED VIEW IF NOT EXISTS public.best_prop_odds AS
SELECT 
  sport,
  league,
  player,
  team,
  market,
  line,
  MAX(odds) as best_odds,
  (array_agg(bookmaker ORDER BY odds DESC))[1] as best_bookmaker,
  COUNT(DISTINCT bookmaker) as book_count,
  game_date,
  MAX(last_updated) as last_updated
FROM public.player_props_snapshots
WHERE game_date >= now()
GROUP BY sport, league, player, team, market, line, game_date;

-- Index for fast lookups
CREATE INDEX idx_best_prop_odds_player_market ON public.best_prop_odds(player, market);
CREATE INDEX idx_best_prop_odds_game_date ON public.best_prop_odds(game_date);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION public.refresh_best_prop_odds()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.best_prop_odds;
END;
$$;

-- RLS policies for ingest_runs only
ALTER TABLE public.ingest_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view ingest runs"
  ON public.ingest_runs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert ingest runs"
  ON public.ingest_runs FOR INSERT
  TO service_role
  WITH CHECK (true);