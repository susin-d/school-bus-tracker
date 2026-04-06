begin;

alter table public.students
  add column if not exists address_text text,
  add column if not exists lat double precision,
  add column if not exists lng double precision,
  add column if not exists geocode_status text not null default 'pending',
  add column if not exists place_id text,
  add column if not exists last_geocoded_at timestamptz,
  add column if not exists geocode_error text;

create table if not exists public.school_map_settings (
  id text primary key default md5(random()::text || clock_timestamp()::text),
  school_id text not null references public.schools(id) on delete cascade,
  dispatch_start_time timestamptz,
  no_show_wait_seconds integer not null default 120,
  max_detour_minutes integer not null default 15,
  dispatch_latitude double precision,
  dispatch_longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id)
);

create table if not exists public.trip_stops (
  id text primary key default md5(random()::text || clock_timestamp()::text),
  school_id text not null references public.schools(id) on delete cascade,
  trip_id text not null references public.trips(id) on delete cascade,
  student_id text references public.students(id) on delete set null,
  stop_id text,
  student_name text,
  address_text text,
  latitude double precision not null,
  longitude double precision not null,
  sequence integer not null,
  planned_eta timestamptz,
  current_eta timestamptz,
  stop_status text not null default 'scheduled',
  skip_reason text,
  actual_arrived_at timestamptz,
  actual_boarded_at timestamptz,
  actual_dropped_at timestamptz,
  no_show_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists trip_stops_trip_student_unique_idx
on public.trip_stops (trip_id, student_id)
where student_id is not null;

create index if not exists trip_stops_trip_sequence_idx
on public.trip_stops (trip_id, sequence);

create table if not exists public.route_plan_versions (
  id text primary key default md5(random()::text || clock_timestamp()::text),
  school_id text not null references public.schools(id) on delete cascade,
  trip_id text not null references public.trips(id) on delete cascade,
  version integer not null,
  reason text not null,
  snapshot jsonb not null default '[]'::jsonb,
  created_by_user_id text references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (trip_id, version)
);

create index if not exists route_plan_versions_trip_version_idx
on public.route_plan_versions (trip_id, version desc);

create table if not exists public.eta_updates (
  id text primary key default md5(random()::text || clock_timestamp()::text),
  school_id text not null references public.schools(id) on delete cascade,
  trip_id text not null references public.trips(id) on delete cascade,
  trip_stop_id text references public.trip_stops(id) on delete set null,
  student_id text references public.students(id) on delete set null,
  reason text not null,
  eta_at timestamptz,
  planned_eta timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists eta_updates_trip_created_idx
on public.eta_updates (trip_id, created_at desc);

alter table public.school_map_settings enable row level security;
alter table public.trip_stops enable row level security;
alter table public.route_plan_versions enable row level security;
alter table public.eta_updates enable row level security;

drop policy if exists "school_map_settings_select" on public.school_map_settings;
create policy "school_map_settings_select"
on public.school_map_settings
for select
using (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and school_id = public.current_school_id()
  )
);

drop policy if exists "school_map_settings_manage" on public.school_map_settings;
create policy "school_map_settings_manage"
on public.school_map_settings
for all
using (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and school_id = public.current_school_id()
  )
)
with check (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and school_id = public.current_school_id()
  )
);

drop policy if exists "trip_stops_select" on public.trip_stops;
create policy "trip_stops_select"
on public.trip_stops
for select
using (
  exists (
    select 1
    from public.trips t
    where t.id = trip_stops.trip_id
      and public.user_can_access_trip(t.id, t.school_id, t.driver_id)
  )
);

drop policy if exists "trip_stops_manage" on public.trip_stops;
create policy "trip_stops_manage"
on public.trip_stops
for all
using (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and school_id = public.current_school_id()
  )
  or (
    public.current_app_role() = 'driver'
    and exists (
      select 1
      from public.trips t
      where t.id = trip_stops.trip_id
        and t.school_id = public.current_school_id()
        and t.driver_id = public.current_app_user_id()
    )
  )
)
with check (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and school_id = public.current_school_id()
  )
  or (
    public.current_app_role() = 'driver'
    and exists (
      select 1
      from public.trips t
      where t.id = trip_stops.trip_id
        and t.school_id = public.current_school_id()
        and t.driver_id = public.current_app_user_id()
    )
  )
);

drop policy if exists "route_plan_versions_select" on public.route_plan_versions;
create policy "route_plan_versions_select"
on public.route_plan_versions
for select
using (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and school_id = public.current_school_id()
  )
  or (
    public.current_app_role() = 'driver'
    and exists (
      select 1
      from public.trips t
      where t.id = route_plan_versions.trip_id
        and t.school_id = public.current_school_id()
        and t.driver_id = public.current_app_user_id()
    )
  )
);

drop policy if exists "route_plan_versions_manage" on public.route_plan_versions;
create policy "route_plan_versions_manage"
on public.route_plan_versions
for all
using (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and school_id = public.current_school_id()
  )
)
with check (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and school_id = public.current_school_id()
  )
);

drop policy if exists "eta_updates_select" on public.eta_updates;
create policy "eta_updates_select"
on public.eta_updates
for select
using (
  exists (
    select 1
    from public.trips t
    where t.id = eta_updates.trip_id
      and public.user_can_access_trip(t.id, t.school_id, t.driver_id)
  )
);

drop policy if exists "eta_updates_insert" on public.eta_updates;
create policy "eta_updates_insert"
on public.eta_updates
for insert
with check (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and school_id = public.current_school_id()
  )
  or (
    public.current_app_role() = 'driver'
    and exists (
      select 1
      from public.trips t
      where t.id = eta_updates.trip_id
        and t.school_id = public.current_school_id()
        and t.driver_id = public.current_app_user_id()
    )
  )
);

drop policy if exists "eta_updates_delete" on public.eta_updates;
create policy "eta_updates_delete"
on public.eta_updates
for delete
using (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and school_id = public.current_school_id()
  )
);

commit;

