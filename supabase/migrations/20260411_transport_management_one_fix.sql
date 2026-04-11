begin;

-- =====================================================================
-- SchoolBus Bridge - One Fix Migration
-- Purpose: Safe reconciliation for mixed/partial migration states.
-- =====================================================================

-- 1) Ensure core enum exists (used by alerts and existing schema).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'transport_alert_type') then
    create type transport_alert_type as enum ('delay', 'emergency', 'info');
  end if;
end $$;

-- 2) Fix parents/student link only when the column exists.
--    This prevents: "column student_id referenced in foreign key constraint does not exist".
do $$
begin
  if to_regclass('public.parents') is not null
     and to_regclass('public.students') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'parents'
         and column_name = 'student_id'
     )
  then
    if not exists (
      select 1
      from pg_constraint
      where conname = 'parents_student_id_fkey'
    ) then
      alter table public.parents
        add constraint parents_student_id_fkey
        foreign key (student_id) references public.students(id) on delete set null;
    end if;

    create index if not exists parents_student_id_idx
      on public.parents (student_id);
  end if;
end $$;

-- 3) Ensure alerts route foreign key/index exist when both tables are present.
do $$
begin
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

create index if not exists alerts_route_id_idx
  on public.alerts (route_id);

-- 4) Sync alert type compatibility if both columns exist.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'alerts' and column_name = 'type'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'alerts' and column_name = 'alert_type'
  ) then
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
    where alert_type is null or type is null;
  end if;
end $$;

-- 5) Student boarding time compatibility across schemas.
do $$
begin
  if to_regclass('public.students') is not null then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'students' and column_name = 'boarding_time'
    ) and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'students' and column_name = 'default_boarding_time'
    ) then
      update public.students
      set boarding_time = coalesce(boarding_time, default_boarding_time),
          updated_at = now()
      where boarding_time is null and default_boarding_time is not null;
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'students' and column_name = 'drop_time'
    ) and exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'students' and column_name = 'default_drop_time'
    ) then
      update public.students
      set drop_time = coalesce(drop_time, default_drop_time),
          updated_at = now()
      where drop_time is null and default_drop_time is not null;
    end if;
  end if;
end $$;

commit;
