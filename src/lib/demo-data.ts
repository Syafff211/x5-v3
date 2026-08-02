import type {
  Announcement,
  Assignment,
  Attendance,
  CalendarEvent,
  GalleryItem,
  LandingContent,
  Message,
  OrganizationMember,
  Profile,
  Schedule,
} from '@/types/database'

/**
 * ---------------------------------------------------------------------------
 * DATA AWAL APLIKASI — BERSIH
 * ---------------------------------------------------------------------------
 * Hanya berisi daftar siswa asli kelas X-5 dan jadwal pelajaran.
 * Seluruh data transaksional (kehadiran, PR, pengumuman,
 * galeri, pesan) sengaja DIKOSONGKAN agar aplikasi dimulai dari nol.
 *
 * Nilai-nilai di sini dipakai saat mode demo (Supabase belum dikonfigurasi).
 * Setelah env Supabase diisi + `supabase/import-students.sql` dijalankan,
 * seluruh data diambil langsung dari database.
 * ---------------------------------------------------------------------------
 */

const iso = (d: Date) => d.toISOString()
const now = () => iso(new Date())

export const SUBJECTS = [
  'Matematika',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Fisika',
  'Kimia',
  'Biologi',
  'Sejarah',
  'PPKn',
  'Informatika',
  'PJOK',
  'Seni Budaya',
  'Pendidikan Agama',
]

/** Daftar resmi siswa kelas X-5 SMAN 1 Purbalingga (36 siswa). */
const ROSTER: { name: string; email: string; nisn: string }[] = [
  { name: 'Alisha Azaria Harviyani', email: 'alisha@x5-sman1.web.id', nisn: '0093145083' },
  { name: 'Anindya Putri Palupi', email: 'anindya@x5-sman1.web.id', nisn: '0093145096' },
  { name: 'Ardian Yusuf Firdaus', email: 'ardian@x5-sman1.web.id', nisn: '0093145109' },
  { name: 'Auryn Nila Oktaviani', email: 'auryn@x5-sman1.web.id', nisn: '0093145122' },
  { name: 'Ayesha Safarrina Triono', email: 'ayesha@x5-sman1.web.id', nisn: '0093145135' },
  { name: 'Cahyaningtyas Ridho P', email: 'cahyaningtyas@x5-sman1.web.id', nisn: '0093145148' },
  { name: 'Callista Keisya Nathania', email: 'callista@x5-sman1.web.id', nisn: '0093145161' },
  { name: 'Defan Dwi Valdian', email: 'defan@x5-sman1.web.id', nisn: '0093145174' },
  { name: 'Erlangga Dwi Revanda', email: 'erlangga@x5-sman1.web.id', nisn: '0093145187' },
  { name: 'Faidah Qurrota Aini', email: 'faidah@x5-sman1.web.id', nisn: '0093145200' },
  { name: 'Farah Noviana', email: 'farah@x5-sman1.web.id', nisn: '0093145213' },
  { name: 'Hafidz Fadillah', email: 'hafidz@x5-sman1.web.id', nisn: '0093145226' },
  { name: 'Halwa Qasdina Zalmya', email: 'halwa@x5-sman1.web.id', nisn: '0093145239' },
  { name: 'Hanyfa Trias Maharani', email: 'hanyfa@x5-sman1.web.id', nisn: '0093145252' },
  { name: 'Harjuna Ilham Kesatria Utomo', email: 'harjuna@x5-sman1.web.id', nisn: '0093145265' },
  { name: 'Humam Asyrafi Zada', email: 'humam@x5-sman1.web.id', nisn: '0093145278' },
  { name: 'Khalisha Rizqina Salsabila', email: 'khalisha@x5-sman1.web.id', nisn: '0093145291' },
  { name: 'Maheswari Wangi Azyyati Ramadhani', email: 'maheswari@x5-sman1.web.id', nisn: '0093145304' },
  { name: 'Marhaeni', email: 'marhaeni@x5-sman1.web.id', nisn: '0093145317' },
  { name: 'Medina Rahma', email: 'medina@x5-sman1.web.id', nisn: '0093145330' },
  { name: 'Muh Bani Safi', email: 'muh@x5-sman1.web.id', nisn: '0093145343' },
  { name: 'Muhammad Alva Pratama', email: 'muhammad.alva@x5-sman1.web.id', nisn: '0093145356' },
  { name: 'Muhammad Syafiq', email: 'muhammad.syafiq@x5-sman1.web.id', nisn: '0093145369' },
  { name: 'Nabil Pratama', email: 'nabil@x5-sman1.web.id', nisn: '0093145382' },
  { name: 'Natalia Aprilia Rahmawati', email: 'natalia@x5-sman1.web.id', nisn: '0093145395' },
  { name: 'Nizrina Wafaa Darma', email: 'nizrina@x5-sman1.web.id', nisn: '0093145408' },
  { name: 'Panji Pamungkas', email: 'panji@x5-sman1.web.id', nisn: '0093145421' },
  { name: 'Ringgo Prasetyo', email: 'ringgo@x5-sman1.web.id', nisn: '0093145434' },
  { name: 'Safitri Kurnia Sari', email: 'safitri@x5-sman1.web.id', nisn: '0093145447' },
  { name: 'Syafa Putri Nabila', email: 'syafa@x5-sman1.web.id', nisn: '0093145460' },
  { name: 'Timur Damar Langga', email: 'timur@x5-sman1.web.id', nisn: '0093145473' },
  { name: 'Ufairah Hana Sakhi', email: 'ufairah@x5-sman1.web.id', nisn: '0093145486' },
  { name: 'Yogi Febrian', email: 'yogi@x5-sman1.web.id', nisn: '0093145499' },
  { name: 'Yulita Nur Andini', email: 'yulita@x5-sman1.web.id', nisn: '0093145512' },
  { name: 'Zahra Anggraeny', email: 'zahra.anggraeny@x5-sman1.web.id', nisn: '0093145525' },
  { name: 'Zahra Dewi Adha', email: 'zahra.dewi@x5-sman1.web.id', nisn: '0093145538' },
]

