begin;

create table if not exists public.nightly_planner_runs (
  id text primary key default md5(random()::text || clock_timestamp()::text),
  school_id text not null references public.schools(id) on delete cascade,
  run_date date not null,
  trigger_type text not null check (trigger_type in ('manual', 'automatic')),
  status text not null check (status in ('success', 'failed')),
  processed_trips integer not null default 0,
  planned_trips integer not null default 0,
  skipped_trips integer not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists nightly_planner_runs_school_started_idx
on public.nightly_planner_runs (school_id, started_at desc);

alter table public.nightly_planner_runs enable row level security;

drop policy if exists "nightly_planner_runs_select" on public.nightly_planner_runs;
create policy "nightly_planner_runs_select"
on public.nightly_planner_runs
for select
using (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and school_id = public.current_school_id()
  )
);

drop policy if exists "nightly_planner_runs_insert" on public.nightly_planner_runs;
create policy "nightly_planner_runs_insert"
on public.nightly_planner_runs
for insert
with check (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and school_id = public.current_school_id()
  )
);

drop policy if exists "nightly_planner_runs_delete" on public.nightly_planner_runs;
create policy "nightly_planner_runs_delete"
on public.nightly_planner_runs
for delete
using (
  public.is_super_admin()
);

commit;

