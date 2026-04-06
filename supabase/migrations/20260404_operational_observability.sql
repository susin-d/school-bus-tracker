begin;

alter table public.route_plan_versions
  add column if not exists route_engine_mode text;

alter table public.nightly_planner_runs
  add column if not exists error_code text;

commit;
