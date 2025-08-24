
-- 1) Extend bets with public visibility and tail-tracking
alter table public.bets
  add column if not exists is_public boolean not null default false,
  add column if not exists tailed_from_shared_bet_id uuid null;

-- Allow viewing public bets of public profiles
-- Existing policy restricts to owner; add an additional permissive policy for public content
create policy "Users can view public bets"
on public.bets
for select
using (
  auth.uid() = user_id
  or (
    is_public = true
    and exists (
      select 1 from public.profiles p
      where p.user_id = public.bets.user_id
        and p.public_profile = true
    )
  )
);

-- 2) Allow viewing public profiles (in addition to viewing own profile)
create policy "Public profiles are viewable"
on public.profiles
for select
using (
  public_profile = true or auth.uid() = user_id
);

-- 3) Follows: following graph
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null,
  followed_id uuid not null,
  created_at timestamptz not null default now(),
  unique (follower_id, followed_id),
  check (follower_id <> followed_id)
);

alter table public.follows enable row level security;

-- Following policies:
-- Anyone authenticated can read follow relationships (for counts & lists)
create policy "Anyone authenticated can view follows"
on public.follows
for select
to authenticated
using (true);

-- Only the follower manages their own follow rows
create policy "Users can follow others"
on public.follows
for insert
to authenticated
with check (auth.uid() = follower_id);

create policy "Users can unfollow"
on public.follows
for delete
to authenticated
using (auth.uid() = follower_id);

create index if not exists idx_follows_follower on public.follows (follower_id);
create index if not exists idx_follows_followed on public.follows (followed_id);

-- 4) Shared bets: public snapshots of a bet and its legs
create table if not exists public.shared_bets (
  id uuid primary key default gen_random_uuid(),
  original_bet_id uuid not null,
  owner_user_id uuid not null,
  title text,
  comment text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shared_bets enable row level security;

-- Keep updated_at in sync
drop trigger if exists trg_shared_bets_updated_at on public.shared_bets;
create trigger trg_shared_bets_updated_at
before update on public.shared_bets
for each row
execute procedure public.update_updated_at_column();

-- Shared bets are readable by all authenticated users
create policy "Anyone authenticated can view shared bets"
on public.shared_bets
for select
to authenticated
using (true);

-- Only owners can create shared bets, and only for their own original bet
create policy "Owners can create shared bets for their own bets"
on public.shared_bets
for insert
to authenticated
with check (
  owner_user_id = auth.uid()
  and exists (
    select 1 from public.bets b
    where b.id = original_bet_id
      and b.user_id = auth.uid()
  )
);

-- Only owners can update/disable their shared bets
create policy "Owners can update their shared bets"
on public.shared_bets
for update
to authenticated
using (owner_user_id = auth.uid());

-- Only owners can delete their shared bets
create policy "Owners can delete their shared bets"
on public.shared_bets
for delete
to authenticated
using (owner_user_id = auth.uid());

create index if not exists idx_shared_bets_owner on public.shared_bets (owner_user_id, created_at desc);

-- 5) Shared bet legs: immutable snapshot for public consumption
create table if not exists public.shared_bet_legs (
  id uuid primary key default gen_random_uuid(),
  shared_bet_id uuid not null,
  sport text not null,
  league text not null,
  team1 text not null,
  team2 text not null,
  bet_market text not null,
  bet_selection text not null,
  odds numeric,
  created_at timestamptz not null default now()
);

alter table public.shared_bet_legs enable row level security;

-- Readable by all authenticated users
create policy "Anyone authenticated can view shared bet legs"
on public.shared_bet_legs
for select
to authenticated
using (true);

-- Only the shared bet owner can add / update / delete legs
create policy "Owners can manage shared bet legs"
on public.shared_bet_legs
for all
to authenticated
using (
  exists(
    select 1 from public.shared_bets sb
    where sb.id = shared_bet_id
      and sb.owner_user_id = auth.uid()
  )
)
with check (
  exists(
    select 1 from public.shared_bets sb
    where sb.id = shared_bet_id
      and sb.owner_user_id = auth.uid()
  )
);

