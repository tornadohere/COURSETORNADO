-- ============================================================================
-- Tornado Academy — Supabase Database Schema (Admin Role + Waitlist)
-- ============================================================================
-- Run this entire script in your Supabase Dashboard -> SQL Editor.
-- Admin credentials are NEVER stored in code or environment variables;
-- authentication uses Supabase Auth (auth.users) + role = 'admin' in public.profiles.
-- ============================================================================

-- 1. Extensions
create extension if not exists pgcrypto;

-- 2. Profiles table (stores user role in the database)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null default '',
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

-- 3. Automatic updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 4. Automatically create a profile row when a new Auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'user'
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any existing auth.users that were created before running this script
insert into public.profiles (id, email, full_name, role)
select
  u.id,
  lower(coalesce(u.email, '')),
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  'user'
from auth.users u
on conflict (id) do nothing;

-- 5. Security-definer helper to check if the current authenticated user is an admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- 6. RLS for public.profiles
alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.is_admin());

-- Prevent non-admin users from modifying roles directly from client APIs
drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
  on public.profiles
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 7. Waitlist entries table
create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  phone text not null check (char_length(trim(phone)) between 4 and 40),
  status text not null default 'new' check (status in ('new', 'contacted', 'enrolled', 'archived')),
  notes text not null default '',
  source text not null default 'landing',
  launch_date date not null default '2026-12-01',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists waitlist_entries_created_at_idx
  on public.waitlist_entries (created_at desc);

create index if not exists waitlist_entries_status_idx
  on public.waitlist_entries (status);

create index if not exists waitlist_entries_phone_idx
  on public.waitlist_entries (phone);

drop trigger if exists waitlist_entries_set_updated_at on public.waitlist_entries;
create trigger waitlist_entries_set_updated_at
  before update on public.waitlist_entries
  for each row execute function public.set_updated_at();

-- 8. RLS for public.waitlist_entries
alter table public.waitlist_entries enable row level security;

-- Public landing page visitors can submit to the waitlist (INSERT only)
drop policy if exists "Anyone can join the waitlist" on public.waitlist_entries;
create policy "Anyone can join the waitlist"
  on public.waitlist_entries
  for insert
  to anon, authenticated
  with check (
    status = 'new'
    and char_length(trim(name)) > 0
    and char_length(trim(phone)) > 0
  );

-- Only database admins (profiles.role = 'admin') can read, update, or delete waitlist rows
drop policy if exists "Admins can read waitlist" on public.waitlist_entries;
create policy "Admins can read waitlist"
  on public.waitlist_entries
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update waitlist" on public.waitlist_entries;
create policy "Admins can update waitlist"
  on public.waitlist_entries
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete waitlist" on public.waitlist_entries;
create policy "Admins can delete waitlist"
  on public.waitlist_entries
  for delete
  to authenticated
  using (public.is_admin());

-- ============================================================================
-- HOW TO CREATE YOUR ADMIN ACCOUNT (NO PASSWORDS IN CODE OR .ENV)
-- ============================================================================
-- Step 1: In Supabase Dashboard -> Authentication -> Users -> "Add user" -> "Create new user"
--         Enter your admin email + strong password (check "Auto Confirm User").
--
-- Step 2: Run this SQL command (replacing with your admin email) to assign role = 'admin':
--
--   update public.profiles
--   set role = 'admin'
--   where email = 'your-admin@domain.com';
--
-- ============================================================================
