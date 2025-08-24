-- Seed some sample chat messages for demo purposes
INSERT INTO chat_messages (user_id, content) VALUES
  ((SELECT id FROM auth.users LIMIT 1), 'Just placed a big bet on tonight''s game! 🏈'),
  ((SELECT id FROM auth.users LIMIT 1), 'Anyone else seeing the Chiefs line moving?'),
  ((SELECT id FROM auth.users LIMIT 1), 'The AI coach recommended avoiding that spread - glad I listened! 💰'),
  ((SELECT id FROM auth.users LIMIT 1), 'Live betting on this quarter is 🔥'),
  ((SELECT id FROM auth.users LIMIT 1), 'Who''s tracking the injury reports for tomorrow?');

-- Add some sample bet data for analytics demo
INSERT INTO bets (user_id, bet_type, stake, total_odds, potential_payout, status, notes, tags) VALUES
  ((SELECT id FROM auth.users LIMIT 1), 'single', 50.00, 1.90, 95.00, 'won', 'Chiefs -3.5 vs Ravens', ARRAY['NFL', 'Monday Night Football']),
  ((SELECT id FROM auth.users LIMIT 1), 'single', 25.00, 2.20, 55.00, 'lost', 'Over 47.5 Total Points', ARRAY['NFL', 'Totals']),
  ((SELECT id FROM auth.users LIMIT 1), 'parlay', 100.00, 5.60, 560.00, 'won', '3-leg parlay: Warriors, Lakers, Celtics', ARRAY['NBA', 'Parlay']),
  ((SELECT id FROM auth.users LIMIT 1), 'single', 75.00, 1.85, 138.75, 'pending', 'Manchester United ML', ARRAY['Soccer', 'Premier League']);

-- Update profiles to have better display names for demo
UPDATE profiles SET display_name = 'Demo User' WHERE display_name IS NULL OR display_name = 'New User';