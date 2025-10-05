-- Clean up bad player prop data where player name is actually a side
DELETE FROM public.player_props_snapshots
WHERE player IN ('Over', 'Under', 'Yes', 'No');

-- Also refresh the materialized view to clear bad data
REFRESH MATERIALIZED VIEW public.best_prop_odds;