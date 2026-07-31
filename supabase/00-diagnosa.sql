-- ============================================================================
-- DIAGNOSA CEPAT — jalankan ini jika import masih gagal
-- ============================================================================
-- Copy seluruh isi file ke Supabase SQL Editor lalu Run.
-- Hasilnya menunjukkan kondisi database Anda saat ini.
-- ============================================================================

-- 1. Constraint role yang sedang aktif.
--    HARUS memuat 'super_admin'. Kalau tidak, jalankan import-students.sql
--    versi terbaru (sudah memperbaiki sendiri) atau schema.sql.
select
  con.conname                     as nama_constraint,
  pg_get_constraintdef(con.oid)   as definisi,
  case
    when pg_get_constraintdef(con.oid) like '%super_admin%' then '✅ OK'
    else '❌ PERLU DIPERBAIKI'
  end                             as status
from pg_constraint con
join pg_class rel      on rel.oid = con.conrelid
join pg_namespace nsp  on nsp.oid = rel.relnamespace
where nsp.nspname = 'public'
  and rel.relname = 'profiles'
  and con.contype = 'c';

-- 2. Isi tabel profiles per peran.
select role, count(*) as jumlah from public.profiles group by role order by role;

-- 3. Akun pengelola yang sudah ada.
select email, full_name, role from public.profiles
where role in ('admin', 'super_admin') order by role;

-- 4. Apakah trigger handle_new_user terpasang?
select tgname as trigger_name,
       case when tgenabled = 'D' then 'DISABLED' else 'ENABLED' end as status
from pg_trigger
where tgrelid = 'auth.users'::regclass and not tgisinternal;

-- 5. Jumlah akun auth vs profil (harus sama).
select
  (select count(*) from auth.users)                          as auth_users,
  (select count(*) from public.profiles)                     as profiles,
  (select count(*) from public.profiles p
     join auth.users u on u.id = p.user_id)                   as tertaut;
