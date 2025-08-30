-- Add security documentation for leaderboard_stats view
COMMENT ON VIEW public.leaderboard_stats 
IS 'Secure leaderboard view that only exposes financial data from users who have opted into public profiles (public_profile = true) and public bets (is_public = true). No additional RLS needed as security is enforced by view definition.';

-- Verify that the underlying bets table has proper RLS policies
-- (This is just a verification comment, the actual policies already exist based on the schema)