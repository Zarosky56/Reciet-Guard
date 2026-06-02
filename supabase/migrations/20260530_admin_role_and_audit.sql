-- ============================================================
-- Admin role + audit log
-- Adds a `role` column to profiles, an `is_admin()` helper,
-- and an append-only `audit_logs` table. RLS policies grant
-- admins read access to profiles and receipts; users keep their
-- existing access.
--
-- Run order:
--   1. Apply this migration in Supabase Studio → SQL Editor
--      (or via `supabase db push` if the CLI is wired).
--   2. Run `npm run setup:admin` (see scripts/bootstrap-admin.mjs)
--      to create / promote your admin user.
-- ============================================================

-- 1. Role column on profiles ----------------------------------
alter table public.profiles
  add column if not exists role text not null default 'user';

-- Constraint added separately so re-running is idempotent
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('user', 'admin'));
  end if;
end$$;

create index if not exists profiles_role_idx on public.profiles(role);

-- 2. is_admin() helper ----------------------------------------
-- SECURITY DEFINER so it can be referenced inside RLS policies
-- without recursing into profiles' own RLS.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated, service_role;

-- 3. Audit log table — append-only ----------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_actor_idx
  on public.audit_logs(actor_id, created_at desc);
create index if not exists audit_logs_target_idx
  on public.audit_logs(target_type, target_id, created_at desc);
create index if not exists audit_logs_action_idx
  on public.audit_logs(action, created_at desc);

alter table public.audit_logs enable row level security;

-- Audit log: admins can read; nobody can insert/update/delete via
-- the public API. Server-side code uses the service-role key to
-- write (bypasses RLS).
drop policy if exists audit_logs_admin_select on public.audit_logs;
create policy audit_logs_admin_select on public.audit_logs
  for select to authenticated
  using (public.is_admin(auth.uid()));

-- 4. Admin RLS on profiles + receipts -------------------------
-- These are additive — they coexist with whatever user-scoped
-- policies already exist. Drop-then-create so the migration is
-- idempotent.

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

drop policy if exists receipts_admin_select on public.receipts;
create policy receipts_admin_select on public.receipts
  for select to authenticated
  using (public.is_admin(auth.uid()));

-- 5. Comment on the role column for the Studio UI -------------
comment on column public.profiles.role is
  'Either ''user'' (default) or ''admin''. Admins gain RLS
   read access to all profiles, receipts, and audit_logs.';
