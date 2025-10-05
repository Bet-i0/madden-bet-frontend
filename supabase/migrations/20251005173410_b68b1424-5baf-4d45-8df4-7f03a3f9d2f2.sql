-- Add normalized teams and books tables for better odds structure
create table if not exists public.teams (
  id bigserial primary key,
  name text not null,
  short_name text not null,
  league text not null,
  external_id text,
  created_at timestamptz not null default now(),
  unique(league, name)
);

create table if not exists public.books (
  id bigserial primary key,
  code text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.teams enable row level security;
alter table public.books enable row level security;

-- Public read policies
create policy "Anyone can view teams"
  on public.teams for select
  using (true);

create policy "Anyone can view books"
  on public.books for select
  using (true);

-- Insert common sportsbooks
insert into public.books (code, name) values
  ('draftkings', 'DraftKings'),
  ('fanduel', 'FanDuel'),
  ('betmgm', 'BetMGM'),
  ('caesars', 'Caesars'),
  ('williamhill_us', 'William Hill')
on conflict (code) do nothing;

-- Create materialized view for best odds per market
create materialized view if not exists public.best_odds as
select 
  o.sport,
  o.league,
  o.team1,
  o.team2,
  o.game_date,
  o.market,
  o.bookmaker,
  o.odds,
  o.last_updated,
  row_number() over (
    partition by o.sport, o.league, o.team1, o.team2, o.market 
    order by o.odds desc
  ) as rank
from public.odds_snapshots o
where o.game_date >= now()
  and o.game_date <= now() + interval '72 hours';

create index if not exists best_odds_game_market 
  on public.best_odds(sport, league, team1, team2, market);

-- Refresh function
create or replace function public.refresh_best_odds()
returns void
language plpgsql
security definer
as $$
begin
  refresh materialized view public.best_odds;
end;
$$;