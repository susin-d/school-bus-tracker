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