export const avatarFor = (seed: string) =>
  `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundColor=6366f1,8b5cf6,d946ef&backgroundType=gradientLinear`

export const DEMO_STUDENTS: Profile[] = ROSTER.map((s, i) => ({
  id: `student-${String(i + 1).padStart(2, '0')}`,
  user_id: null,
  email: s.email,
  full_name: s.name,
  nisn: s.nisn,
  phone: null,
  address: null,
  parent_name: null,
  avatar_url: avatarFor(s.name),
  role: 'student' as const,
  created_at: now(),
  updated_at: now(),
}))

/** Super Admin — kendali penuh, termasuk mengelola akun admin lain. */
export const DEMO_SUPER_ADMIN: Profile = {
  id: 'sadmin-01',
  user_id: null,
  email: 'superadmin@x5-sman1.web.id',
  full_name: 'Wali Kelas X-5',
  nisn: null,
  phone: null,
  address: null,
  parent_name: null,
  avatar_url: avatarFor('Super Admin X-5'),
  role: 'super_admin',
  created_at: now(),
  updated_at: now(),
}

/** Admin operasional — sekretaris / ketua kelas. */
export const DEMO_ADMIN: Profile = {
  id: 'admin-01',
  user_id: null,
  email: 'admin@x5-sman1.web.id',
  full_name: 'Sekretaris Kelas X-5',
  nisn: null,
  phone: null,
  address: null,
  parent_name: null,
  avatar_url: avatarFor('Sekretaris X-5'),
  role: 'admin',
  created_at: now(),
  updated_at: now(),
}

/** Daftar akun admin yang dikelola Super Admin (mode demo). */
export const DEMO_ADMIN_ACCOUNTS: Profile[] = [DEMO_SUPER_ADMIN, DEMO_ADMIN]

/** Siswa yang dipakai saat login demo. */
export const DEMO_CURRENT_STUDENT = DEMO_STUDENTS[0]

export const DEMO_PROFILES: Profile[] = [...DEMO_STUDENTS, DEMO_ADMIN, DEMO_SUPER_ADMIN]

// ---------------------------------------------------------------------------
// DATA TRANSAKSIONAL — KOSONG (aplikasi dimulai bersih)
// ---------------------------------------------------------------------------

export const DEMO_ATTENDANCE: Attendance[] = []
export const DEMO_ASSIGNMENTS: Assignment[] = []
export const DEMO_ANNOUNCEMENTS: Announcement[] = []
export const DEMO_GALLERY: GalleryItem[] = []
export const DEMO_MESSAGES: Message[] = []
/** Pengurus kelas — dapat diubah kapan saja lewat Admin → Organisasi. */
export const DEMO_ORGANIZATION: OrganizationMember[] = [
  { position: 'Ketua Kelas',   idx: 2  },
  { position: 'Wakil Ketua',   idx: 14 },
  { position: 'Sekretaris',    idx: 0  },
  { position: 'Bendahara',     idx: 10 },
  { position: 'Seksi Kebersihan', idx: 26 },
  { position: 'Seksi Keamanan',   idx: 30 },
].map((o, i) => {
  const st = DEMO_STUDENTS[o.idx]
  return {
    id: `org-${String(i + 1).padStart(2, '0')}`,
    position: o.position,
    student_id: st.id,
    order: i + 1,
    profiles: { id: st.id, full_name: st.full_name, avatar_url: st.avatar_url, nisn: st.nisn },
  }
})
export const DEMO_EVENTS: CalendarEvent[] = []

export const GALLERY_CATEGORIES = [
  'Semua',
  'Kegiatan Kelas',
  'Study Tour',
  'Olahraga',
  'Prestasi',
  'Class Meeting',
]

