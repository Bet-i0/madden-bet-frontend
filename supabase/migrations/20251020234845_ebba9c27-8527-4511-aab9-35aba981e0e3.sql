-- Phase 6: SportsDataIO Injury Integration
-- Provider mapping: allows multiple sources to map to a single player/game/team

-- Provider → Player mapping
create table if not exists provider_player_map (
  provider text not null,
  provider_player_id text not null,
  player_id uuid not null references players(id) on delete cascade,
  primary key (provider, provider_player_id)
);

-- Provider → Game mapping
create table if not exists provider_game_map (
  provider text not null,
  provider_game_id text not null,
  game_id uuid references games(id) on delete cascade,
  primary key (provider, provider_game_id)
);

-- Teams Migration Phase A: Add UUID shadow column with unique constraint
alter table teams add column if not exists id_new uuid default gen_random_uuid();
update teams set id_new = coalesce(id_new, gen_random_uuid()) where id_new is null;
alter table teams alter column id_new set not null;

-- Add unique constraint on id_new (required for foreign keys)
do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'teams_id_new_key'
  ) then
    alter table teams add constraint teams_id_new_key unique (id_new);
  end if;
end$$;

-- Provider → Team mapping (uses new UUID)
create table if not exists provider_team_map (
  provider text not null,
  provider_team_id text not null,
  team_id uuid not null references teams(id_new) on delete cascade,
  primary key (provider, provider_team_id)
);

-- Games: Add new UUID FK columns (nullable during migration)
alter table games add column if not exists home_team_id uuid;
alter table games add column if not exists away_team_id uuid;

-- Players: Add new UUID FK column (nullable during migration)
alter table players add column if not exists team_id uuid;

-- Raw injury events (immutable, append-only)
create table if not exists injury_events (
  id bigserial primary key,
  provider text not null,
  provider_player_id text not null,
  player_id uuid references players(id),
  game_id uuid references games(id),
  status text not null,
  body_part text,
  severity text,
  report_time timestamptz not null,
  source jsonb not null default '{}'
);
create index if not exists idx_injury_events_player_time on injury_events(provider, provider_player_id, report_time desc);
create index if not exists idx_injury_events_player_id on injury_events(player_id, report_time desc);

-- Replace injury_news_cache view with proper table for player status
create table if not exists player_status (
  player_id uuid primary key references players(id) on delete cascade,
  status text not null,
  body_part text,
  severity text,
  last_updated timestamptz not null default now(),
  expected_impact jsonb not null default '{}'
);
create index if not exists idx_player_status_status on player_status(status);
create index if not exists idx_player_status_updated on player_status(last_updated desc);

-- Depth chart snapshots (immutable, append-only)
create table if not exists depth_chart_events (
  id bigserial primary key,
  provider text not null,
  provider_team_id text not null,
  team_id uuid references teams(id_new),
  position text not null,
  rank int not null,
  provider_player_id text not null,
  player_id uuid references players(id),
  captured_at timestamptz not null,
  source jsonb not null default '{}'
);
create index if not exists idx_depth_events_team_pos_time on depth_chart_events(team_id, position, captured_at desc);
create index if not exists idx_depth_events_team_pos_rank on depth_chart_events(team_id, position, rank, captured_at desc);

-- Current depth chart (latest snapshot per team/position/rank)
create or replace view current_depth_chart as
select distinct on (team_id, position, rank)
  team_id, position, rank, player_id, provider_player_id, captured_at
from depth_chart_events
order by team_id, position, rank, captured_at desc;

-- Injury impacted markets (team-level: QB injuries affect moneyline/spread)
create or replace view injury_impacted_markets as
with qbs as (
  select p.id as player_id, p.team_id, p.league, ps.status
  from players p
  join player_status ps on ps.player_id = p.id
  where p.position in ('QB') 
    and ps.status in ('out','doubtful','questionable')
),
upcoming as (
  select g.id as game_id, g.league, g.home_team_id, g.away_team_id, g.starts_at
  from games g
  where g.starts_at between now() and now() + interval '72 hours'
    and g.home_team_id is not null 
    and g.away_team_id is not null
)
select
  u.game_id,
  case when u.home_team_id = q.team_id then 'home' else 'away' end as affected_side,
  q.status as injury_status,
  'moneyline'::text as market_hint