create index if not exists idx_shared_bet_legs_shared on public.shared_bet_legs (shared_bet_id);

-- 6) Comments on shared bets
create table if not exists public.bet_comments (
  id uuid primary key default gen_random_uuid(),
  shared_bet_id uuid not null,
  user_id uuid not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.bet_comments enable row level security;

-- Readable by all authenticated users
create policy "Anyone authenticated can view bet comments"
on public.bet_comments
for select
to authenticated
using (true);

-- Users manage their own comments
create policy "Users can create their own comments"
on public.bet_comments
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own comments"
on public.bet_comments
for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own comments"
on public.bet_comments
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists idx_bet_comments_shared on public.bet_comments (shared_bet_id, created_at desc);

-- 7) Reactions (like/tail/fire/fade) on shared bets
create table if not exists public.bet_reactions (
  id uuid primary key default gen_random_uuid(),
  shared_bet_id uuid not null,
  user_id uuid not null,
  type text not null check (type in ('like','tail','fire','fade')),
  created_at timestamptz not null default now(),
  unique (shared_bet_id, user_id, type)
);

alter table public.bet_reactions enable row level security;

-- Readable by all authenticated users
create policy "Anyone authenticated can view bet reactions"
on public.bet_reactions
for select
to authenticated
using (true);

-- Users manage their own reactions
create policy "Users can create their own reactions"
on public.bet_reactions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can delete their own reactions"
on public.bet_reactions
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists idx_bet_reactions_shared on public.bet_reactions (shared_bet_id, created_at desc);
create index if not exists idx_bet_reactions_user on public.bet_reactions (user_id);

-- 8) Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null, -- e.g. 'new_follower','bet_tailed','comment','mention'
  data jsonb not null default '{}',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

-- Only owners can read & manage their notifications
create policy "Users can view their notifications"
on public.notifications
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own notifications"
on public.notifications
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can mark their notifications as read"
on public.notifications
for update
to authenticated
using (auth.uid() = user_id);

create index if not exists idx_notifications_user on public.notifications (user_id, read, created_at desc);

-- 9) Leaderboard view (ROI / Win% / Profit for public profiles and public bets)
drop view if exists public.leaderboard_stats;
create view public.leaderboard_stats as
select
  b.user_id,
  p.display_name,
  p.avatar_url,
  count(*) filter (where b.status in ('won','lost','push','void')) as bets_count,
  count(*) filter (where b.status = 'won') as wins,
  count(*) filter (where b.status = 'lost') as losses,
  count(*) filter (where b.status = 'push') as pushes,
  coalesce(sum(case
    when b.status = 'won' then coalesce(b.potential_payout, 0) - b.stake
    when b.status = 'lost' then -b.stake
    when b.status in ('void','push') then 0
    else 0 end), 0) as profit,
  coalesce(sum(case when b.status in ('won','lost') then b.stake else 0 end), 0) as total_staked,
  case
    when coalesce(sum(case when b.status in ('won','lost') then b.stake else 0 end), 0) > 0
    then round(
      (
        coalesce(sum(case
          when b.status = 'won' then coalesce(b.potential_payout, 0) - b.stake
          when b.status = 'lost' then -b.stake
          when b.status in ('void','push') then 0
          else 0 end), 0)
        /
        coalesce(sum(case when b.status in ('won','lost') then b.stake else 0 end), 0)
      ) * 100
    , 2)
    else 0
  end as roi_percent,
  case
    when count(*) filter (where b.status in ('won','lost')) > 0
    then round( (count(*) filter (where b.status = 'won')::decimal
      / nullif(count(*) filter (where b.status in ('won','lost')), 0)) * 100, 2)
    else 0 end as win_rate_percent,
  max(b.settled_at) as last_settled_at
from public.bets b
join public.profiles p on p.user_id = b.user_id
where p.public_profile = true
  and b.is_public = true
group by b.user_id, p.display_name, p.avatar_url;

grant select on public.leaderboard_stats to authenticated;
