-- ============================================================================
-- FIX CEPAT — jalankan INI SAJA lebih dulu, lalu ulangi import-students.sql
-- ============================================================================
-- Copy 4 baris di bawah ke Supabase SQL Editor -> Run.
-- Ini memperbaiki constraint yang menolak 'super_admin'.
-- ============================================================================

alter table public.profiles drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('student', 'admin', 'super_admin'));

-- Verifikasi: hasilnya harus memuat super_admin
select pg_get_constraintdef(oid) as constraint_sekarang
from pg_constraint
where conname = 'profiles_role_check';
