-- ============================================================
-- NaijaCGPA — ONE-SHOT SETUP
-- Run this whole file once in Supabase → SQL Editor. It is safe to
-- run again any time (idempotent). After it succeeds, add your admin
-- email at the very bottom.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- 1. results ----------
create table if not exists public.results (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  title         text not null default 'My result',
  level         text not null default 'undergrad',
  scale         text not null default '5',
  cgpa          numeric(4,2),
  class_name    text,
  units_counted integer default 0,
  payload       jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.results enable row level security;

drop policy if exists "results are readable by owner" on public.results;
create policy "results are readable by owner"
  on public.results for select using (auth.uid() = user_id);

drop policy if exists "results are insertable by owner" on public.results;
create policy "results are insertable by owner"
  on public.results for insert with check (auth.uid() = user_id);

drop policy if exists "results are updatable by owner" on public.results;
create policy "results are updatable by owner"
  on public.results for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "results are deletable by owner" on public.results;
create policy "results are deletable by owner"
  on public.results for delete using (auth.uid() = user_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists results_touch_updated on public.results;
create trigger results_touch_updated
  before update on public.results
  for each row execute function public.touch_updated_at();

create index if not exists results_user_created_idx
  on public.results (user_id, created_at desc);

-- ---------- 1b. user_state (ONE row per user — their working data) ----------
-- Saving from the app upserts this row, so a user keeps a single, evolving
-- record that preloads on any device they log in from.
create table if not exists public.user_state (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  current_courses    jsonb not null default '[]'::jsonb,
  previous_semesters jsonb not null default '[]'::jsonb,
  graduation_target  jsonb not null default '{}'::jsonb,
  meta               jsonb not null default '{}'::jsonb,
  cgpa               numeric(4,2),
  class_name         text,
  updated_at         timestamptz not null default now()
);
alter table public.user_state enable row level security;

drop policy if exists "user_state readable by owner" on public.user_state;
create policy "user_state readable by owner"
  on public.user_state for select using (auth.uid() = user_id);
drop policy if exists "user_state insertable by owner" on public.user_state;
create policy "user_state insertable by owner"
  on public.user_state for insert with check (auth.uid() = user_id);
drop policy if exists "user_state updatable by owner" on public.user_state;
create policy "user_state updatable by owner"
  on public.user_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists user_state_touch_updated on public.user_state;
create trigger user_state_touch_updated
  before update on public.user_state
  for each row execute function public.touch_updated_at();

-- ---------- 2. admins ----------
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;

create or replace function public.get_admin_stats()
returns json language plpgsql security definer set search_path = public
as $$
declare is_admin boolean; result json;
begin
  select exists (select 1 from public.admins a where a.email = auth.jwt() ->> 'email')
    into is_admin;
  if not is_admin then raise exception 'not authorized'; end if;

  select json_build_object(
    'total_users',   (select count(*) from auth.users),
    'users_24h',     (select count(*) from auth.users where created_at > now() - interval '1 day'),
    'users_7d',      (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'total_results', (select count(*) from public.results),
    'results_7d',    (select count(*) from public.results where created_at > now() - interval '7 days'),
    'signups_by_day', (
      select coalesce(json_agg(row_to_json(d) order by d.day), '[]'::json)
      from (
        select date_trunc('day', created_at)::date as day, count(*)::int as count
        from auth.users where created_at > now() - interval '14 days' group by 1
      ) d
    )
  ) into result;
  return result;
end; $$;

revoke all on function public.get_admin_stats() from public;
grant execute on function public.get_admin_stats() to authenticated;

-- ---------- 3. notification_state (for email nudges) ----------
create table if not exists public.notification_state (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  last_nudge_at timestamptz,
  opted_out     boolean not null default false
);
alter table public.notification_state enable row level security;

drop policy if exists "notif state readable by owner" on public.notification_state;
create policy "notif state readable by owner"
  on public.notification_state for select using (auth.uid() = user_id);
drop policy if exists "notif state insertable by owner" on public.notification_state;
create policy "notif state insertable by owner"
  on public.notification_state for insert with check (auth.uid() = user_id);
drop policy if exists "notif state updatable by owner" on public.notification_state;
create policy "notif state updatable by owner"
  on public.notification_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.get_nudge_candidates()
returns table (user_id uuid, email text, full_name text, kind text)
language sql security definer set search_path = public
as $$
  with base as (
    select u.id, u.email,
      coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)) as full_name,
      u.created_at,
      (select count(*) from public.results r where r.user_id = u.id) as result_count,
      (select max(r.updated_at) from public.results r where r.user_id = u.id) as last_result_at,
      ns.last_nudge_at, coalesce(ns.opted_out, false) as opted_out
    from auth.users u
    left join public.notification_state ns on ns.user_id = u.id
    where u.email is not null
  )
  select id, email, full_name,
    case when result_count = 0 then 'onboarding' else 'reengage' end as kind
  from base
  where opted_out = false
    and (last_nudge_at is null or last_nudge_at < now() - interval '7 days')
    and (
      (result_count = 0 and created_at < now() - interval '2 days')
      or (result_count > 0 and last_result_at < now() - interval '7 days')
    );
$$;

revoke all on function public.get_nudge_candidates() from public, anon, authenticated;
grant execute on function public.get_nudge_candidates() to service_role;

-- ============================================================
-- 4. MAKE YOURSELF ADMIN
-- Uncomment the next line, put YOUR Google sign-in email, and run it.
-- (You can run just this line by itself any time.)
-- ============================================================
-- insert into public.admins (email) values ('your-google-email@gmail.com')
--   on conflict (email) do nothing;
