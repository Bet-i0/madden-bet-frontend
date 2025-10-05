-- === Props History (never auto-deleted) ==========================
create table if not exists public.player_props_history (
  id bigserial primary key,
  seen_at timestamptz not null default now(),
  -- copy of snapshot fields
  game_date timestamptz not null,
  sport text not null,
  league text not null,
  team1 text not null,
  team2 text not null,
  player text not null,
  team text not null,
  market text not null check (market in ('PA','RY','REC','RECY','PTD','RTD')),
  line numeric(6,2),
  odds numeric(6,3) not null check (odds > 1.01 and odds < 1000),
  bookmaker text not null,
  -- optional event_id if you have it later (kept nullable)
  event_id text,

  -- stable key to group history for a game (computed in trigger)
  event_key text not null,

  -- minute bucket for dedupe (computed in trigger)
  seen_minute timestamptz not null
);

-- de-dupe per minute per (event/player/market/line/book)
alter table public.player_props_history
  add constraint player_props_history_minute_uniq
  unique (event_key, player, market, line, bookmaker, seen_minute);

-- helpful indexes
create index if not exists pph_seen_at_desc_idx on public.player_props_history (seen_at desc);
create index if not exists pph_player_market_idx on public.player_props_history (player, market);
create index if not exists pph_event_key_idx on public.player_props_history (event_key);

-- RLS: enable + policies
alter table public.player_props_history enable row level security;

drop policy if exists "read_props_history" on public.player_props_history;
create policy "read_props_history"
  on public.player_props_history
  for select
  to authenticated
  using (true);

drop policy if exists "write_props_history_service_only" on public.player_props_history;
create policy "write_props_history_service_only"
  on public.player_props_history
  for insert
  to authenticated
  with check (auth.role() = 'service_role');

-- Trigger to log snapshots into history on every insert/update
create or replace function public.log_player_props_history()
returns trigger
language plpgsql
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

drop trigger if exists trg_log_player_props_history on public.player_props_snapshots;
create trigger trg_log_player_props_history
  after insert or update on public.player_props_snapshots
  for each row
  execute function public.log_player_props_history();

comment on table public.player_props_history is
  'Immutable history of player props. One row per minute per (game/player/market/line/book).';