from upcoming u
join qbs q on q.league = u.league 
  and (q.team_id = u.home_team_id or q.team_id = u.away_team_id);

-- Replacement candidates (next-up players when starter OUT/DOUBTFUL)
create or replace view replacement_candidates as
select
  cd1.team_id,
  cd1.position,
  cd1.player_id as starter_player_id,
  ps.status as starter_status,
  cd2.player_id as next_up_player_id,
  cd1.captured_at as asof
from current_depth_chart cd1
join player_status ps on ps.player_id = cd1.player_id
left join current_depth_chart cd2 
  on cd2.team_id = cd1.team_id 
  and cd2.position = cd1.position 
  and cd2.rank = 2
where cd1.rank = 1 
  and ps.status in ('out','doubtful');

-- Injury impacted player props (unders/overs to evaluate)
create or replace view injury_impacted_player_props as
select
  rc.team_id,
  rc.position,
  rc.starter_player_id,
  rc.next_up_player_id,
  rc.starter_status,
  'player_receiving_yards'::text as market_hint
from replacement_candidates rc
where rc.position in ('WR','TE')
union all
select 
  rc.team_id, 
  rc.position, 
  rc.starter_player_id, 
  rc.next_up_player_id, 
  rc.starter_status, 
  'player_rushing_yards'
from replacement_candidates rc
where rc.position in ('RB');

