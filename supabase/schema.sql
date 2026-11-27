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
-- 9. Extended Profile Columns (Student Settings, Moderation, Single Session)
-- ============================================================================
alter table public.profiles add column if not exists bio text not null default '';
alter table public.profiles add column if not exists specialty text not null default '';
alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.profiles add column if not exists is_muted boolean not null default false;
alter table public.profiles add column if not exists active_session_token text not null default '';

create or replace function public.is_active_member()
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
      and is_active = true
  );
$$;

-- Allow active students to update their own safe profile fields (name, bio, specialty)
-- Role, is_active, and is_muted cannot be escalated by non-admins
drop policy if exists "Users can update own safe profile fields" on public.profiles;
create policy "Users can update own safe profile fields"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
    and is_active = (select p.is_active from public.profiles p where p.id = auth.uid())
    and is_muted = (select p.is_muted from public.profiles p where p.id = auth.uid())
  );

-- ============================================================================
-- 10. Courses & Lessons (Protected Cloudflare R2 Video Delivery)
-- ============================================================================
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (char_length(trim(slug)) between 2 and 120),
  title text not null check (char_length(trim(title)) between 2 and 180),
  description text not null default '',
  thumbnail_url text not null default '',
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courses_sort_order_idx on public.courses (sort_order asc, created_at desc);

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

alter table public.courses enable row level security;

drop policy if exists "Admins can manage courses" on public.courses;
create policy "Admins can manage courses"
  on public.courses
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Active members can read published courses" on public.courses;
create policy "Active members can read published courses"
  on public.courses
  for select
  to authenticated
  using (is_published = true and public.is_active_member());

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  module_title text not null default 'المقدمة',
  title text not null check (char_length(trim(title)) between 2 and 180),
  description text not null default '',
  sort_order integer not null default 0,
  duration_seconds integer not null default 0,
  video_type text not null default 'hls' check (video_type in ('hls', 'mp4')),
  r2_key text not null default '',
  hls_key_hex text not null default '',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists course_lessons_course_idx
  on public.course_lessons (course_id, sort_order asc, created_at asc);

drop trigger if exists course_lessons_set_updated_at on public.course_lessons;
create trigger course_lessons_set_updated_at
  before update on public.course_lessons
  for each row execute function public.set_updated_at();

alter table public.course_lessons enable row level security;

drop policy if exists "Admins can manage lessons" on public.course_lessons;
create policy "Admins can manage lessons"
  on public.course_lessons
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Active members can read published lessons of published courses
-- Note: r2_key & hls_key_hex are NEVER exposed to the browser; only server APIs read them.
drop policy if exists "Active members can read published lessons" on public.course_lessons;
create policy "Active members can read published lessons"
  on public.course_lessons
  for select
  to authenticated
  using (
    is_published = true
    and public.is_active_member()
    and exists (
      select 1 from public.courses c
      where c.id = course_lessons.course_id
        and c.is_published = true
    )
  );

create table if not exists public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  completed boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.lesson_progress enable row level security;

drop policy if exists "Users can manage own lesson progress" on public.lesson_progress;
create policy "Users can manage own lesson progress"
  on public.lesson_progress
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- 11. Discord-Style Community Channels & Realtime Chat
-- ============================================================================
create table if not exists public.chat_channels (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (char_length(trim(slug)) between 2 and 80),
  name text not null check (char_length(trim(name)) between 2 and 80),
  description text not null default '',
  is_readonly boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.chat_channels enable row level security;

drop policy if exists "Admins can manage chat channels" on public.chat_channels;
create policy "Admins can manage chat channels"
  on public.chat_channels
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Active members can read chat channels" on public.chat_channels;
create policy "Active members can read chat channels"
  on public.chat_channels
  for select
  to authenticated
  using (public.is_active_member());

-- Seed default Discord-style community rooms
insert into public.chat_channels (slug, name, description, is_readonly, sort_order)
values
  ('announcements', 'إعلانات وتحديثات', 'آخر تحديثات الأكاديمية والدروس والـ Skills الجديدة من الإدارة.', true, 0),
  ('general', 'شات عام', 'دردشة مفتوحة بين أعضاء مجتمع Tornado Academy وتبادل الخبرات.', false, 1),
  ('help', 'طلبات مساعدة', 'اسأل عن أي مشكلة تقنية أو خطوة في الكورس والمجتمع هيساعدك.', false, 2),
  ('projects', 'تعاون مشاريع', 'اعرض مشروعك، دوّر على شركاء تنفيذ، أو شارك نتائج شغلك.', false, 3)
on conflict (slug) do nothing;

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.chat_channels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default 'عضو',
  author_role text not null default 'user' check (author_role in ('user', 'admin')),
  content text not null check (char_length(trim(content)) between 1 and 4000),
  reply_to_id uuid references public.chat_messages(id) on delete set null,
  reply_preview text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_channel_created_idx
  on public.chat_messages (channel_id, created_at desc);

alter table public.chat_messages enable row level security;

drop policy if exists "Active members can read chat messages" on public.chat_messages;
create policy "Active members can read chat messages"
  on public.chat_messages
  for select
  to authenticated
  using (public.is_active_member());

drop policy if exists "Active non-muted members can post messages" on public.chat_messages;
create policy "Active non-muted members can post messages"
  on public.chat_messages
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.is_active_member()
    and (
      public.is_admin()
      or (
        not exists (
          select 1 from public.profiles p
          where p.id = auth.uid() and p.is_muted = true
        )
        and not exists (
          select 1 from public.chat_channels ch
          where ch.id = channel_id and ch.is_readonly = true
        )
      )
    )
  );

drop policy if exists "Admins or authors can delete chat messages" on public.chat_messages;
create policy "Admins or authors can delete chat messages"
  on public.chat_messages
  for delete
  to authenticated
  using (public.is_admin() or auth.uid() = user_id);

-- Enable Supabase Realtime for live community chat
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;

-- ============================================================================
-- 12. Exclusive Student Vault (Skills & Prompts for Members Only)
-- ============================================================================
create table if not exists public.exclusive_vault_items (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'prompt' check (type in ('prompt', 'skill')),
  category text not null default 'coding' check (category in ('coding', 'video', 'design', 'marketing', 'general')),
  title text not null check (char_length(trim(title)) between 2 and 180),
  tag text not null default '',
  description text not null default '',
  how_to text not null default '',
  file_name text not null default 'skill.md',
  install_cmd text not null default '',
  content text not null default '',
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists exclusive_vault_sort_idx
  on public.exclusive_vault_items (is_featured desc, sort_order asc, created_at desc);

drop trigger if exists exclusive_vault_set_updated_at on public.exclusive_vault_items;
create trigger exclusive_vault_set_updated_at
  before update on public.exclusive_vault_items
  for each row execute function public.set_updated_at();

alter table public.exclusive_vault_items enable row level security;

drop policy if exists "Admins can manage exclusive vault" on public.exclusive_vault_items;
create policy "Admins can manage exclusive vault"
  on public.exclusive_vault_items
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Active members can read exclusive vault" on public.exclusive_vault_items;
create policy "Active members can read exclusive vault"
  on public.exclusive_vault_items
  for select
  to authenticated
  using (public.is_active_member());

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