/** Jadwal pelajaran — struktur kelas, dapat diubah admin kapan saja. */
export const DEMO_SCHEDULE: Schedule[] = [
  { id: 'sch-01', day: 'Senin', time: '07.00 - 08.30', subject: 'Upacara & PPKn', room: 'Lapangan / X-5', teacher: '-' },
  { id: 'sch-02', day: 'Senin', time: '08.30 - 10.00', subject: 'Matematika', room: 'X-5', teacher: '-' },
  { id: 'sch-03', day: 'Senin', time: '10.15 - 11.45', subject: 'Bahasa Indonesia', room: 'X-5', teacher: '-' },
  { id: 'sch-04', day: 'Selasa', time: '07.00 - 08.30', subject: 'Fisika', room: 'Lab Fisika', teacher: '-' },
  { id: 'sch-05', day: 'Selasa', time: '08.30 - 10.00', subject: 'Kimia', room: 'Lab Kimia', teacher: '-' },
  { id: 'sch-06', day: 'Selasa', time: '10.15 - 11.45', subject: 'Bahasa Inggris', room: 'X-5', teacher: '-' },
  { id: 'sch-07', day: 'Rabu', time: '07.00 - 08.30', subject: 'Biologi', room: 'Lab Biologi', teacher: '-' },
  { id: 'sch-08', day: 'Rabu', time: '08.30 - 10.00', subject: 'Informatika', room: 'Lab Komputer', teacher: '-' },
  { id: 'sch-09', day: 'Rabu', time: '10.15 - 11.45', subject: 'Sejarah', room: 'X-5', teacher: '-' },
  { id: 'sch-10', day: 'Kamis', time: '07.00 - 08.30', subject: 'Matematika', room: 'X-5', teacher: '-' },
  { id: 'sch-11', day: 'Kamis', time: '08.30 - 10.00', subject: 'PJOK', room: 'Lapangan', teacher: '-' },
  { id: 'sch-12', day: 'Kamis', time: '10.15 - 11.45', subject: 'Seni Budaya', room: 'Ruang Seni', teacher: '-' },
  { id: 'sch-13', day: 'Jumat', time: '06.30 - 07.00', subject: 'Jumat Bersih', room: 'Area Kelas', teacher: '-' },
  { id: 'sch-14', day: 'Jumat', time: '07.00 - 08.30', subject: 'Bahasa Indonesia', room: 'X-5', teacher: '-' },
  { id: 'sch-15', day: 'Jumat', time: '08.30 - 10.00', subject: 'Bahasa Inggris', room: 'X-5', teacher: '-' },
]

export const DEFAULT_LANDING: LandingContent = {
  hero_badge: 'Tahun Ajaran 2025/2026',
  hero_title: 'X-5 SMAN 1 Purbalingga',
  hero_subtitle:
    'Satu tempat untuk semua kebutuhan kelas — catat kehadiran, pantau PR, lihat jadwal, dan tetap terhubung dengan teman sekelas.',
  cta_primary: 'Masuk sebagai Siswa',
  cta_secondary: 'Masuk sebagai Admin',
  stats: [
    { label: 'Siswa Aktif', value: DEMO_STUDENTS.length, suffix: '' },
    { label: 'Mata Pelajaran', value: SUBJECTS.length, suffix: '' },
    { label: 'Hari Belajar', value: 5, suffix: '' },
    { label: 'Bisa Diakses', value: 24, suffix: '/7' },
  ],
  features: [
    {
      icon: 'CalendarCheck',
      title: 'Kehadiran',
      description: 'Isi absensi sendiri setiap pagi. Rekap dan persentase kehadiranmu terhitung otomatis.',
    },
    {
      icon: 'ClipboardList',
      title: 'Info PR',
      description: 'Semua PR beserta tenggatnya di satu daftar. Unggah jawaban langsung, tak ada lagi yang terlewat.',
    },
    {
      icon: 'CalendarDays',
      title: 'Jadwal Pelajaran',
      description: 'Jadwal mingguan lengkap dengan jam, ruang, dan guru pengampu.',
    },
    {
      icon: 'MessageSquare',
      title: 'Obrolan Kelas',
      description: 'Berkirim pesan dengan teman sekelas secara langsung, lengkap dengan tanda dibaca.',
    },
    {
      icon: 'Images',
      title: 'Galeri',
      description: 'Kumpulan foto kegiatan kelas, dari praktikum hingga class meeting, tersimpan rapi.',
    },
    {
      icon: 'Megaphone',
      title: 'Pengumuman',
      description: 'Informasi penting dari wali kelas langsung sampai, yang mendesak ditandai khusus.',
    },
  ],
  footer_text:
    'Dibuat oleh siswa X-5 SMAN 1 Purbalingga, untuk memudahkan hari-hari belajar kami.',
}
