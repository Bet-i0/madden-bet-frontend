
-- Wave 1: Schema updates to support bankrolls, CLV, tags, notifications, and realtime

-- 1) Bankrolls
create table if not exists public.bankrolls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  currency text not null default 'usd',
  starting_balance numeric not null default 0,
  unit_size numeric,                -- optional unit size in currency
  staking_strategy text not null default 'fixed', -- 'fixed' | '%_bankroll' | 'kelly' (stored as text)
  kelly_fraction numeric,           -- e.g., 0.5
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.bankrolls enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bankrolls' and policyname = 'Users can view their own bankrolls'
  ) then
    create policy "Users can view their own bankrolls"
      on public.bankrolls
      for select
      using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bankrolls' and policyname = 'Users can insert their own bankrolls'
  ) then
    create policy "Users can insert their own bankrolls"
      on public.bankrolls
      for insert
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bankrolls' and policyname = 'Users can update their own bankrolls'
  ) then
    create policy "Users can update their own bankrolls"
      on public.bankrolls
      for update
      using (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bankrolls' and policyname = 'Users can delete their own bankrolls'
  ) then
    create policy "Users can delete their own bankrolls"
      on public.bankrolls
      for delete
      using (user_id = auth.uid());
  end if;
end$$;

-- updated_at trigger
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_bankrolls'
  ) then
    create trigger set_updated_at_bankrolls
      before update on public.bankrolls
      for each row
      execute function public.update_updated_at_column();
  end if;
end$$;

create index if not exists idx_bankrolls_user_id on public.bankrolls(user_id);

-- 2) Bankroll transactions
create table if not exists public.bankroll_transactions (
  id uuid primary key default gen_random_uuid(),
  bankroll_id uuid not null references public.bankrolls(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  amount numeric not null,       -- positive for deposits/wins, negative for withdrawals/losses/adjustments
  type text not null,            -- 'deposit'|'withdrawal'|'bet'|'win'|'loss'|'adjustment'
  reference_bet_id uuid references public.bets(id) on delete set null,
  notes text
);

alter table public.bankroll_transactions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'bankroll_transactions' and policyname = 'Users can manage their own bankroll transactions'
  ) then
    create policy "Users can manage their own bankroll transactions"
      on public.bankroll_transactions
      as permissive
      for all
      using (exists (
        select 1 from public.bankrolls b
        where b.id = bankroll_transactions.bankroll_id
          and b.user_id = auth.uid()
      ))
      with check (exists (
        select 1 from public.bankrolls b
        where b.id = bankroll_transactions.bankroll_id
          and b.user_id = auth.uid()
      ));
  end if;
end$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_updated_at_bankroll_tx'
  ) then
    create trigger set_updated_at_bankroll_tx
      before update on public.bankroll_transactions
      for each row
      execute function public.update_updated_at_column();
  end if;
end$$;

create index if not exists idx_bankroll_tx_bankroll_id on public.bankroll_transactions(bankroll_id);

-- 3) Link bets to bankrolls and add tags
alter table public.bets
  add column if not exists bankroll_id uuid references public.bankrolls(id) on delete set null,
  add column if not exists tags text[] not null default '{}'::text[];

create index if not exists idx_bets_bankroll_id on public.bets(bankroll_id);
create index if not exists idx_bets_tags_gin on public.bets using gin (tags);

-- 4) CLV fields on bet_legs
alter table public.bet_legs
  add column if not exists open_odds numeric,
  add column if not exists closing_odds numeric;

-- 5) User notification/Zapier + public profile flags on profiles
alter table public.profiles
  add column if not exists zapier_webhook_url text,
  add column if not exists notification_preferences jsonb not null default '{}'::jsonb,
  add column if not exists public_profile boolean not null default false;

-- 6) Realtime support: ensure full row images and publication membership
alter table public.bets replica identity full;
alter table public.bet_legs replica identity full;
alter table public.bankrolls replica identity full;
alter table public.bankroll_transactions replica identity full;

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end$$;

alter publication supabase_realtime add table public.bets;
alter publication supabase_realtime add table public.bet_legs;
alter publication supabase_realtime add table public.bankrolls;
alter publication supabase_realtime add table public.bankroll_transactions;
