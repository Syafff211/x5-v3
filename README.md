# 🎓 X-5 SMAN 1 Purbalingga — Platform Kelas Digital

Platform kelas modern berbasis **Next.js 14 + Supabase**: kehadiran, tugas, nilai, materi,
galeri, pengumuman, dan chat real-time — dalam satu aplikasi yang cepat, aman, dan installable (PWA).

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8)

---

## ⚡ Mulai Cepat

```bash
npm install
npm run dev          # http://localhost:3000
```

Tanpa konfigurasi apa pun aplikasi langsung jalan dalam **Mode Demo**
(data tersimpan di browser). Untuk backend sungguhan, ikuti
**[SETUP-SUPABASE.md](./SETUP-SUPABASE.md)**.

### Akun default

| Peran | Halaman Login | Email | Password |
|---|---|---|---|
| Siswa | `/auth/login` | `alisha@x5-sman1.web.id` *(atau nama depan siswa lain)* | `ganesha123` |
| Admin | `/auth/admin` | `admin@x5-sman1.web.id` | `ganesha123` |
| Super Admin | `/auth/s/admin` | `superadmin@x5-sman1.web.id` | `ganesha123` |

---

## 🧱 Tech Stack

| Lapisan | Teknologi |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui + Glassmorphism |
| Animasi | Framer Motion |
| State | Zustand (auth, data, theme, landing) |
| Backend | Supabase — Auth, Postgres, Storage, Realtime |
| Ikon | Lucide React |
| Export | SheetJS (Excel) + print-to-PDF |
| Deploy | Vercel |

---

## ✨ Fitur

### 🌐 Landing Page
Hero animasi (particles + gradient orbs), grid fitur, statistik animasi, footer — semuanya
dapat diedit lewat **Admin → Landing CMS** tanpa menyentuh kode.

### 👨‍🎓 Dashboard Siswa (11 halaman)
Dashboard · Kehadiran · **Info PR** · Nilai · Pengumuman · Galeri · Messages · Teman · **Jadwal Pelajaran** · Profil · Pengaturan

- Absensi mandiri (Hadir/Terlambat/Izin/Sakit/Alpa) + riwayat
- Pengumpulan tugas dengan upload file & validasi
- Nilai berkode warna (≥85 hijau · ≥70 kuning · <70 merah) + rata-rata per mapel
- Galeri dengan lightbox (navigasi keyboard)
- **Chat real-time** — typing indicator, read receipts, presence

### 🛡️ Panel Admin — dua tingkat akses

**Admin** (sekretaris / ketua kelas) — operasional harian:
Dashboard · Kelola Siswa · Kehadiran · Info PR · Nilai · Galeri · Pengumuman · Jadwal Pelajaran · Kalender · Organisasi · Messages · Laporan · Pengaturan

**Super Admin** — semua di atas **+** kendali penuh:
Manajemen Admin (CRUD akun admin) · Landing CMS · Theme & CSS · Database

- CRUD penuh + **import/export Excel** (siswa & nilai)
- Input kehadiran massal & laporan per rentang tanggal
- Penilaian tugas + feedback
- Struktur organisasi **drag & drop**
- Kustomisasi tema (color picker + editor CSS live)
- Penampil database + backup/restore JSON
- Generator laporan → **Excel / PDF**

### 📱 PWA
Service worker (offline-first), web manifest, install prompt, push notification-ready.

---

## 🔐 Keamanan

- **Row Level Security** di semua tabel — siswa hanya bisa melihat datanya sendiri
- **RBAC tiga peran**: `student` · `admin` · `super_admin`
- Proteksi rute berlapis: middleware server + `AuthGuard` klien + filter menu
- Trigger `prevent_role_escalation` mencegah user menaikkan role-nya sendiri
- Admin biasa tidak bisa membuat/menghapus akun admin (ditegakkan di RLS, bukan hanya UI)
- Sanitasi input, validasi upload (tipe & ukuran maks 10 MB)
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, dll.)

> Diverifikasi dengan uji RLS nyata di PostgreSQL: siswa hanya melihat 1 dari 36 baris nilai,
> admin melihat semuanya, anon melihat 0, penulisan lintas-siswa **ditolak policy**,
> admin biasa **gagal** membuat akun admin, dan siswa **gagal** menaikkan dirinya jadi super admin.

---

## ♿ Aksesibilitas & Performa

- Target **WCAG 2.1 AA** — ARIA label, navigasi keyboard, focus ring, skip-link
- Menghormati `prefers-reduced-motion`
- Build statis 38 rute · First Load JS **±87 kB** shared

---

## 📁 Struktur Project

```
src/
├── app/
│   ├── page.tsx              # Landing
│   ├── auth/                 # login siswa, admin, s/admin (super), forgot & reset
│   ├── dashboard/            # 11 halaman siswa
│   └── admin/                # panel admin + super admin
├── components/
│   ├── ui/                   # primitives shadcn/ui
│   ├── layout/               # sidebar, auth guard
│   ├── shared/               # StatCard, ChatBubble, PWA prompt, dll.
│   └── landing/
├── lib/                      # supabase clients, rbac, utils, export
├── store/                    # zustand: auth, data, theme, landing
└── types/
supabase/
├── schema.sql                # tabel, RLS, storage, realtime
└── import-students.sql       # 36 siswa + admin
```

---

## 📜 Perintah

```bash
npm run dev        # server pengembangan
npm run build      # build produksi
npm run start      # jalankan hasil build
npm run lint       # ESLint
npm run typecheck  # TypeScript
```

---

## 🚀 Deploy ke Vercel

1. Push project ke GitHub
2. Import repo di [vercel.com](https://vercel.com)
3. Tambahkan environment variables (lihat SETUP-SUPABASE.md)
4. Deploy 🎉

---

<div align="center">

Dibuat dengan ❤️ untuk **Kelas X-5 SMAN 1 Purbalingga**

</div>
