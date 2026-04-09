-- Consolidated migration script
-- Generated from timestamped migrations in lexical order
-- Generated on 2026-04-06

-- ============================================
-- Source: 20260404_map_routing_rls.sql
-- ============================================

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


-- ============================================
-- Source: 20260404_operational_observability.sql
-- ============================================

begin;

alter table public.route_plan_versions
  add column if not exists route_engine_mode text;

alter table public.nightly_planner_runs
  add column if not exists error_code text;

commit;

-- ============================================
-- Source: 20260404_planner_runs_rls.sql
-- ============================================

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


-- ============================================
-- Source: 20260404_role_based_access.sql
-- ============================================

begin;

create or replace function public.current_app_user_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.id
  from public.users u
  where u.auth_user_id = auth.uid()::text
  limit 1;
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.role
  from public.users u
  where u.auth_user_id = auth.uid()::text
  limit 1;
$$;

create or replace function public.current_school_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.school_id
  from public.users u
  where u.auth_user_id = auth.uid()::text
  limit 1;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = 'super_admin', false);
$$;

create or replace function public.user_is_guardian_of(student_row_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.student_guardians sg
    where sg.parent_id = public.current_app_user_id()
      and sg.student_id = student_row_id
  );
$$;

create or replace function public.user_can_manage_school_resource(resource_school_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.is_super_admin()
    or (
      public.current_app_role() = 'admin'
      and resource_school_id = public.current_school_id()
    ),
    false
  );
$$;

create or replace function public.user_can_access_student(student_row_id text, student_school_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.is_super_admin()
    or (
      public.current_app_role() = 'admin'
      and student_school_id = public.current_school_id()
    )
    or (
      public.current_app_role() = 'parent'
      and public.user_is_guardian_of(student_row_id)
    ),
    false
  );
$$;

create or replace function public.user_can_access_trip(
  trip_row_id text,
  trip_school_id text,
  trip_driver_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    public.is_super_admin()
    or (
      public.current_app_role() = 'admin'
      and trip_school_id = public.current_school_id()
    )
    or (
      public.current_app_role() = 'driver'
      and trip_school_id = public.current_school_id()
      and trip_driver_id = public.current_app_user_id()
    )
    or (
      public.current_app_role() = 'parent'
      and exists (
        select 1
        from public.trip_students ts
        join public.student_guardians sg on sg.student_id = ts.student_id
        where ts.trip_id = trip_row_id
          and sg.parent_id = public.current_app_user_id()
      )
    ),
    false
  );
$$;

alter table public.schools enable row level security;
alter table public.users enable row level security;
alter table public.students enable row level security;
alter table public.student_guardians enable row level security;
alter table public.trips enable row level security;
alter table public.trip_students enable row level security;
alter table public.trip_locations enable row level security;
alter table public.attendance_events enable row level security;
alter table public.alerts enable row level security;
alter table public.leave_requests enable row level security;
alter table public.routes enable row level security;
alter table public.stops enable row level security;
alter table public.buses enable row level security;
alter table public.drivers enable row level security;
alter table public.student_transport_assignments enable row level security;

drop policy if exists "schools_select" on public.schools;
create policy "schools_select"
on public.schools
for select
using (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and id = public.current_school_id()
  )
);

drop policy if exists "schools_manage" on public.schools;
create policy "schools_manage"
on public.schools
for all
using (public.is_super_admin())
with check (public.is_super_admin());

drop policy if exists "users_select" on public.users;
create policy "users_select"
on public.users
for select
using (
  public.is_super_admin()
  or id = public.current_app_user_id()
  or (
    public.current_app_role() = 'admin'
    and school_id = public.current_school_id()
  )
);

drop policy if exists "users_insert" on public.users;
create policy "users_insert"
on public.users
for insert
with check (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and school_id = public.current_school_id()
    and role <> 'super_admin'
  )
);

