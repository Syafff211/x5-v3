'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarDays,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  Megaphone,
  MessageSquare,
  Pin,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/shared/stat-card'
import { useAuthStore } from '@/store/auth-store'
import { useDataStore } from '@/store/data-store'
import { ATTENDANCE_CLASS, ATTENDANCE_LABEL, average, cn, deadlineInfo, formatDate, relativeTime } from '@/lib/utils'

const QUICK_LINKS = [
  { label: 'Isi Kehadiran', href: '/dashboard/attendance', icon: CalendarCheck, accent: 'from-emerald-500 to-teal-500' },
  { label: 'Info PR', href: '/dashboard/assignments', icon: ClipboardList, accent: 'from-indigo-500 to-violet-500' },
  { label: 'Jadwal Pelajaran', href: '/dashboard/schedule', icon: CalendarDays, accent: 'from-sky-500 to-blue-500' },
  { label: 'Chat Kelas', href: '/dashboard/messages', icon: MessageSquare, accent: 'from-fuchsia-500 to-pink-500' },
]

export default function DashboardPage() {
  const profile = useAuthStore((s) => s.profile)
  const { attendance, assignments, grades, announcements, submissions, students } = useDataStore()

  const myAttendance = attendance.filter((a) => a.student_id === profile?.id)
  const presentCount = myAttendance.filter((a) => a.status === 'present').length
  const attendanceRate = myAttendance.length ? Math.round((presentCount / myAttendance.length) * 100) : 0

  const activeAssignments = assignments.filter((a) => new Date(a.deadline).getTime() > Date.now())
  const submittedIds = new Set(submissions.filter((s) => s.student_id === profile?.id).map((s) => s.assignment_id))
  const pending = activeAssignments.filter((a) => !submittedIds.has(a.id))

  const myGrades = grades.filter((g) => g.student_id === profile?.id)
  const avgScore = average(myGrades.map((g) => g.score))

  // Peringkat dihitung nyata dari rata-rata nilai seluruh siswa.
  const totalStudents = students.filter((s) => s.role === 'student').length
  const rank = (() => {
    if (!myGrades.length) return null
    const avgByStudent = new Map<string, number[]>()
    grades.forEach((g) => {
      const arr = avgByStudent.get(g.student_id) ?? []
      arr.push(g.score)
      avgByStudent.set(g.student_id, arr)
    })
    const ranked = Array.from(avgByStudent.entries())
      .map(([id, list]) => ({ id, avg: list.reduce((x: number, y: number) => x + y, 0) / list.length }))
      .sort((a, b) => b.avg - a.avg)
    const idx = ranked.findIndex((r) => r.id === profile?.id)
    return idx >= 0 ? idx + 1 : null
  })()

  const pinned = announcements.filter((a) => a.is_pinned).slice(0, 2)
  const upcoming = [...activeAssignments].sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline)).slice(0, 4)
  const recentAttendance = [...myAttendance].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 5)

  const hour = new Date().getHours()
  const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Siswa'

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl brand-gradient p-6 text-white shadow-xl shadow-primary/20 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <Badge className="mb-3 border-white/25 bg-white/15 text-white backdrop-blur">
            <Sparkles className="mr-1 h-3 w-3" /> {formatDate(new Date(), true)}
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">
            {pending.length > 0
              ? `Kamu punya ${pending.length} PR yang belum dikumpulkan. Yuk kerjakan sekarang!`
              : 'Semua PR sudah dikumpulkan. Kerja bagus, pertahankan ya!'}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild size="sm" className="bg-white text-indigo-600 hover:bg-white/90">
              <Link href="/dashboard/attendance">
                <CalendarCheck className="h-4 w-4" /> Isi Kehadiran
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="border border-white/30 text-white hover:bg-white/15">
              <Link href="/dashboard/assignments">
                Info PR <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Kehadiran" value={attendanceRate} suffix="%" icon={CalendarCheck} accent="emerald" trend={`${presentCount} dari ${myAttendance.length} hari`} delay={0} />
        <StatCard label="PR Aktif" value={activeAssignments.length} icon={ClipboardList} accent="indigo" trend={`${pending.length} belum dikumpulkan`} delay={0.05} />
        <StatCard label="Rata-rata Nilai" value={avgScore} icon={GraduationCap} accent="fuchsia" trend={`${myGrades.length} nilai tercatat`} delay={0.1} />
        <StatCard
          label="Peringkat Kelas"
          value={rank ?? '—'}
          icon={TrendingUp}
          accent="amber"
          animate={rank != null}
          trend={rank != null ? `dari ${totalStudents} siswa` : 'belum ada nilai'}
          delay={0.15}
        />
      </div>

      {/* Quick menu */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.map((q, i) => (
          <motion.div key={q.href} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06 }}>
            <Link href={q.href} className="group block">
              <Card glass className="p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40">
                <div className={cn('mb-3 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform group-hover:scale-110', q.accent)}>
                  <q.icon className="h-5 w-5" />
                </div>
                <p className="flex items-center justify-between text-sm font-medium">
                  {q.label}
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </p>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Upcoming assignments */}
        <Card glass className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary" /> Info PR Mendatang
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/assignments">Semua</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {upcoming.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Tidak ada PR aktif. 🎉</p>}
            {upcoming.map((a) => {
              const info = deadlineInfo(a.deadline)
              const done = submittedIds.has(a.id)
              return (
                <Link
                  key={a.id}
                  href="/dashboard/assignments"
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.subject} · {formatDate(a.deadline)}
                    </p>
                  </div>
                  <Badge
                    variant={done ? 'success' : info.tone === 'urgent' || info.tone === 'overdue' ? 'destructive' : info.tone === 'soon' ? 'warning' : 'outline'}
                    className="shrink-0"
                  >
                    {done ? 'Selesai' : info.label}
                  </Badge>
                </Link>
              )
            })}
          </CardContent>
        </Card>

        {/* Recent attendance */}
        <Card glass>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="h-4 w-4 text-emerald-500" /> Kehadiran Terakhir
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentAttendance.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Belum ada riwayat kehadiran.
              </p>
            )}
            {recentAttendance.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 px-3 py-2.5">
                <span className="text-xs text-muted-foreground">{formatDate(a.date)}</span>
                <Badge variant="outline" className={cn('border', ATTENDANCE_CLASS[a.status])}>
                  {ATTENDANCE_LABEL[a.status]}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Pinned announcements */}
      {pinned.length > 0 && (
        <Card glass>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4 text-amber-500" /> Pengumuman Penting
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/announcements">Semua</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {pinned.map((a) => (
              <div key={a.id} className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
                <div className="mb-1.5 flex items-center gap-2">
                  <Pin className="h-3.5 w-3.5 text-amber-500" />
                  <p className="truncate text-sm font-semibold">{a.title}</p>
                </div>
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{a.content}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">{relativeTime(a.created_at)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
