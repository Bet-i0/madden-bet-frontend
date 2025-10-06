-- Fix security issue: Set search_path for trigger function

create or replace function public.touch_injury_cache_updated()
returns trigger 
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;