drop policy if exists "users_update" on public.users;
create policy "users_update"
on public.users
for update
using (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and school_id = public.current_school_id()
    and role <> 'super_admin'
  )
)
with check (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and school_id = public.current_school_id()
    and role <> 'super_admin'
  )
);

drop policy if exists "users_delete" on public.users;
create policy "users_delete"
on public.users
for delete
using (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and school_id = public.current_school_id()
    and role <> 'super_admin'
  )
);

drop policy if exists "students_select" on public.students;
create policy "students_select"
on public.students
for select
using (public.user_can_access_student(id, school_id));

drop policy if exists "students_manage" on public.students;
create policy "students_manage"
on public.students
for all
using (public.user_can_manage_school_resource(school_id))
with check (public.user_can_manage_school_resource(school_id));

drop policy if exists "student_guardians_select" on public.student_guardians;
create policy "student_guardians_select"
on public.student_guardians
for select
using (
  public.is_super_admin()
  or (
    public.current_app_role() = 'parent'
    and parent_id = public.current_app_user_id()
  )
  or (
    public.current_app_role() = 'admin'
    and exists (
      select 1
      from public.students s
      where s.id = student_guardians.student_id
        and s.school_id = public.current_school_id()
    )
  )
);

drop policy if exists "student_guardians_manage" on public.student_guardians;
create policy "student_guardians_manage"
on public.student_guardians
for all
using (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and exists (
      select 1
      from public.students s
      where s.id = student_guardians.student_id
        and s.school_id = public.current_school_id()
    )
  )
)
with check (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and exists (
      select 1
      from public.students s
      where s.id = student_guardians.student_id
        and s.school_id = public.current_school_id()
    )
  )
);

drop policy if exists "trips_select" on public.trips;
create policy "trips_select"
on public.trips
for select
using (public.user_can_access_trip(id, school_id, driver_id));

drop policy if exists "trips_manage" on public.trips;
create policy "trips_manage"
on public.trips
for all
using (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and school_id = public.current_school_id()
  )
  or (
    public.current_app_role() = 'driver'
    and school_id = public.current_school_id()
    and driver_id = public.current_app_user_id()
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
    and school_id = public.current_school_id()
    and driver_id = public.current_app_user_id()
  )
);

drop policy if exists "trip_students_select" on public.trip_students;
create policy "trip_students_select"
on public.trip_students
for select
using (
  exists (
    select 1
    from public.trips t
    where t.id = trip_students.trip_id
      and public.user_can_access_trip(t.id, t.school_id, t.driver_id)
  )
);

drop policy if exists "trip_students_manage" on public.trip_students;
create policy "trip_students_manage"
on public.trip_students
for all
using (
  public.is_super_admin()
  or exists (
    select 1
    from public.trips t
    where t.id = trip_students.trip_id
      and public.user_can_manage_school_resource(t.school_id)
  )
)
with check (
  public.is_super_admin()
  or exists (
    select 1
    from public.trips t
    where t.id = trip_students.trip_id
      and public.user_can_manage_school_resource(t.school_id)
  )
);

drop policy if exists "trip_locations_select" on public.trip_locations;
create policy "trip_locations_select"
on public.trip_locations
for select
using (
  exists (
    select 1
    from public.trips t
    where t.id = trip_locations.trip_id
      and public.user_can_access_trip(t.id, t.school_id, t.driver_id)
  )
);

drop policy if exists "trip_locations_insert" on public.trip_locations;
create policy "trip_locations_insert"
on public.trip_locations
for insert
with check (
  exists (
    select 1
    from public.trips t
    where t.id = trip_locations.trip_id
      and (
        public.is_super_admin()
        or (
          public.current_app_role() = 'admin'
          and t.school_id = public.current_school_id()
        )
        or (
          public.current_app_role() = 'driver'
          and t.school_id = public.current_school_id()
          and t.driver_id = public.current_app_user_id()
        )
      )
  )
);

