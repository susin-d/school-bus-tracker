begin;

-- =========================================================
-- 1) Rebuild missing table with RLS
-- =========================================================

drop table if exists public.parent_password_reset_otps cascade;

create table public.parent_password_reset_otps (
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

-- =========================================================
-- 2) Performance optimization bundle (from 20260409)
-- =========================================================

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

do $$
begin
  if to_regclass('public.users') is not null then
    create index if not exists users_auth_user_id_idx
      on public.users (auth_user_id);
  end if;

  if to_regclass('public.student_guardians') is not null then
    create index if not exists student_guardians_parent_student_idx
      on public.student_guardians (parent_id, student_id);
    create index if not exists student_guardians_student_parent_idx
      on public.student_guardians (student_id, parent_id);
  end if;

  if to_regclass('public.trip_students') is not null then
    create index if not exists trip_students_trip_student_idx
      on public.trip_students (trip_id, student_id);
    create index if not exists trip_students_student_trip_idx
      on public.trip_students (student_id, trip_id);
  end if;

  if to_regclass('public.trips') is not null then
    create index if not exists trips_school_driver_status_idx
      on public.trips (school_id, driver_id, status);
  end if;

  if to_regclass('public.attendance_events') is not null then
    create index if not exists attendance_events_trip_student_idx
      on public.attendance_events (trip_id, student_id);
  end if;

  if to_regclass('public.leave_requests') is not null then
    create index if not exists leave_requests_parent_created_idx
      on public.leave_requests (requested_by_parent_id, created_at desc);
    create index if not exists leave_requests_student_leave_date_idx
      on public.leave_requests (student_id, leave_date desc);
  end if;

  if to_regclass('public.parent_password_reset_otps') is not null then
    create index if not exists parent_password_reset_otps_email_active_idx
      on public.parent_password_reset_otps (email, created_at desc, expires_at desc)
      where consumed_at is null;
  end if;
end $$;

commit;
