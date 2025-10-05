-- B1: Core player props schema with football-only markets
create table public.player_props_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_updated timestamptz not null default now(),
  
  -- Game identification
  game_date timestamptz not null,
  sport text not null,
  league text not null,
  team1 text not null,
  team2 text not null,
  
  -- Player prop details
  player text not null,
  team text,
  market text not null check (market in ('PA', 'RY', 'REC', 'RECY', 'PTD', 'RTD')),
  line numeric(6,2),
  odds numeric(6,3) not null check (odds > 1.01 and odds < 1000),
  bookmaker text not null,
  
  -- Unique constraint for upsert (prevents duplicates per game/date)
  constraint player_props_unique unique (game_date, player, market, line, bookmaker)
);

-- Enable RLS
alter table public.player_props_snapshots enable row level security;

-- Split RLS: Read access for all authenticated users
create policy "Authenticated users can view player props"
  on public.player_props_snapshots for select
  to authenticated using (true);

-- Split RLS: Write access only for service role
create policy "Service role can insert player props"
  on public.player_props_snapshots for insert
  to authenticated with check (auth.role() = 'service_role');

create policy "Service role can update player props"
  on public.player_props_snapshots for update
  to authenticated
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role can delete player props"
  on public.player_props_snapshots for delete
  to authenticated
  using (auth.role() = 'service_role');

-- Performance indexes (without immutable function in predicate)
create index player_props_game_date_idx 
  on public.player_props_snapshots (game_date desc);

create index player_props_player_market_idx 
  on public.player_props_snapshots (player, market);

create index player_props_bookmaker_idx 
  on public.player_props_snapshots (bookmaker);

-- Auto-update trigger for last_updated
create or replace function public.update_player_props_last_updated()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  NEW.last_updated := now();
  return NEW;
end;
$$;

create trigger set_player_props_last_updated
  before insert or update on public.player_props_snapshots
  for each row execute function update_player_props_last_updated();

-- B2: Data retention function (cleanup old props)
create or replace function public.cleanup_old_player_props()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count int;
begin
  delete from public.player_props_snapshots
  where game_date < (now() - interval '72 hours');
  
  get diagnostics deleted_count = row_count;
  
  return json_build_object(
    'deleted_count', deleted_count,
    'timestamp', now()
  );
end;
$$;

-- B3: Operational extras (feature flags + ingest metrics)
create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.feature_flags enable row level security;

create policy "Anyone authenticated can view feature flags"
  on public.feature_flags for select
  to authenticated using (true);

-- Insert default flags
insert into public.feature_flags (key, enabled, note)
values 
  ('props_ingest_enabled', true, 'Enable scheduled fetch-prop-odds'),
  ('props_ui_enabled', true, 'Show Player Props tab in UI')
on conflict (key) do update 
  set enabled = excluded.enabled, 
      note = excluded.note, 
      updated_at = now();

-- Ingest metrics table
create table if not exists public.ingest_runs (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  function text not null,
  sport text,
  duration_ms integer not null,
  rows_inserted integer not null,
  books_seen jsonb,
  success boolean not null,
  error text
);

alter table public.ingest_runs enable row level security;

create policy "Authenticated users can view ingest runs"
  on public.ingest_runs for select
  to authenticated using (true);

-- Trigger for feature_flags updated_at
create trigger update_feature_flags_updated_at
  before update on public.feature_flags
  for each row execute function public.update_updated_at_column();