drop policy if exists "trip_locations_delete" on public.trip_locations;
create policy "trip_locations_delete"
on public.trip_locations
for delete
using (
  exists (
    select 1
    from public.trips t
    where t.id = trip_locations.trip_id
      and public.user_can_manage_school_resource(t.school_id)
  )
);

drop policy if exists "attendance_events_select" on public.attendance_events;
create policy "attendance_events_select"
on public.attendance_events
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
      where t.id = attendance_events.trip_id
        and public.user_can_access_trip(t.id, t.school_id, t.driver_id)
    )
  )
  or (
    public.current_app_role() = 'parent'
    and public.user_is_guardian_of(student_id)
  )
);

drop policy if exists "attendance_events_insert" on public.attendance_events;
create policy "attendance_events_insert"
on public.attendance_events
for insert
with check (
  (
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
        where t.id = attendance_events.trip_id
          and t.school_id = public.current_school_id()
          and t.driver_id = public.current_app_user_id()
      )
    )
  )
  and exists (
    select 1
    from public.trip_students ts
    where ts.trip_id = attendance_events.trip_id
      and ts.student_id = attendance_events.student_id
  )
);

drop policy if exists "alerts_select" on public.alerts;
create policy "alerts_select"
on public.alerts
for select
using (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and school_id = public.current_school_id()
  )
);

drop policy if exists "alerts_insert" on public.alerts;
create policy "alerts_insert"
on public.alerts
for insert
with check (
  public.is_super_admin()
  or (
    public.current_app_role() in ('parent', 'driver', 'admin')
    and school_id = public.current_school_id()
  )
);

drop policy if exists "alerts_update" on public.alerts;
create policy "alerts_update"
on public.alerts
for update
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

drop policy if exists "leave_requests_select" on public.leave_requests;
create policy "leave_requests_select"
on public.leave_requests
for select
using (
  public.is_super_admin()
  or (
    public.current_app_role() = 'parent'
    and requested_by_parent_id = public.current_app_user_id()
  )
  or (
    public.current_app_role() in ('driver', 'admin')
    and exists (
      select 1
      from public.students s
      where s.id = leave_requests.student_id
        and s.school_id = public.current_school_id()
    )
  )
);

drop policy if exists "leave_requests_insert" on public.leave_requests;
create policy "leave_requests_insert"
on public.leave_requests
for insert
with check (
  public.current_app_role() = 'parent'
  and requested_by_parent_id = public.current_app_user_id()
  and public.user_is_guardian_of(student_id)
);

drop policy if exists "leave_requests_update" on public.leave_requests;
create policy "leave_requests_update"
on public.leave_requests
for update
using (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and exists (
      select 1
      from public.students s
      where s.id = leave_requests.student_id
        and s.school_id = public.current_school_id()
    )
  )
)
with check (
  public.is_super_admin()
  or (
    public.current_app_role() = 'admin'
    and exists (
      select 1
      from public.students s
      where s.id = leave_requests.student_id
        and s.school_id = public.current_school_id()
    )
  )
);

drop policy if exists "routes_manage" on public.routes;
create policy "routes_manage"
on public.routes
for all
using (public.user_can_manage_school_resource(school_id))
with check (public.user_can_manage_school_resource(school_id));

drop policy if exists "stops_manage" on public.stops;
create policy "stops_manage"
on public.stops
for all
using (public.user_can_manage_school_resource(school_id))
with check (public.user_can_manage_school_resource(school_id));

drop policy if exists "buses_manage" on public.buses;
create policy "buses_manage"
on public.buses
for all
using (public.user_can_manage_school_resource(school_id))
with check (public.user_can_manage_school_resource(school_id));

drop policy if exists "drivers_manage" on public.drivers;
create policy "drivers_manage"
on public.drivers
for all
using (public.user_can_manage_school_resource(school_id))
with check (public.user_can_manage_school_resource(school_id));

