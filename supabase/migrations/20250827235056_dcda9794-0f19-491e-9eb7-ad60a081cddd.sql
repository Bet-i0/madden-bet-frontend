-- Drop the existing view
DROP VIEW IF EXISTS public.leaderboard_stats;

-- Recreate the view with explicit SECURITY INVOKER (default behavior)
-- This ensures the view runs with the permissions of the querying user, not the creator
CREATE VIEW public.leaderboard_stats AS
SELECT 
    b.user_id,
    p.display_name,
    p.avatar_url,
    count(*) FILTER (WHERE b.status = ANY (ARRAY['won'::bet_status, 'lost'::bet_status, 'push'::bet_status, 'void'::bet_status])) AS bets_count,
    count(*) FILTER (WHERE b.status = 'won'::bet_status) AS wins,
    count(*) FILTER (WHERE b.status = 'lost'::bet_status) AS losses,
    count(*) FILTER (WHERE b.status = 'push'::bet_status) AS pushes,
    COALESCE(sum(
        CASE
            WHEN b.status = 'won'::bet_status THEN COALESCE(b.potential_payout, 0::numeric) - b.stake
            WHEN b.status = 'lost'::bet_status THEN - b.stake
            WHEN b.status = ANY (ARRAY['void'::bet_status, 'push'::bet_status]) THEN 0::numeric
            ELSE 0::numeric
        END), 0::numeric) AS profit,
    COALESCE(sum(
        CASE
            WHEN b.status = ANY (ARRAY['won'::bet_status, 'lost'::bet_status]) THEN b.stake
            ELSE 0::numeric
        END), 0::numeric) AS total_staked,
    CASE
        WHEN COALESCE(sum(
        CASE
            WHEN b.status = ANY (ARRAY['won'::bet_status, 'lost'::bet_status]) THEN b.stake
            ELSE 0::numeric
        END), 0::numeric) > 0::numeric THEN round(COALESCE(sum(
        CASE
            WHEN b.status = 'won'::bet_status THEN COALESCE(b.potential_payout, 0::numeric) - b.stake
            WHEN b.status = 'lost'::bet_status THEN - b.stake
            WHEN b.status = ANY (ARRAY['void'::bet_status, 'push'::bet_status]) THEN 0::numeric
            ELSE 0::numeric
        END), 0::numeric) / COALESCE(sum(
        CASE
            WHEN b.status = ANY (ARRAY['won'::bet_status, 'lost'::bet_status]) THEN b.stake
            ELSE 0::numeric
        END), 0::numeric) * 100::numeric, 2)
        ELSE 0::numeric
    END AS roi_percent,
    CASE
        WHEN count(*) FILTER (WHERE b.status = ANY (ARRAY['won'::bet_status, 'lost'::bet_status])) > 0 THEN round(count(*) FILTER (WHERE b.status = 'won'::bet_status)::numeric / NULLIF(count(*) FILTER (WHERE b.status = ANY (ARRAY['won'::bet_status, 'lost'::bet_status])), 0)::numeric * 100::numeric, 2)
        ELSE 0::numeric
    END AS win_rate_percent,
    max(b.settled_at) AS last_settled_at
FROM bets b
JOIN profiles p ON p.user_id = b.user_id
WHERE p.public_profile = true AND b.is_public = true
GROUP BY b.user_id, p.display_name, p.avatar_url;