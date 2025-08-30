-- Enable RLS on leaderboard_stats table
ALTER TABLE public.leaderboard_stats ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can always view their own stats
CREATE POLICY "Users can view their own leaderboard stats" 
ON public.leaderboard_stats 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Public stats are viewable by everyone if user has public profile
CREATE POLICY "Public leaderboard stats are viewable" 
ON public.leaderboard_stats 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles p 
    WHERE p.user_id = leaderboard_stats.user_id 
    AND p.public_profile = true
  )
);

-- Add comment documenting the security model
COMMENT ON TABLE public.leaderboard_stats 
IS 'Financial betting data protected by RLS. Users can see their own stats and public stats from users who opted into public profiles.';