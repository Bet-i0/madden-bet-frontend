-- Fix security warning: set search_path on trigger function
create or replace function public.log_player_props_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_key text;
  v_seen_minute timestamptz;
begin
  -- Compute event_key
  v_event_key := md5(
    coalesce(NEW.sport,'') || '|' || coalesce(NEW.league,'') || '|' ||
    coalesce(NEW.team1,'') || '|' || coalesce(NEW.team2,'') || '|' ||
    to_char(NEW.game_date, 'YYYY-MM-DD"T"HH24:MI:SSOF')
  );
  
  -- Compute seen_minute
  v_seen_minute := date_trunc('minute', now());

  insert into public.player_props_history (
    game_date, sport, league, team1, team2, player, team,
    market, line, odds, bookmaker, event_id, seen_at,
    event_key, seen_minute
  )
  values (
    NEW.game_date, NEW.sport, NEW.league, NEW.team1, NEW.team2, NEW.player, NEW.team,
    NEW.market, NEW.line, NEW.odds, NEW.bookmaker, NULL, now(),
    v_event_key, v_seen_minute
  )
  on conflict (event_key, player, market, line, bookmaker, seen_minute)
  do nothing;

  return NEW;
end;
$$;