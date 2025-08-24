
-- 1) Extend profiles with public-facing fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS banner_url text;

-- 2) Allow reading bet legs for public bets owned by public profiles
-- bet_legs already has RLS enabled. We add a SELECT policy for authenticated users.
CREATE POLICY "Authenticated users can view legs of public bets"
  ON public.bet_legs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.bets b
      JOIN public.profiles p ON p.user_id = b.user_id
      WHERE b.id = bet_legs.bet_id
        AND b.is_public = true
        AND p.public_profile = true
    )
  );

-- 3) Helpful index for lookups by bet_id
CREATE INDEX IF NOT EXISTS bet_legs_bet_id_idx ON public.bet_legs (bet_id);
