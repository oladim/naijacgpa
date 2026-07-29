-- NaijaCGPA — admin dashboard support
-- Run this in Supabase → SQL Editor AFTER schema.sql.

-- 1. Allowlist of admin emails. No API policies => not readable from the client;
--    only the SECURITY DEFINER function below (and the service role) can see it.
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;

-- >>> ADD YOURSELF (use the Google email you'll sign in with):
-- insert into public.admins (email) values ('you@example.com');

-- 2. Stats function. Runs as its owner (so it can read auth.users), but refuses
--    to return anything unless the CALLER's email is on the allowlist.
create or replace function public.get_admin_stats()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean;
  result json;
begin
  select exists (
    select 1 from public.admins a where a.email = auth.jwt() ->> 'email'
  ) into is_admin;

  if not is_admin then
    raise exception 'not authorized';
  end if;

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
        from auth.users
        where created_at > now() - interval '14 days'
        group by 1
      ) d
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_admin_stats() from public;
grant execute on function public.get_admin_stats() to authenticated;
