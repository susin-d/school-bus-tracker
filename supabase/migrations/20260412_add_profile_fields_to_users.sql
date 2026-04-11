-- Add gender and date_of_birth to users table
begin;

-- Create the enum if it doesn't exist (it should from previous migrations, but safe)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'transport_gender') then
    create type transport_gender as enum ('male', 'female', 'other');
  end if;
end $$;

alter table public.users
  add column if not exists gender transport_gender,
  add column if not exists date_of_birth date;

-- Backfill from drivers table if data exists
update public.users u
set 
  gender = d.gender,
  date_of_birth = d.date_of_birth
from public.drivers d
where d.user_id = u.id
  and (u.gender is null or u.date_of_birth is null);

commit;
