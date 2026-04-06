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
