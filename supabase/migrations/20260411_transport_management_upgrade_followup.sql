begin;

-- =====================================================================
-- SchoolBus Bridge - Transport Upgrade Follow-up (safe / idempotent)
-- Use this after 20260411_transport_management_upgrade.sql
-- =====================================================================

-- 1) Ensure parents.student_id exists for old environments where
--    parents table already existed before the main migration.
alter table if exists public.parents
  add column if not exists student_id text;

-- 2) Ensure additional compatibility columns exist.
alter table if exists public.drivers
  add column if not exists salary numeric(12,2);

alter table if exists public.students
  add column if not exists boarding_time time,
  add column if not exists drop_time time;

alter table if exists public.alerts
  add column if not exists type transport_alert_type,
  add column if not exists alert_type transport_alert_type;

-- 3) Add/repair FK constraints only when tables exist and constraint missing.
do $$
begin
  if to_regclass('public.parents') is not null and to_regclass('public.students') is not null then
    if not exists (
      select 1
      from pg_constraint
      where conname = 'parents_student_id_fkey'
    ) then
      alter table public.parents
        add constraint parents_student_id_fkey
        foreign key (student_id) references public.students(id) on delete set null;
    end if;
  end if;

  if to_regclass('public.alerts') is not null and to_regclass('public.routes') is not null then
    if not exists (
      select 1
      from pg_constraint
      where conname = 'alerts_route_id_fkey'
    ) then
      alter table public.alerts
        add constraint alerts_route_id_fkey
        foreign key (route_id) references public.routes(id) on delete set null;
    end if;
  end if;
end $$;

-- 4) Ensure useful indexes exist.
create index if not exists parents_student_id_idx
  on public.parents (student_id);

create index if not exists alerts_route_id_idx
  on public.alerts (route_id);

-- 5) Backfill compatibility values.
update public.students
set
  boarding_time = coalesce(boarding_time, default_boarding_time),
  drop_time = coalesce(drop_time, default_drop_time),
  updated_at = now()
where
  (boarding_time is null and default_boarding_time is not null)
  or (drop_time is null and default_drop_time is not null);

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
