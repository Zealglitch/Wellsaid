-- ============================================================================
-- WellSaid: Real Paywall Security Schema for Supabase (PostgreSQL + RLS)
-- ============================================================================
-- Run this entire script ONCE in your Supabase Dashboard -> SQL Editor.
-- ============================================================================

-- 1. User Profiles & Pro Entitlements (linked 1-to-1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  is_pro boolean not null default false,
  license_key text,
  license_instance_id text,
  pro_activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Pre-paid emails (populated automatically by the Dodo Payments webhook
--    when a customer pays BEFORE creating their account)
create table if not exists public.paid_emails (
  email text primary key,
  payment_id text,
  license_key text,
  paid_at timestamptz not null default now()
);

-- 3. Internal / Manual License Keys (for giveaways, support, or reviewer keys)
create table if not exists public.licenses (
  key text primary key,
  is_active boolean not null default true,
  max_uses integer not null default 1,
  uses integer not null default 0,
  note text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - REAL PAYWALL ENFORCEMENT
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.paid_emails enable row level security;
alter table public.licenses enable row level security;

-- Drop existing policies if re-running script
drop policy if exists "Users can view their own profile" on public.profiles;

-- Users can ONLY read their own profile.
-- INSERT, UPDATE, and DELETE are intentionally DENIED for browser clients so
-- nobody can set is_pro = true from DevTools or the Supabase JS client.
-- Only the server (Service Role key) or SECURITY DEFINER triggers/functions can modify entitlements.
create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- ZERO client policies on paid_emails and licenses:
-- Browser clients cannot read, insert, update, or delete them at all.

-- ============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON SIGN UP
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paid record;
  v_email text;
begin
  v_email := lower(coalesce(new.email, ''));

  -- Check if this email already completed a verified Dodo payment
  select * into v_paid
  from public.paid_emails
  where lower(email) = v_email
  limit 1;

  insert into public.profiles (id, email, is_pro, license_key, pro_activated_at)
  values (
    new.id,
    v_email,
    found,
    case when found then v_paid.license_key else null end,
    case when found then v_paid.paid_at else null end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- SECURE RPC FOR REDEEMING INTERNAL LICENSE KEYS (e.g. Dodo Reviewer Keys)
-- ============================================================================
create or replace function public.redeem_internal_license(p_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_lic record;
  v_clean_key text := upper(trim(coalesce(p_key, '')));
begin
  if v_uid is null then
    return jsonb_build_object('valid', false, 'error', 'Authentication required.');
  end if;

  if v_clean_key = '' then
    return jsonb_build_object('valid', false, 'error', 'License key is required.');
  end if;

  select * into v_lic
  from public.licenses
  where upper(key) = v_clean_key
    and is_active = true
    and uses < max_uses
  for update;

  if not found then
    return jsonb_build_object('valid', false, 'error', 'Invalid or already used license key.');
  end if;

  update public.licenses
  set uses = uses + 1
  where key = v_lic.key;

  update public.profiles
  set
    is_pro = true,
    license_key = v_lic.key,
    pro_activated_at = now(),
    updated_at = now()
  where id = v_uid;

  return jsonb_build_object('valid', true, 'license_key', v_lic.key);
end;
$$;

grant execute on function public.redeem_internal_license(text) to authenticated;

-- ============================================================================
-- OPTIONAL: GRANT PRO TO A DEMO ACCOUNT FOR DODO PAYMENTS REVIEW
-- ============================================================================
-- 1. In Supabase Dashboard -> Authentication -> Users -> "Add user" -> "Create new user"
--    Email: demo@wellsaid.app   Password: <choose a strong password>   Auto Confirm User: ON
-- 2. Then run this query to upgrade that demo account to Pro:
--
--    update public.profiles
--    set is_pro = true, pro_activated_at = now()
--    where lower(email) = 'demo@wellsaid.app';
--
-- ============================================================================
