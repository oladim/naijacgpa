-- NaijaCGPA — database schema
-- Run this in the Supabase dashboard: SQL Editor → New query → paste → Run.

create extension if not exists "pgcrypto";

-- One row per saved calculation. The full calculator state lives in `payload`
-- so you never need a migration when the calculator UI changes; the snapshot
-- columns (cgpa, class_name, units_counted) exist so you can list results
-- without parsing JSON.
create table if not exists public.results (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  title         text not null default 'My result',
  level         text not null default 'undergrad',   -- 'undergrad' | 'masters'
  scale         text not null default '5',            -- '5' | '4'
  cgpa          numeric(4,2),
  class_name    text,
  units_counted integer default 0,
  payload       jsonb not null default '{}'::jsonb,   -- courses, priorSemesters, name, flags
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Row Level Security: every query is automatically scoped to the signed-in user.
alter table public.results enable row level security;

drop policy if exists "results are readable by owner" on public.results;
create policy "results are readable by owner"
  on public.results for select
  using (auth.uid() = user_id);

drop policy if exists "results are insertable by owner" on public.results;
create policy "results are insertable by owner"
  on public.results for insert
  with check (auth.uid() = user_id);

drop policy if exists "results are updatable by owner" on public.results;
create policy "results are updatable by owner"
  on public.results for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "results are deletable by owner" on public.results;
create policy "results are deletable by owner"
  on public.results for delete
  using (auth.uid() = user_id);

-- Keep updated_at fresh on every edit.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists results_touch_updated on public.results;
create trigger results_touch_updated
  before update on public.results
  for each row execute function public.touch_updated_at();

create index if not exists results_user_created_idx
  on public.results (user_id, created_at desc);
