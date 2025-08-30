-- Add a unique constraint for the upsert logic in fetch-odds function
-- This allows the function to properly handle duplicate odds for the same game/market/bookmaker
CREATE UNIQUE INDEX IF NOT EXISTS idx_odds_snapshots_unique 
ON odds_snapshots (sport, league, team1, team2, market, bookmaker);

-- Now fix any duplicate data that might exist (remove duplicates keeping the latest)
DELETE FROM odds_snapshots a USING odds_snapshots b 
WHERE a.id < b.id 
  AND a.sport = b.sport 
  AND a.league = b.league 
  AND a.team1 = b.team1 
  AND a.team2 = b.team2 
  AND a.market = b.market 
  AND a.bookmaker = b.bookmaker;