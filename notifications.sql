-- NaijaCGPA — email nudges
-- Run in Supabase → SQL Editor AFTER schema.sql. Also enable the pg_cron and
-- pg_net extensions (Database → Extensions) before scheduling.

-- Tracks when we last emailed each user and whether they opted out.
create table if not exists public.notification_state (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  last_nudge_at timestamptz,
  opted_out     boolean not null default false
);

alter table public.notification_state enable row level security;

-- Users can see and change their own preference (for an opt-out toggle later).
create policy "notif state readable by owner"
  on public.notification_state for select using (auth.uid() = user_id);
create policy "notif state insertable by owner"
  on public.notification_state for insert with check (auth.uid() = user_id);
create policy "notif state updatable by owner"
  on public.notification_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Returns who should get an email right now. Two kinds:
--   onboarding — registered 2+ days ago but hasn't saved a single course
--   reengage   — has results but hasn't updated any in 7+ days
-- Skips opted-out users and anyone emailed in the last 7 days.
create or replace function public.get_nudge_candidates()
returns table (user_id uuid, email text, full_name text, kind text)
language sql
security definer
set search_path = public
as $$
  with base as (
    select
      u.id,
      u.email,
      coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)) as full_name,
      u.created_at,
      (select count(*) from public.results r where r.user_id = u.id) as result_count,
      (select max(r.updated_at) from public.results r where r.user_id = u.id) as last_result_at,
      ns.last_nudge_at,
      coalesce(ns.opted_out, false) as opted_out
    from auth.users u
    left join public.notification_state ns on ns.user_id = u.id
    where u.email is not null
  )
  select
    id, email, full_name,
    case when result_count = 0 then 'onboarding' else 'reengage' end as kind
  from base
  where opted_out = false
    and (last_nudge_at is null or last_nudge_at < now() - interval '7 days')
    and (
      (result_count = 0 and created_at < now() - interval '2 days')
      or (result_count > 0 and last_result_at < now() - interval '7 days')
    );
$$;

-- Only the service role (used by the Edge Function) may run it.
revoke all on function public.get_nudge_candidates() from public, anon, authenticated;
grant execute on function public.get_nudge_candidates() to service_role;
