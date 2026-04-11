begin;

-- ==============================================================
-- SchoolBus Bridge - Transport Management Upgrade (Additive)
-- Goal: Extend schema without breaking existing functionality.
-- ==============================================================

-- Optional utility extension for UUID generation when needed.
create extension if not exists pgcrypto;

-- --------------------------------------------------------------
-- Enums (created only if missing)
-- --------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'transport_gender') then
    create type transport_gender as enum ('male', 'female', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'transport_license_type') then
    create type transport_license_type as enum ('LMV', 'HMV', 'BUS');
  end if;

  if not exists (select 1 from pg_type where typname = 'transport_police_verification_status') then
    create type transport_police_verification_status as enum ('verified', 'pending');
  end if;

  if not exists (select 1 from pg_type where typname = 'transport_employee_status') then
    create type transport_employee_status as enum ('active', 'inactive', 'suspended');
  end if;

  if not exists (select 1 from pg_type where typname = 'transport_student_status') then
    create type transport_student_status as enum ('active', 'inactive');
  end if;

  if not exists (select 1 from pg_type where typname = 'transport_bus_status') then
    create type transport_bus_status as enum ('running', 'idle', 'maintenance');
  end if;

  if not exists (select 1 from pg_type where typname = 'transport_route_status') then
    create type transport_route_status as enum ('active', 'inactive');
  end if;

  if not exists (select 1 from pg_type where typname = 'transport_parent_relation') then
    create type transport_parent_relation as enum ('father', 'mother', 'guardian');
  end if;

  if not exists (select 1 from pg_type where typname = 'transport_trip_log_status') then
    create type transport_trip_log_status as enum ('picked', 'dropped', 'absent');
  end if;

  if not exists (select 1 from pg_type where typname = 'transport_alert_type') then
    create type transport_alert_type as enum ('delay', 'emergency', 'info');
  end if;
end $$;

-- --------------------------------------------------------------
-- Drivers table upgrade
-- --------------------------------------------------------------

alter table if exists public.drivers
  add column if not exists full_name text,
  add column if not exists phone_number text,
  add column if not exists email text,
  add column if not exists date_of_birth date,
  add column if not exists gender transport_gender,
  add column if not exists address text,
  add column if not exists license_number text,
  add column if not exists license_type transport_license_type,
  add column if not exists license_expiry_date date,
  add column if not exists aadhar_number text,
  add column if not exists photo_url text,
  add column if not exists police_verification_status transport_police_verification_status default 'pending',
  add column if not exists employee_id text,
  add column if not exists joining_date date,
  add column if not exists salary numeric(12,2),
  add column if not exists status transport_employee_status default 'active',
  add column if not exists medical_certificate_expiry date,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists assigned_bus_id text,
  add column if not exists current_latitude double precision,
  add column if not exists current_longitude double precision,
  add column if not exists is_online boolean not null default false,
  add column if not exists last_active_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

-- --------------------------------------------------------------
-- Students table upgrade
-- --------------------------------------------------------------

alter table if exists public.students
  add column if not exists admission_number text,
  add column if not exists date_of_birth date,
  add column if not exists gender transport_gender,
  add column if not exists photo_url text,
  add column if not exists class text,
  add column if not exists section text,
  add column if not exists roll_number text,
  add column if not exists pickup_stop_id text,
  add column if not exists drop_stop_id text,
  add column if not exists route_id text,
  add column if not exists assigned_bus_id text,
  add column if not exists transport_status transport_student_status default 'active',
  add column if not exists home_address text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists rfid_tag text,
  add column if not exists qr_code text,
  add column if not exists boarding_time time,
  add column if not exists drop_time time,
  add column if not exists default_boarding_time time,
  add column if not exists default_drop_time time,
  add column if not exists updated_at timestamptz not null default now();

-- --------------------------------------------------------------
-- Buses table upgrade
-- --------------------------------------------------------------

alter table if exists public.buses
  add column if not exists bus_number text,
  add column if not exists vehicle_number text,
  add column if not exists capacity integer,
  add column if not exists driver_id text,
  add column if not exists route_id text,
  add column if not exists gps_device_id text,
  add column if not exists current_latitude double precision,
  add column if not exists current_longitude double precision,
  add column if not exists status transport_bus_status default 'idle',
  add column if not exists updated_at timestamptz not null default now();

-- --------------------------------------------------------------
-- Routes table upgrade
-- --------------------------------------------------------------