drop policy if exists "assignments_manage" on public.student_transport_assignments;
create policy "assignments_manage"
on public.student_transport_assignments
for all
using (public.user_can_manage_school_resource(school_id))
with check (public.user_can_manage_school_resource(school_id));

commit;

-- ============================================
-- Source: 20260405_parent_password_reset_otps.sql
-- ============================================

begin;

create table if not exists public.parent_password_reset_otps (
  id text primary key default md5(random()::text || clock_timestamp()::text),
  parent_user_id text not null references public.users(id) on delete cascade,
  auth_user_id text not null,
  email text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists parent_password_reset_otps_email_created_idx
on public.parent_password_reset_otps (email, created_at desc);

create index if not exists parent_password_reset_otps_expires_idx
on public.parent_password_reset_otps (expires_at);

alter table public.parent_password_reset_otps enable row level security;

drop policy if exists "parent_password_reset_otps_no_access" on public.parent_password_reset_otps;
create policy "parent_password_reset_otps_no_access"
on public.parent_password_reset_otps
for all
using (false)
with check (false);

commit;


-- ============================================
-- Source: 20260409_sql_performance_optimizations.sql
-- ============================================

begin;

-- Consolidate auth-context lookup so RLS policies avoid repeated users-table scans.
create or replace function public.current_app_context()
returns table(user_id text, role text, school_id text)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.role, u.school_id
  from public.users u
  where u.auth_user_id = auth.uid()::text
  limit 1;
$$;

create or replace function public.current_app_user_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select c.user_id
  from public.current_app_context() c;
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select c.role
  from public.current_app_context() c;
$$;

create or replace function public.current_school_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select c.school_id
  from public.current_app_context() c;
$$;

-- Rewrite trip-access helper to reuse one context CTE and reduce nested helper calls.
create or replace function public.user_can_access_trip(
  trip_row_id text,
  trip_school_id text,
  trip_driver_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with ctx as (
    select c.user_id, c.role, c.school_id
    from public.current_app_context() c
  )
  select coalesce(
    exists (
      select 1
      from ctx
      where role = 'super_admin'
    )
    or exists (
      select 1
      from ctx
      where role = 'admin'
        and school_id = trip_school_id
    )
    or exists (
      select 1
      from ctx
      where role = 'driver'
        and school_id = trip_school_id
        and user_id = trip_driver_id
    )
    or exists (
      select 1
      from ctx
      join public.trip_students ts on ts.trip_id = trip_row_id
      join public.student_guardians sg on sg.student_id = ts.student_id
      where ctx.role = 'parent'
        and sg.parent_id = ctx.user_id
    ),
    false
  );
$$;

-- Indexes aligned to policy predicates and hot query paths.
create index if not exists users_auth_user_id_idx
on public.users (auth_user_id);

create index if not exists student_guardians_parent_student_idx
on public.student_guardians (parent_id, student_id);

create index if not exists student_guardians_student_parent_idx
on public.student_guardians (student_id, parent_id);

create index if not exists trip_students_trip_student_idx
on public.trip_students (trip_id, student_id);

create index if not exists trip_students_student_trip_idx
on public.trip_students (student_id, trip_id);

create index if not exists trips_school_driver_status_idx
on public.trips (school_id, driver_id, status);

create index if not exists attendance_events_trip_student_idx
on public.attendance_events (trip_id, student_id);

create index if not exists leave_requests_parent_created_idx
on public.leave_requests (requested_by_parent_id, created_at desc);

create index if not exists leave_requests_student_leave_date_idx
on public.leave_requests (student_id, leave_date desc);

do $$
begin
  if exists (
    select 1
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'parent_password_reset_otps'
      and c.relkind = 'r'
  ) then
    create index if not exists parent_password_reset_otps_email_active_idx
      on public.parent_password_reset_otps (email, created_at desc, expires_at desc)
      where consumed_at is null;
  end if;
end $$;

commit;
