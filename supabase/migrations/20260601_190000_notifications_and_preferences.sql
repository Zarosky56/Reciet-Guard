-- ============================================================
-- Notification, onboarding, and reminder preferences
-- ============================================================

alter table public.profiles
  add column if not exists default_currency text not null default 'USD',
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists intro_to_app_enabled boolean not null default false,
  add column if not exists email_notifications_enabled boolean not null default true,
  add column if not exists push_notifications_enabled boolean not null default false,
  add column if not exists reminder_thresholds integer[] not null default array[20, 7, 3, 1, 0];

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_default_currency_check'
  ) then
    alter table public.profiles
      add constraint profiles_default_currency_check
      check (default_currency ~ '^[A-Z]{3}$');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_reminder_thresholds_check'
  ) then
    alter table public.profiles
      add constraint profiles_reminder_thresholds_check
      check (
        reminder_thresholds <@ array[20, 7, 3, 1, 0]
        and cardinality(reminder_thresholds) > 0
      );
  end if;
end $$;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  enabled boolean not null default true,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions(user_id, enabled);

alter table public.push_subscriptions enable row level security;

drop policy if exists push_subscriptions_select_own on public.push_subscriptions;
create policy push_subscriptions_select_own on public.push_subscriptions
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists push_subscriptions_insert_own on public.push_subscriptions;
create policy push_subscriptions_insert_own on public.push_subscriptions
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists push_subscriptions_update_own on public.push_subscriptions;
create policy push_subscriptions_update_own on public.push_subscriptions
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists push_subscriptions_delete_own on public.push_subscriptions;
create policy push_subscriptions_delete_own on public.push_subscriptions
  for delete to authenticated
  using (auth.uid() = user_id);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  receipt_id uuid references public.receipts(id) on delete cascade,
  channel text not null,
  type text not null,
  threshold_days integer,
  dedupe_key text not null,
  title text not null,
  body text not null,
  delivery_status text not null default 'pending',
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'notification_events_channel_check'
  ) then
    alter table public.notification_events
      add constraint notification_events_channel_check
      check (channel in ('email', 'push', 'in_app'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'notification_events_type_check'
  ) then
    alter table public.notification_events
      add constraint notification_events_type_check
      check (type in ('return_deadline', 'warranty_deadline', 'gmail_import', 'extraction_review'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'notification_events_status_check'
  ) then
    alter table public.notification_events
      add constraint notification_events_status_check
      check (delivery_status in ('pending', 'sent', 'skipped', 'failed'));
  end if;
end $$;

create unique index if not exists notification_events_user_channel_dedupe_idx
  on public.notification_events(user_id, channel, dedupe_key);

create index if not exists notification_events_user_created_idx
  on public.notification_events(user_id, created_at desc);
create index if not exists notification_events_receipt_idx
  on public.notification_events(receipt_id, created_at desc);

alter table public.notification_events enable row level security;

drop policy if exists notification_events_select_own on public.notification_events;
create policy notification_events_select_own on public.notification_events
  for select to authenticated
  using (auth.uid() = user_id);
