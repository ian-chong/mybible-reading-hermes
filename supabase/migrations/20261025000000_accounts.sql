-- Accounts + cloud sync for the reading tracker. Mirrors the local state in src/lib/store.js.
-- Every table is private to its owner via row-level security.

create table public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  display_name text check (char_length(display_name) <= 40),
  avatar_id text,
  timezone text,
  updated_at timestamptz not null default now()
);

create table public.plan_runs (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade,
  started_at timestamptz not null,
  deadline date not null,
  status text not null check (status in ('active', 'completed', 'abandoned')),
  ended_at timestamptz,
  updated_at timestamptz not null default now()
);
create index plan_runs_user on public.plan_runs (user_id);

-- Append-only: rows are never updated or deleted by the app.
create table public.reading_events (
  id uuid primary key,
  user_id uuid not null references auth.users on delete cascade,
  run_id uuid not null references public.plan_runs on delete cascade,
  book text not null,
  chapter smallint not null check (chapter > 0),
  action text not null check (action in ('read', 'unread')),
  at timestamptz not null,
  source text not null default 'bible',
  undated boolean not null default false,
  -- Server time the row arrived; devices pull everything newer than their last pull.
  inserted_at timestamptz not null default clock_timestamp()
);
create index reading_events_user_inserted on public.reading_events (user_id, inserted_at);

create table public.story_steps (
  user_id uuid not null references auth.users on delete cascade,
  run_id uuid not null references public.plan_runs on delete cascade,
  story_id text not null,
  step smallint not null check (step > 0),
  primary key (user_id, run_id, story_id, step)
);

-- New tables aren't exposed to the Data API automatically: grant exactly what the app needs.
-- Signed-in users only (no anon access); RLS below limits them to their own rows.
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update on public.plan_runs to authenticated;
grant select, insert on public.reading_events to authenticated;
grant select, insert, update on public.story_steps to authenticated;

alter table public.profiles enable row level security;
alter table public.plan_runs enable row level security;
alter table public.reading_events enable row level security;
alter table public.story_steps enable row level security;

create policy "own profile" on public.profiles for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own runs" on public.plan_runs for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "read own events" on public.reading_events for select
  using (user_id = (select auth.uid()));
create policy "add own events" on public.reading_events for insert
  with check (user_id = (select auth.uid()));
create policy "own story steps" on public.story_steps for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Lets a signed-in user delete their own account (and, by cascade, all their data).
create function public.delete_my_account() returns void
language sql security definer set search_path = '' as $$
  delete from auth.users where id = auth.uid();
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