-- Update fn_injury_candidates to use player_status table
create or replace function fn_injury_candidates(
  as_of timestamp with time zone default now(), 
  top_n integer default 20
)
returns table(
  game_date timestamp with time zone,
  player text,
  market text,
  line numeric,
  bookmaker text,
  odds numeric,
  status text,
  published_at timestamp with time zone,
  consensus_prob_now numeric,
  consensus_prob_60m numeric,
  consensus_change_60m numeric,
  lag_prob numeric,
  pick_score numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  rec record;
  v_consensus_now numeric;
  v_consensus_60m numeric;
  v_book_prob numeric;
  v_lag numeric;
  v_severity numeric;
  v_recency numeric;
  v_minutes_since numeric;
  v_score numeric;
  v_change numeric;
begin
  create temp table if not exists temp_candidates (
    game_date timestamptz,
    player text,
    market text,
    line numeric,
    bookmaker text,
    odds numeric,
    status text,
    published_at timestamptz,
    consensus_prob_now numeric,
    consensus_prob_60m numeric,
    consensus_change_60m numeric,
    lag_prob numeric,
    pick_score numeric
  ) on commit drop;

  -- Get props with injury status from player_status table
  for rec in
    select distinct
      pps.game_date as gd,
      pps.player as pl,
      pps.market as mk,
      pps.line as ln,
      pps.bookmaker as bk,
      pps.odds as od,
      ps.status as st,
      ps.last_updated as pub
    from player_props_snapshots pps
    inner join players p on p.name = pps.player
    inner join player_status ps on ps.player_id = p.id
    where pps.game_date >= as_of
      and pps.game_date <= as_of + interval '24 hours'
      and ps.status in ('out', 'doubtful', 'questionable')
      and pps.odds > 0
      and pps.league in ('NFL', 'NCAAF')
  loop
    -- Calculate consensus probability now
    select percentile_cont(0.5) within group (order by 1.0 / nullif(pph.odds, 0))
    into v_consensus_now
    from player_props_history pph
    where pph.player = rec.pl
      and pph.market = rec.mk
      and pph.line = rec.ln
      and pph.seen_minute <= as_of
      and pph.seen_minute >= as_of - interval '15 minutes'
      and pph.odds > 0;

    -- Calculate consensus probability 60m ago
    select percentile_cont(0.5) within group (order by 1.0 / nullif(pph.odds, 0))
    into v_consensus_60m
    from player_props_history pph
    where pph.player = rec.pl
      and pph.market = rec.mk
      and pph.line = rec.ln
      and pph.seen_minute <= as_of - interval '60 minutes'
      and pph.seen_minute >= as_of - interval '75 minutes'
      and pph.odds > 0;

    -- Skip if we don't have consensus data
    continue when v_consensus_now is null;
    
    v_consensus_60m := coalesce(v_consensus_60m, v_consensus_now);
    v_change := v_consensus_now - v_consensus_60m;

    -- Filter: market hasn't fully adjusted (less than 3% move)
    continue when abs(v_change) >= 0.03;

    -- Calculate book probability and lag
    v_book_prob := 1.0 / nullif(rec.od, 0);
    v_lag := v_consensus_now - v_book_prob;

    -- Calculate severity based on status
    v_severity := case rec.st
      when 'out' then 1.0
      when 'doubtful' then 0.7
      when 'questionable' then 0.4
      else 0.0
    end;

    -- Calculate recency (decay over 4 hours)
    v_minutes_since := extract(epoch from (as_of - rec.pub)) / 60.0;
    v_recency := exp(- v_minutes_since / 240.0);

    -- Calculate pick score
    v_score := 100 * v_severity * v_recency * greatest(0, 0.03 - abs(v_change));

    -- Insert into temp table
    insert into temp_candidates values (
      rec.gd, rec.pl, rec.mk, rec.ln, rec.bk, rec.od,
      rec.st, rec.pub,
      v_consensus_now, v_consensus_60m, v_change,
      v_lag, v_score
    );
  end loop;

  -- Return sorted results
  return query
  select * from temp_candidates
  order by temp_candidates.pick_score desc, temp_candidates.lag_prob desc
  limit top_n;
end;
$$;

-- RLS policies (public read for all new tables)
alter table provider_player_map enable row level security;
alter table provider_game_map enable row level security;
alter table provider_team_map enable row level security;
alter table injury_events enable row level security;
alter table player_status enable row level security;
alter table depth_chart_events enable row level security;

-- Drop and recreate policies to avoid conflicts
drop policy if exists provider_player_map_select_public on provider_player_map;
drop policy if exists provider_game_map_select_public on provider_game_map;
drop policy if exists provider_team_map_select_public on provider_team_map;
drop policy if exists injury_events_select_public on injury_events;
drop policy if exists player_status_select_public on player_status;
drop policy if exists depth_chart_events_select_public on depth_chart_events;

drop policy if exists provider_player_map_service_write on provider_player_map;
drop policy if exists provider_game_map_service_write on provider_game_map;
drop policy if exists provider_team_map_service_write on provider_team_map;
drop policy if exists injury_events_service_write on injury_events;
drop policy if exists player_status_service_write on player_status;
drop policy if exists depth_chart_events_service_write on depth_chart_events;

create policy provider_player_map_select_public on provider_player_map for select using (true);
create policy provider_game_map_select_public on provider_game_map for select using (true);
create policy provider_team_map_select_public on provider_team_map for select using (true);
create policy injury_events_select_public on injury_events for select using (true);
create policy player_status_select_public on player_status for select using (true);
create policy depth_chart_events_select_public on depth_chart_events for select using (true);

create policy provider_player_map_service_write on provider_player_map for all using (auth.role() = 'service_role');
create policy provider_game_map_service_write on provider_game_map for all using (auth.role() = 'service_role');
create policy provider_team_map_service_write on provider_team_map for all using (auth.role() = 'service_role');
create policy injury_events_service_write on injury_events for all using (auth.role() = 'service_role');
create policy player_status_service_write on player_status for all using (auth.role() = 'service_role');
create policy depth_chart_events_service_write on depth_chart_events for all using (auth.role() = 'service_role');