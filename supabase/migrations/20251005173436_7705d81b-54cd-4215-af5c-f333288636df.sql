-- Fix search_path security warning for refresh_best_odds function
create or replace function public.refresh_best_odds()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view public.best_odds;
end;
$$;

-- Revoke public access to materialized view (access through functions only)
revoke all on public.best_odds from anon, authenticated;
grant select on public.best_odds to service_role;