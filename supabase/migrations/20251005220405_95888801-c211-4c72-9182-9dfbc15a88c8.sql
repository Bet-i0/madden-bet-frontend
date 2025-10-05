-- Add 'side' column to player_props_snapshots
ALTER TABLE public.player_props_snapshots
ADD COLUMN side text CHECK (side IN ('Over', 'Under', 'Yes', 'No'));

-- Add 'side' column to player_props_history
ALTER TABLE public.player_props_history
ADD COLUMN side text CHECK (side IN ('Over', 'Under', 'Yes', 'No'));

-- Update the trigger function to include the new side column
CREATE OR REPLACE FUNCTION public.log_player_props_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_key text;
  v_seen_minute timestamptz;
BEGIN
  -- Compute event_key
  v_event_key := md5(
    coalesce(NEW.sport,'') || '|' || coalesce(NEW.league,'') || '|' ||
    coalesce(NEW.team1,'') || '|' || coalesce(NEW.team2,'') || '|' ||
    to_char(NEW.game_date, 'YYYY-MM-DD"T"HH24:MI:SSOF')
  );
  
  -- Compute seen_minute
  v_seen_minute := date_trunc('minute', now());

  INSERT INTO public.player_props_history (
    game_date, sport, league, team1, team2, player, team,
    market, line, odds, bookmaker, event_id, seen_at,
    event_key, seen_minute, side
  )
  VALUES (
    NEW.game_date, NEW.sport, NEW.league, NEW.team1, NEW.team2, NEW.player, NEW.team,
    NEW.market, NEW.line, NEW.odds, NEW.bookmaker, NULL, now(),
    v_event_key, v_seen_minute, NEW.side
  )
  ON CONFLICT (event_key, player, market, line, bookmaker, seen_minute)
  DO NOTHING;

  RETURN NEW;
END;
$$;