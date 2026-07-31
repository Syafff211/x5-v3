'use client'

import Link from 'next/link'
import { toast } from 'sonner'
import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  FileBarChart,
  GraduationCap,
  Images,
  Megaphone,
  UserCog,
  ShieldCheck,
  BookOpen,
  Plus,
  Shield,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/shared/stat-card'
import { useAuthStore } from '@/store/auth-store'
import { isSuperAdmin, ROLE_LABEL } from '@/lib/rbac'
import { useDataStore } from '@/store/data-store'
import { ATTENDANCE_CLASS, ATTENDANCE_LABEL, average, cn, formatDate, initials, relativeTime } from '@/lib/utils'

const BASE_ACTIONS = [
  { label: 'Tambah Siswa', href: '/admin/students', icon: UserPlus, accent: 'from-indigo-500 to-violet-500' },
  { label: 'Input Kehadiran', href: '/admin/attendance', icon: CalendarCheck, accent: 'from-emerald-500 to-teal-500' },
  { label: 'Buat Info PR', href: '/admin/assignments', icon: ClipboardList, accent: 'from-sky-500 to-blue-500' },
  { label: 'Input Nilai', href: '/admin/grades', icon: GraduationCap, accent: 'from-fuchsia-500 to-pink-500' },
  { label: 'Jadwal Pelajaran', href: '/admin/schedule', icon: BookOpen, accent: 'from-cyan-500 to-sky-500' },
  { label: 'Pengumuman', href: '/admin/announcements', icon: Megaphone, accent: 'from-amber-500 to-orange-500' },
  { label: 'Upload Galeri', href: '/admin/gallery', icon: Images, accent: 'from-rose-500 to-red-500' },
]

const SUPER_ACTIONS = [
  { label: 'Kelola Admin', href: '/admin/admins', icon: UserCog, accent: 'from-amber-500 to-rose-600' },
]

function DeniedNotice() {
  const params = useSearchParams()
  useEffect(() => {
    if (params.get('denied') === '1') {
      toast.error('Halaman itu khusus Super Admin.')
      window.history.replaceState({}, '', '/admin')
    }
  }, [params])
  return null
}

