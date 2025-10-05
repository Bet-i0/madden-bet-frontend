-- Create sophisticated momentum surge function with lag detection
CREATE OR REPLACE FUNCTION fn_momentum_surge(
  as_of timestamptz DEFAULT now(),
  lookback_mins_1 int DEFAULT 15,
  lookback_mins_2 int DEFAULT 60,
  top_n int DEFAULT 30
)
RETURNS TABLE (
  game_date timestamptz,
  player text,
  market text,
  line numeric,
  bookmaker text,
  odds_now numeric,
  consensus_prob_now numeric,
  consensus_prob_15m numeric,
  consensus_prob_60m numeric,
  consensus_change_15m numeric,
  consensus_change_60m numeric,
  book_prob_now numeric,
  book_prob_15m numeric,
  book_change_15m numeric,
  lag_prob numeric,
  momentum_score numeric,
  book_count int
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  consensus_now RECORD;
  consensus_15m RECORD;
  consensus_60m RECORD;
  book_now_prob numeric;
  book_15m_prob numeric;
  calc_consensus_change_15m numeric;
  calc_consensus_change_60m numeric;
  calc_book_change_15m numeric;
  calc_lag_prob numeric;
  calc_momentum_score numeric;
BEGIN
  -- Create temp table to hold results
  CREATE TEMP TABLE IF NOT EXISTS momentum_results (
    game_date timestamptz,
    player text,
    market text,
    line numeric,
    bookmaker text,
    odds_now numeric,
    consensus_prob_now numeric,
    consensus_prob_15m numeric,
    consensus_prob_60m numeric,
    consensus_change_15m numeric,
    consensus_change_60m numeric,
    book_prob_now numeric,
    book_prob_15m numeric,
    book_change_15m numeric,
    lag_prob numeric,
    momentum_score numeric,
    book_count int
  ) ON COMMIT DROP;
  
  -- Build candidates from upcoming games
  FOR rec IN
    SELECT DISTINCT
      pps.game_date as gd,
      md5(
        coalesce(pps.sport,'')||'|'||coalesce(pps.league,'')||'|'||
        coalesce(pps.team1,'')||'|'||coalesce(pps.team2,'')||'|'||
        to_char(pps.game_date, 'YYYY-MM-DD"T"HH24:MI:SSOF')
      ) as ek,
      pps.player as pl,
      pps.market as mk,
      pps.line as ln,
      pps.bookmaker as bk,
      pps.odds as odds_n
    FROM player_props_snapshots pps
    WHERE pps.game_date BETWEEN as_of AND as_of + interval '24 hours'
      AND pps.odds > 0
  LOOP
    -- Get consensus at 3 time points
    SELECT * INTO consensus_now FROM fn_consensus_prob_at(as_of, rec.ek, rec.pl, rec.mk, rec.ln);
    
    IF consensus_now.book_count < 2 THEN
      CONTINUE;
    END IF;
    
    SELECT * INTO consensus_15m FROM fn_consensus_prob_at(as_of - (lookback_mins_1 * interval '1 minute'), rec.ek, rec.pl, rec.mk, rec.ln);
    SELECT * INTO consensus_60m FROM fn_consensus_prob_at(as_of - (lookback_mins_2 * interval '1 minute'), rec.ek, rec.pl, rec.mk, rec.ln);
    
    -- Get book's current odds
    SELECT 1.0 / NULLIF(plm.odds, 0)
    INTO book_now_prob
    FROM prop_latest_minute_v plm
    WHERE plm.minute_bucket <= as_of
      AND plm.event_key = rec.ek
      AND plm.player = rec.pl
      AND plm.market = rec.mk
      AND plm.line = rec.ln
      AND plm.bookmaker = rec.bk
    ORDER BY plm.minute_bucket DESC
    LIMIT 1;
    
    IF book_now_prob IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Get book's 15m ago odds
    SELECT 1.0 / NULLIF(plm.odds, 0)
    INTO book_15m_prob
    FROM prop_latest_minute_v plm
    WHERE plm.minute_bucket <= as_of - (lookback_mins_1 * interval '1 minute')
      AND plm.event_key = rec.ek
      AND plm.player = rec.pl
      AND plm.market = rec.mk
      AND plm.line = rec.ln
      AND plm.bookmaker = rec.bk
    ORDER BY plm.minute_bucket DESC
    LIMIT 1;
    
    -- Calculate changes
    calc_consensus_change_15m := COALESCE(consensus_now.consensus_prob - consensus_15m.consensus_prob, 0);
    calc_consensus_change_60m := COALESCE(consensus_now.consensus_prob - consensus_60m.consensus_prob, 0);
    calc_book_change_15m := COALESCE(book_now_prob - book_15m_prob, 0);
    
    -- Filter: need significant consensus movement
    IF ABS(calc_consensus_change_15m) < 0.05 AND ABS(calc_consensus_change_60m) < 0.08 THEN
      CONTINUE;
    END IF;
    
    -- Calculate lag: book is behind consensus movement
    calc_lag_prob := (consensus_now.consensus_prob - book_now_prob) * SIGN(calc_consensus_change_15m);
    
    -- Filter: require meaningful lag (book hasn't caught up)
    IF calc_lag_prob < 0.03 THEN
      CONTINUE;
    END IF;
    
    -- Calculate momentum score
    calc_momentum_score := 100 * (0.6 * ABS(calc_consensus_change_15m) + 0.4 * ABS(calc_consensus_change_60m));
    
    -- Insert result
    INSERT INTO momentum_results VALUES (
      rec.gd,
      rec.pl,
      rec.mk,
      rec.ln,
      rec.bk,
      rec.odds_n,
      consensus_now.consensus_prob,
      COALESCE(consensus_15m.consensus_prob, 0),
      COALESCE(consensus_60m.consensus_prob, 0),
      calc_consensus_change_15m,
      calc_consensus_change_60m,
      book_now_prob,
      COALESCE(book_15m_prob, 0),
      calc_book_change_15m,
      calc_lag_prob,
      calc_momentum_score,
      consensus_now.book_count
    );
  END LOOP;
  
  -- Return sorted results
  RETURN QUERY
  SELECT * FROM momentum_results
  ORDER BY momentum_results.momentum_score DESC, momentum_results.lag_prob DESC
  LIMIT top_n;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_momentum_surge(timestamptz, int, int, int) TO authenticated;

COMMENT ON FUNCTION fn_momentum_surge IS 'Detects props where consensus moved fast but a book is lagging, creating value opportunity';
