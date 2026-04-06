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