export default function AdminDashboard() {
  const profile = useAuthStore((s) => s.profile)
  const superAdmin = isSuperAdmin(profile?.role)
  const QUICK_ACTIONS = superAdmin ? [...BASE_ACTIONS, ...SUPER_ACTIONS] : BASE_ACTIONS
  const { students, attendance, assignments, grades, submissions, announcements } = useDataStore()

  const studentList = students.filter((s) => s.role === 'student')
  const today = new Date().toISOString().slice(0, 10)
  const todayAttendance = attendance.filter((a) => a.date === today)
  const presentToday = todayAttendance.filter((a) => a.status === 'present').length
  const activeAssignments = assignments.filter((a) => new Date(a.deadline).getTime() > Date.now())
  const avgScore = average(grades.map((g) => g.score))
  const ungraded = submissions.filter((s) => s.score == null)

  const recentSubs = [...submissions].sort((a, b) => +new Date(b.submitted_at) - +new Date(a.submitted_at)).slice(0, 5)
  const studentName = (id: string) => students.find((s) => s.id === id)?.full_name ?? 'Siswa'
  const studentAvatar = (id: string) => students.find((s) => s.id === id)?.avatar_url ?? null
  const assignmentTitle = (id: string) => assignments.find((a) => a.id === id)?.title ?? 'Tugas'

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <DeniedNotice />
      </Suspense>
      {/* Banner */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-purple-600 to-indigo-600 p-6 text-white shadow-xl shadow-rose-500/20 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <Badge className="mb-3 border-white/25 bg-white/15 text-white backdrop-blur">
            {superAdmin ? <ShieldCheck className="mr-1 h-3 w-3" /> : <Shield className="mr-1 h-3 w-3" />}
            {superAdmin ? 'Super Admin Panel' : 'Admin Panel'}
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Halo, {profile?.full_name?.split(',')[0] ?? 'Admin'} 👋</h1>
          <p className="mt-2 text-sm text-white/85">
            {ungraded.length > 0
              ? `Ada ${ungraded.length} pengumpulan PR yang menunggu penilaian.`
              : 'Semua PR sudah dinilai. Panel kelas dalam kondisi baik.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild size="sm" className="bg-white text-rose-600 hover:bg-white/90">
              <Link href="/admin/attendance"><CalendarCheck className="h-4 w-4" /> Input Kehadiran</Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="border border-white/30 text-white hover:bg-white/15">
              <Link href="/admin/reports"><FileBarChart className="h-4 w-4" /> Buat Laporan</Link>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Siswa" value={studentList.length} icon={Users} accent="indigo" trend="Kelas X-5" />
        <StatCard
          label="Kehadiran Hari Ini"
          value={presentToday}
          icon={CalendarCheck}
          accent="emerald"
          trend={`dari ${studentList.length} siswa`}
        />
        <StatCard label="PR Aktif" value={activeAssignments.length} icon={ClipboardList} accent="sky" trend={`${ungraded.length} perlu dinilai`} />
        <StatCard label="Rata-rata Nilai" value={avgScore} icon={TrendingUp} accent="fuchsia" trend={`${grades.length} nilai tercatat`} />
      </div>

      {/* Quick actions */}
      <Card glass>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-primary" /> Aksi Cepat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {QUICK_ACTIONS.map((q, i) => (
              <motion.div key={q.href} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link
                  href={q.href}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card/40 p-4 text-center transition-all hover:-translate-y-1 hover:border-primary/40"
                >
                  <div className={cn('grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform group-hover:scale-110', q.accent)}>
                    <q.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium">{q.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent submissions */}
        <Card glass className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Pengumpulan Terbaru</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/assignments">Semua <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentSubs.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Belum ada pengumpulan.</p>}
            {recentSubs.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-3">
                <Avatar className="h-9 w-9 shrink-0">
                  {studentAvatar(s.student_id) && <AvatarImage src={studentAvatar(s.student_id)!} alt="" />}
                  <AvatarFallback className="text-[10px]">{initials(studentName(s.student_id))}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{studentName(s.student_id)}</p>
                  <p className="truncate text-xs text-muted-foreground">{assignmentTitle(s.assignment_id)}</p>
                </div>
                <div className="shrink-0 text-right">
                  {s.score != null ? <Badge variant="success">{s.score}</Badge> : <Badge variant="warning">Belum dinilai</Badge>}
                  <p className="mt-1 text-[10px] text-muted-foreground">{relativeTime(s.submitted_at)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Today attendance */}
        <Card glass>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Kehadiran Hari Ini</CardTitle>
            <Badge variant="outline">{formatDate(new Date())}</Badge>
          </CardHeader>
          <CardContent>
            {todayAttendance.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground">Belum ada absensi hari ini.</p>
                <Button asChild size="sm" variant="gradient" className="mt-3">
                  <Link href="/admin/attendance">Input Sekarang</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {(['present', 'late', 'permission', 'sick', 'absent'] as const).map((st) => {
                  const count = todayAttendance.filter((a) => a.status === st).length
                  return (
                    <div key={st} className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 px-3 py-2.5">
                      <Badge variant="outline" className={cn('border', ATTENDANCE_CLASS[st])}>{ATTENDANCE_LABEL[st]}</Badge>
                      <span className="text-sm font-semibold tabular-nums">{count} siswa</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Latest announcements */}
      <Card glass>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Pengumuman Terbaru</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/announcements">Kelola <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {announcements.slice(0, 3).map((a) => (
            <div key={a.id} className="rounded-xl border border-border/60 bg-card/40 p-4">
              <p className="truncate text-sm font-semibold">{a.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.content}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">{relativeTime(a.created_at)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
