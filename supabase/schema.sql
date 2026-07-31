-- ============================================================================
-- X-5 SMAN 1 Purbalingga — Supabase Schema
-- Jalankan seluruh file ini di Supabase Dashboard → SQL Editor → New Query
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. TABLES
-- ============================================================================

create table if not exists public.profiles (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid unique references auth.users(id) on delete cascade,
  email       text unique not null,
  full_name   text not null,
  nisn        text unique,
  phone       text,
  address     text,
  parent_name text,
  avatar_url  text,
  role        text not null default 'student' check (role in ('student', 'admin', 'super_admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.attendance (
  id         uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  date       date not null default current_date,
  status     text not null check (status in ('present','late','permission','sick','absent')),
  note       text,
  created_at timestamptz not null default now(),
  unique (student_id, date)
);

create table if not exists public.assignments (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  subject     text not null,
  description text,
  deadline    timestamptz not null,
  file_url    text,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.assignment_submissions (
  id            uuid primary key default uuid_generate_v4(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  file_url      text,
  description   text,
  submitted_at  timestamptz not null default now(),
  score         integer check (score between 0 and 100),
  feedback      text,
  unique (assignment_id, student_id)
);

create table if not exists public.grades (
  id         uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  subject    text not null,
  type       text not null check (type in ('daily','midterm','final')),
  score      integer not null check (score between 0 and 100),
  date       date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.materials (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  subject     text not null,
  description text,
  file_url    text,
  file_type   text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.announcements (
  id         uuid primary key default uuid_generate_v4(),
  title      text not null,
  content    text not null,
  is_pinned  boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  category    text not null default 'Kegiatan Kelas',
  media_url   text not null,
  media_type  text not null default 'image' check (media_type in ('image','video')),
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.messages (
  id          uuid primary key default uuid_generate_v4(),
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.schedules (
  id      uuid primary key default uuid_generate_v4(),
  day     text not null check (day in ('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu')),
  time    text not null,
  subject text not null,
  room    text,
  teacher text
);

create table if not exists public.organization (
  id         uuid primary key default uuid_generate_v4(),
  position   text not null,
  student_id uuid references public.profiles(id) on delete set null,
  "order"    integer not null default 0
);

create table if not exists public.events (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  date        date not null,
  color       text not null default '#6366f1',
  description text,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- 1b. MIGRASI  (aman untuk database yang sudah terlanjur dibuat)
-- ============================================================================
-- `create table if not exists` di atas TIDAK mengubah tabel yang sudah ada.
-- Jadi database lama masih memakai constraint role lama (student|admin) dan
-- akan menolak 'super_admin'. Blok ini menyelaraskan skema lama ke skema baru.

do $$
begin
  -- Tambah kolom yang mungkin belum ada pada instalasi lama.
  alter table public.profiles add column if not exists nisn        text;
  alter table public.profiles add column if not exists phone       text;
  alter table public.profiles add column if not exists address     text;
  alter table public.profiles add column if not exists parent_name text;
  alter table public.profiles add column if not exists avatar_url  text;
end $$;

-- Perbarui CHECK constraint role -> izinkan super_admin.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('student', 'admin', 'super_admin'));

-- Tabel events belum ada di versi awal.
create table if not exists public.events (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  date        date not null,
  color       text not null default '#6366f1',
  description text,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

create index if not exists idx_profiles_user     on public.profiles(user_id);
create index if not exists idx_profiles_role     on public.profiles(role);
create index if not exists idx_attendance_student on public.attendance(student_id, date desc);
create index if not exists idx_attendance_date   on public.attendance(date desc);
create index if not exists idx_assign_deadline   on public.assignments(deadline);
create index if not exists idx_subs_assignment   on public.assignment_submissions(assignment_id);
create index if not exists idx_subs_student      on public.assignment_submissions(student_id);
create index if not exists idx_grades_student    on public.grades(student_id, date desc);
create index if not exists idx_materials_subject on public.materials(subject);
create index if not exists idx_gallery_category  on public.gallery(category);
create index if not exists idx_messages_thread   on public.messages(sender_id, receiver_id, created_at desc);
create index if not exists idx_messages_receiver on public.messages(receiver_id, is_read);

-- ============================================================================
-- 3. HELPER FUNCTIONS  (security definer, avoids RLS recursion)
-- ============================================================================

create or replace function public.current_profile_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.profiles where user_id = auth.uid() limit 1;
$$;

-- admin ATAU super_admin
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

-- khusus super_admin
create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and role = 'super_admin');
$$;

-- Auto-create a profile row whenever a user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student')
  )
  on conflict (email) do update set user_id = excluded.user_id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Cegah PRIVILEGE ESCALATION.
-- RLS `with check` tidak bisa membandingkan nilai LAMA vs BARU, sehingga pemilik
-- baris bisa menaikkan role-nya sendiri. Trigger ini menutup celah tersebut:
-- kolom `role` hanya boleh berubah bila pelakunya super admin.
-- ---------------------------------------------------------------------------
create or replace function public.prevent_role_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_super_admin() then
    raise exception 'Hanya Super Admin yang dapat mengubah role akun.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists t_profiles_role_guard on public.profiles;
create trigger t_profiles_role_guard
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- Keep updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists t_profiles_updated on public.profiles;
create trigger t_profiles_updated before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists t_assignments_updated on public.assignments;
create trigger t_assignments_updated before update on public.assignments
  for each row execute function public.touch_updated_at();

drop trigger if exists t_announcements_updated on public.announcements;
create trigger t_announcements_updated before update on public.announcements
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles               enable row level security;
alter table public.attendance             enable row level security;
alter table public.assignments            enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.grades                 enable row level security;
alter table public.materials              enable row level security;
alter table public.announcements          enable row level security;
alter table public.gallery                enable row level security;
alter table public.messages               enable row level security;
alter table public.schedules              enable row level security;
alter table public.organization           enable row level security;
alter table public.events                 enable row level security;

-- ---------- profiles ----------
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);           -- classmates directory

-- Update: pemilik boleh edit profilnya, admin boleh edit data siswa,
-- tetapi hanya super admin yang boleh menyentuh baris ber-role admin.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (
    user_id = auth.uid()
    or public.is_super_admin()
    or (public.is_admin() and role = 'student')
  )
  with check (
    user_id = auth.uid()
    or public.is_super_admin()
    or (public.is_admin() and role = 'student')
  );

-- Membuat akun baru: admin boleh menambah siswa, hanya super admin boleh
-- membuat akun ber-role admin/super_admin.
drop policy if exists "profiles_admin_write" on public.profiles;
create policy "profiles_admin_write" on public.profiles
  for insert to authenticated
  with check (
    public.is_super_admin()
    or (public.is_admin() and role = 'student')
  );

-- Menghapus akun: admin hanya boleh menghapus siswa.
drop policy if exists "profiles_admin_delete" on public.profiles;
create policy "profiles_admin_delete" on public.profiles
  for delete to authenticated
  using (
    public.is_super_admin()
    or (public.is_admin() and role = 'student')
  );

-- ---------- attendance ----------
drop policy if exists "attendance_select" on public.attendance;
create policy "attendance_select" on public.attendance
  for select to authenticated
  using (student_id = public.current_profile_id() or public.is_admin());

drop policy if exists "attendance_insert" on public.attendance;
create policy "attendance_insert" on public.attendance
  for insert to authenticated
  with check (student_id = public.current_profile_id() or public.is_admin());

drop policy if exists "attendance_admin_update" on public.attendance;
create policy "attendance_admin_update" on public.attendance
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "attendance_admin_delete" on public.attendance;
create policy "attendance_admin_delete" on public.attendance
  for delete to authenticated using (public.is_admin());

-- ---------- assignments (read-all, admin-write) ----------
drop policy if exists "assignments_select" on public.assignments;
create policy "assignments_select" on public.assignments for select to authenticated using (true);
drop policy if exists "assignments_admin_all" on public.assignments;
create policy "assignments_admin_all" on public.assignments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- assignment_submissions ----------
drop policy if exists "subs_select" on public.assignment_submissions;
create policy "subs_select" on public.assignment_submissions
  for select to authenticated
  using (student_id = public.current_profile_id() or public.is_admin());

drop policy if exists "subs_insert_own" on public.assignment_submissions;
create policy "subs_insert_own" on public.assignment_submissions
  for insert to authenticated with check (student_id = public.current_profile_id());

drop policy if exists "subs_update" on public.assignment_submissions;
create policy "subs_update" on public.assignment_submissions
  for update to authenticated
  using (student_id = public.current_profile_id() or public.is_admin())
  with check (student_id = public.current_profile_id() or public.is_admin());

drop policy if exists "subs_delete" on public.assignment_submissions;
create policy "subs_delete" on public.assignment_submissions
  for delete to authenticated using (public.is_admin());

-- ---------- grades ----------
drop policy if exists "grades_select" on public.grades;
create policy "grades_select" on public.grades
  for select to authenticated
  using (student_id = public.current_profile_id() or public.is_admin());

drop policy if exists "grades_admin_all" on public.grades;
create policy "grades_admin_all" on public.grades for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- announcements / schedules / organization / events ----------
-- (materials dihapus: fitur Materi ditiadakan)
do $$
declare t text;
begin
  foreach t in array array['announcements','schedules','organization','events']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('create policy %I on public.%I for select to authenticated using (true)', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_all', t
    );
  end loop;
end $$;

-- ---------- gallery (public read for landing page) ----------
drop policy if exists "gallery_public_select" on public.gallery;
create policy "gallery_public_select" on public.gallery for select to anon, authenticated using (true);
drop policy if exists "gallery_admin_all" on public.gallery;
create policy "gallery_admin_all" on public.gallery for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- messages ----------
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages
  for select to authenticated
  using (sender_id = public.current_profile_id() or receiver_id = public.current_profile_id() or public.is_admin());

drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages
  for insert to authenticated
  with check (sender_id = public.current_profile_id() or public.is_admin());

drop policy if exists "messages_update" on public.messages;
create policy "messages_update" on public.messages
  for update to authenticated
  using (receiver_id = public.current_profile_id() or public.is_admin())
  with check (receiver_id = public.current_profile_id() or public.is_admin());

drop policy if exists "messages_delete" on public.messages;
create policy "messages_delete" on public.messages
  for delete to authenticated
  using (sender_id = public.current_profile_id() or public.is_admin());

-- ============================================================================
-- 5. REALTIME
-- ============================================================================

-- Idempotent: lewati tabel yang sudah terdaftar di publication.
do $$
declare t text;
begin
  foreach t in array array['messages', 'announcements', 'attendance']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ============================================================================
-- 6. STORAGE BUCKETS + POLICIES
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('avatars',     'avatars',     true),
  ('assignments', 'assignments', true),
  ('submissions', 'submissions', false),
  ('materials',   'materials',   true),
  ('gallery',     'gallery',     true)
on conflict (id) do nothing;

-- Public read for public buckets
drop policy if exists "public_read" on storage.objects;
create policy "public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('avatars','assignments','materials','gallery'));

-- Authenticated users may upload
drop policy if exists "auth_upload" on storage.objects;
create policy "auth_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('avatars','assignments','submissions','materials','gallery'));

-- Owners (or admin) may update / delete their objects
drop policy if exists "owner_update" on storage.objects;
create policy "owner_update" on storage.objects
  for update to authenticated using (owner = auth.uid() or public.is_admin());

drop policy if exists "owner_delete" on storage.objects;
create policy "owner_delete" on storage.objects
  for delete to authenticated using (owner = auth.uid() or public.is_admin());

-- Private submissions: readable by owner or admin
drop policy if exists "submissions_read" on storage.objects;
create policy "submissions_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'submissions' and (owner = auth.uid() or public.is_admin()));

-- ============================================================================
-- DONE. Next steps:
--   1. Auth → Users → "Add user" untuk admin (mis. admin@x5-sman1.web.id)
--   2. Jalankan: update public.profiles set role = 'admin' where email = 'admin@x5-sman1.web.id';
--   3. Opsional: jalankan supabase/seed.sql untuk data contoh
-- ============================================================================
