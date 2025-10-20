-- Fix fn_injury_candidates: change from STABLE to VOLATILE to allow temp table creation
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
volatile  -- Changed from STABLE to VOLATILE to allow CREATE TABLE
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