-- Phase 1: Injury Intelligence Database Schema

-- Create injury_news_cache table
create table if not exists public.injury_news_cache (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  player text not null,
  status text not null check (status in ('Out','Doubtful','Questionable','Probable','Active','Unknown')),
  headline text not null,
  source text,
  url text,
  published_at timestamptz not null,
  confidence numeric(3,2) not null check (confidence >= 0 and confidence <= 1),
  expires_at timestamptz not null
);

-- Create indexes for efficient querying
create index if not exists inj_cache_player_idx on public.injury_news_cache (player);
create index if not exists inj_cache_published_idx on public.injury_news_cache (published_at desc);
create index if not exists inj_cache_expires_idx on public.injury_news_cache (expires_at);

-- Create trigger function to auto-update updated_at
create or replace function public.touch_injury_cache_updated()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Create trigger
drop trigger if exists trg_touch_injury_cache on public.injury_news_cache;
create trigger trg_touch_injury_cache before update on public.injury_news_cache
for each row execute function public.touch_injury_cache_updated();

-- Enable RLS
alter table public.injury_news_cache enable row level security;

-- RLS Policies
create policy "injury read"
on public.injury_news_cache for select
to authenticated using (true);

create policy "injury write insert"
on public.injury_news_cache for insert
to authenticated with check (auth.role() = 'service_role');

create policy "injury write update"
on public.injury_news_cache for update
to authenticated using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- Create latest injury status view
create or replace view public.latest_injury_status_v as
select distinct on (player)
  player, status, headline, source, url, published_at, confidence
from public.injury_news_cache
where now() < expires_at
order by player, published_at desc, confidence desc;

-- Create injury candidates function
create or replace function public.fn_injury_candidates(
  as_of timestamptz default now(),
  top_n int default 20
)
returns table(
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

  -- Get props with injury status
  for rec in
    select distinct
      pps.game_date as gd,
      pps.player as pl,
      pps.market as mk,
      pps.line as ln,
      pps.bookmaker as bk,
      pps.odds as od,
      inj.status as st,
      inj.published_at as pub
    from player_props_snapshots pps
    inner join latest_injury_status_v inj on pps.player = inj.player
    where pps.game_date >= as_of
      and pps.game_date <= as_of + interval '24 hours'
      and inj.status in ('Out', 'Doubtful', 'Questionable')
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

    -- Filter: market hasn't fully adjusted
    continue when abs(v_change) >= 0.03;

    -- Calculate book probability and lag
    v_book_prob := 1.0 / nullif(rec.od, 0);
    v_lag := v_consensus_now - v_book_prob;

    -- Calculate severity based on status
    v_severity := case rec.st
      when 'Out' then 1.0
      when 'Doubtful' then 0.7
      when 'Questionable' then 0.4
      else 0.0
    end;

    -- Calculate recency
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

-- Grant execute to authenticated users
grant execute on function public.fn_injury_candidates(timestamptz, int) to authenticated;

-- Add security comment
comment on function public.fn_injury_candidates(timestamptz, int)
is 'SECURITY DEFINER analytics function. Detects injury-related betting opportunities where fresh news hasn''t been priced in yet. Pinned search_path=public. No dynamic SQL. No PII exposure.';