alter table if exists public.routes
  add column if not exists route_name text,
  add column if not exists route_code text,
  add column if not exists status transport_route_status default 'active',
  add column if not exists updated_at timestamptz not null default now();

-- --------------------------------------------------------------
-- Stops table upgrade
-- --------------------------------------------------------------

alter table if exists public.stops
  add column if not exists stop_name text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists route_id text,
  add column if not exists sequence_order integer,
  add column if not exists updated_at timestamptz not null default now();

-- --------------------------------------------------------------
-- Alerts table upgrade
-- --------------------------------------------------------------

alter table if exists public.alerts
  add column if not exists route_id text,
  add column if not exists type transport_alert_type,
  add column if not exists alert_type transport_alert_type;

-- --------------------------------------------------------------
-- Parents table (new)
-- Uses users.id (role = parent) for compatibility with current auth model
-- --------------------------------------------------------------

create table if not exists public.parents (
  id text primary key references public.users(id) on delete cascade,
  full_name text,
  phone_number text not null,
  email text,
  address text,
  student_id text,   
  relation transport_parent_relation,
  password_hash text,
  notification_preferences jsonb not null default jsonb_build_object('sms', true, 'push', true, 'email', true),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure new column exists for older environments where parents table
-- already existed before this migration.
alter table if exists public.parents
  add column if not exists student_id text;

-- Parent to student mapping (supports one parent to many students)
create table if not exists public.parent_students (
  id text primary key default md5(random()::text || clock_timestamp()::text),
  parent_id text not null references public.parents(id) on delete cascade,
  student_id text not null references public.students(id) on delete cascade,
  relation transport_parent_relation,
  created_at timestamptz not null default now(),
  unique (parent_id, student_id)
);

-- --------------------------------------------------------------
-- Trip logs table (new)
-- --------------------------------------------------------------

create table if not exists public.trip_logs (
  id text primary key default md5(random()::text || clock_timestamp()::text),
  school_id text not null references public.schools(id) on delete cascade,
  student_id text not null references public.students(id) on delete cascade,
  bus_id text references public.buses(id) on delete set null,
  driver_id text references public.drivers(id) on delete set null,
  boarding_time timestamptz,
  drop_time timestamptz,
  status transport_trip_log_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --------------------------------------------------------------
-- Foreign keys added only when target tables are present
-- --------------------------------------------------------------

do $$
begin
  if to_regclass('public.drivers') is not null and to_regclass('public.buses') is not null then
    if not exists (
      select 1
      from pg_constraint
      where conname = 'drivers_assigned_bus_id_fkey'
    ) then
      alter table public.drivers
        add constraint drivers_assigned_bus_id_fkey
        foreign key (assigned_bus_id) references public.buses(id) on delete set null;
    end if;
  end if;

  if to_regclass('public.students') is not null and to_regclass('public.stops') is not null then
    if not exists (
      select 1 from pg_constraint where conname = 'students_pickup_stop_id_fkey'
    ) then
      alter table public.students
        add constraint students_pickup_stop_id_fkey
        foreign key (pickup_stop_id) references public.stops(id) on delete set null;
    end if;

    if not exists (
      select 1 from pg_constraint where conname = 'students_drop_stop_id_fkey'
    ) then
      alter table public.students
        add constraint students_drop_stop_id_fkey
        foreign key (drop_stop_id) references public.stops(id) on delete set null;
    end if;
  end if;

  if to_regclass('public.students') is not null and to_regclass('public.routes') is not null then
    if not exists (
      select 1 from pg_constraint where conname = 'students_route_id_fkey'
    ) then
      alter table public.students
        add constraint students_route_id_fkey
        foreign key (route_id) references public.routes(id) on delete set null;
    end if;
  end if;

  if to_regclass('public.students') is not null and to_regclass('public.buses') is not null then
    if not exists (
      select 1 from pg_constraint where conname = 'students_assigned_bus_id_fkey'
    ) then
      alter table public.students
        add constraint students_assigned_bus_id_fkey
        foreign key (assigned_bus_id) references public.buses(id) on delete set null;
    end if;
  end if;

  if to_regclass('public.buses') is not null and to_regclass('public.drivers') is not null then
    if not exists (
      select 1 from pg_constraint where conname = 'buses_driver_id_fkey'
    ) then
      alter table public.buses
        add constraint buses_driver_id_fkey
        foreign key (driver_id) references public.drivers(id) on delete set null;
    end if;
  end if;

  if to_regclass('public.buses') is not null and to_regclass('public.routes') is not null then
    if not exists (
      select 1 from pg_constraint where conname = 'buses_route_id_fkey'
    ) then
      alter table public.buses
        add constraint buses_route_id_fkey
        foreign key (route_id) references public.routes(id) on delete set null;
    end if;
  end if;

  if to_regclass('public.stops') is not null and to_regclass('public.routes') is not null then
    if not exists (
      select 1 from pg_constraint where conname = 'stops_route_id_fkey'
    ) then
      alter table public.stops
        add constraint stops_route_id_fkey
        foreign key (route_id) references public.routes(id) on delete set null;
    end if;
  end if;

  if to_regclass('public.alerts') is not null and to_regclass('public.routes') is not null then
    if not exists (
      select 1 from pg_constraint where conname = 'alerts_route_id_fkey'
    ) then
      alter table public.alerts
        add constraint alerts_route_id_fkey
        foreign key (route_id) references public.routes(id) on delete set null;
    end if;
  end if;

  if to_regclass('public.parents') is not null and to_regclass('public.students') is not null then
    if not exists (
      select 1 from pg_constraint where conname = 'parents_student_id_fkey'
    ) then
      alter table public.parents
        add constraint parents_student_id_fkey
        foreign key (student_id) references public.students(id) on delete set null;
    end if;
  end if;
end $$;

-- --------------------------------------------------------------
-- Unique + performance indexes
-- --------------------------------------------------------------

create unique index if not exists drivers_phone_number_unique_idx
  on public.drivers (phone_number)
  where phone_number is not null;

create unique index if not exists students_admission_number_unique_idx
  on public.students (admission_number)
  where admission_number is not null;

create unique index if not exists buses_vehicle_number_unique_idx
  on public.buses (vehicle_number)
  where vehicle_number is not null;

create unique index if not exists parents_phone_number_unique_idx
  on public.parents (phone_number);

create index if not exists parents_student_id_idx
  on public.parents (student_id);

create index if not exists students_route_id_idx
  on public.students (route_id);

create index if not exists students_assigned_bus_id_idx
  on public.students (assigned_bus_id);

create index if not exists buses_route_id_idx
  on public.buses (route_id);

create index if not exists buses_driver_id_idx
  on public.buses (driver_id);

create index if not exists stops_route_id_idx
  on public.stops (route_id);

create index if not exists trip_logs_student_id_idx
  on public.trip_logs (student_id);

create index if not exists trip_logs_bus_id_idx
  on public.trip_logs (bus_id);

create index if not exists trip_logs_driver_id_idx
  on public.trip_logs (driver_id);

create index if not exists trip_logs_school_id_idx
  on public.trip_logs (school_id);

create index if not exists alerts_route_id_idx
  on public.alerts (route_id);

-- Requested phone number indexing
create index if not exists users_phone_number_idx
  on public.users (phone_number)
  where phone_number is not null;

-- --------------------------------------------------------------
-- Backfill helpers (safe no-op when source data missing)
-- --------------------------------------------------------------

-- Keep legacy student address/lat/lng in sync with new names when values are missing.
update public.students
set
  home_address = coalesce(home_address, address_text),
  latitude = coalesce(latitude, lat),
  longitude = coalesce(longitude, lng),
  boarding_time = coalesce(boarding_time, default_boarding_time),
  drop_time = coalesce(drop_time, default_drop_time),
  updated_at = now()
where
  (home_address is null and address_text is not null)
  or (latitude is null and lat is not null)
  or (longitude is null and lng is not null)
  or (boarding_time is null and default_boarding_time is not null)
  or (drop_time is null and default_drop_time is not null);

-- Keep alert type columns in sync for backward compatibility.
update public.alerts
set
  alert_type = coalesce(
    alert_type,
    case
      when lower(type::text) = 'delay' then 'delay'::transport_alert_type
      when lower(type::text) = 'emergency' then 'emergency'::transport_alert_type
      when lower(type::text) = 'info' then 'info'::transport_alert_type
      else null
    end
  ),
  type = coalesce(
    type,
    case
      when lower(alert_type::text) = 'delay' then 'delay'::transport_alert_type
      when lower(alert_type::text) = 'emergency' then 'emergency'::transport_alert_type
      when lower(alert_type::text) = 'info' then 'info'::transport_alert_type
      else null
    end
  )
where
  alert_type is null
  or type is null;

commit;
