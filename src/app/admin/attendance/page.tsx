'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CalendarCheck, CheckCheck, Download, FileText, Loader2, Save } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { nowIso, uid, useDataStore } from '@/store/data-store'
import { exportToExcel, exportToPdf } from '@/lib/export'
import { ATTENDANCE_CLASS, ATTENDANCE_LABEL, cn, formatDate, initials } from '@/lib/utils'
import type { AttendanceStatus } from '@/types/database'

const STATUSES: AttendanceStatus[] = ['present', 'late', 'permission', 'sick', 'absent']
const SHORT: Record<AttendanceStatus, string> = { present: 'H', late: 'T', permission: 'I', sick: 'S', absent: 'A' }

export default function AdminAttendancePage() {
  const students = useDataStore((s) => s.students)
  const attendance = useDataStore((s) => s.attendance)
  const add = useDataStore((s) => s.add)
  const update = useDataStore((s) => s.update)

  const studentList = useMemo(
    () => students.filter((s) => s.role === 'student').sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [students]
  )

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({})
  const [saving, setSaving] = useState(false)

  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))

  const existing = useMemo(() => {
    const map: Record<string, AttendanceStatus> = {}
    attendance.filter((a) => a.date === date).forEach((a) => (map[a.student_id] = a.status))
    return map
  }, [attendance, date])

  const statusOf = (id: string) => draft[id] ?? existing[id] ?? null

  const setAll = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {}
    studentList.forEach((s) => (next[s.id] = status))
    setDraft(next)
    toast.success(`Semua siswa ditandai ${ATTENDANCE_LABEL[status]}.`)
  }

  async function saveAll() {
    const entries = Object.entries(draft)
    if (!entries.length) return toast.error('Belum ada perubahan untuk disimpan.')
    setSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    entries.forEach(([studentId, status]) => {
      const rec = attendance.find((a) => a.date === date && a.student_id === studentId)
      if (rec) update('attendance', rec.id, { status })
      else add('attendance', { id: uid(), student_id: studentId, date, status, note: null, created_at: nowIso() })
    })
    setSaving(false)
    setDraft({})
    toast.success(`Kehadiran ${formatDate(date)} tersimpan (${entries.length} siswa).`)
  }

  // ---- Report ----
  const report = useMemo(() => {
    const inRange = attendance.filter((a) => a.date >= from && a.date <= to)
    return studentList.map((s) => {
      const rows = inRange.filter((a) => a.student_id === s.id)
      const c = { present: 0, late: 0, permission: 0, sick: 0, absent: 0 }
      rows.forEach((r) => (c[r.status] += 1))
      const total = rows.length || 1
      return { student: s, ...c, total: rows.length, rate: Math.round((c.present / total) * 100) }
    })
  }, [attendance, studentList, from, to])

  const reportRows = () =>
    report.map((r, i) => ({
      No: i + 1,
      Nama: r.student.full_name,
      NISN: r.student.nisn,
      Hadir: r.present,
      Terlambat: r.late,
      Izin: r.permission,
      Sakit: r.sick,
      Alpa: r.absent,
      Total: r.total,
      'Persentase (%)': r.rate,
    }))

  const todaySummary = useMemo(() => {
    const c: Record<string, number> = { present: 0, late: 0, permission: 0, sick: 0, absent: 0, none: 0 }
    studentList.forEach((s) => {
      const st = statusOf(s.id)
      if (st) c[st] += 1
      else c.none += 1
    })
    return c
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentList, draft, existing])

  return (
    <div className="space-y-6">
      <PageHeader title="Kelola Kehadiran" description="Input absensi harian dan buat laporan rekap kehadiran." />

      <Tabs defaultValue="input">
        <TabsList>
          <TabsTrigger value="input"><CalendarCheck className="h-4 w-4" /> Input Kehadiran</TabsTrigger>
          <TabsTrigger value="report"><FileText className="h-4 w-4" /> Laporan</TabsTrigger>
        </TabsList>

        {/* ---------- INPUT ---------- */}
        <TabsContent value="input" className="space-y-4">
          <Card glass>
            <CardHeader className="gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal Absensi</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => { setDate(e.target.value); setDraft({}) }} className="w-full sm:w-48" />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setAll('present')}>
                    <CheckCheck className="h-4 w-4" /> Tandai Semua Hadir
                  </Button>
                  <Button variant="gradient" size="sm" onClick={saveAll} disabled={saving || !Object.keys(draft).length}>
                    {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</> : <><Save className="h-4 w-4" /> Simpan ({Object.keys(draft).length})</>}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {STATUSES.map((st) => (
                  <Badge key={st} variant="outline" className={cn('border', ATTENDANCE_CLASS[st])}>
                    {ATTENDANCE_LABEL[st]}: {todaySummary[st]}
                  </Badge>
                ))}
                {todaySummary.none > 0 && <Badge variant="outline">Belum diisi: {todaySummary.none}</Badge>}
              </div>
            </CardHeader>

            <CardContent className="space-y-2">
              {studentList.map((s, i) => {
                const current = statusOf(s.id)
                return (
                  <div key={s.id} className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/40 p-3 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="w-6 shrink-0 text-xs text-muted-foreground">{i + 1}</span>
                      <Avatar className="h-9 w-9 shrink-0">
                        {s.avatar_url && <AvatarImage src={s.avatar_url} alt={s.full_name} />}
                        <AvatarFallback className="text-[10px]">{initials(s.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{s.full_name}</p>
                        <p className="text-xs text-muted-foreground">{s.nisn}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1.5" role="radiogroup" aria-label={`Status kehadiran ${s.full_name}`}>
                      {STATUSES.map((st) => (
                        <button
                          key={st}
                          role="radio"
                          aria-checked={current === st}
                          onClick={() => setDraft((d) => ({ ...d, [s.id]: st }))}
                          title={ATTENDANCE_LABEL[st]}
                          className={cn(
                            'h-9 w-9 rounded-lg border-2 text-xs font-bold transition-all',
                            current === st ? ATTENDANCE_CLASS[st] : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-accent'
                          )}
                        >
                          {SHORT[st]}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------- REPORT ---------- */}
        <TabsContent value="report" className="space-y-4">
          <Card glass>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-wrap gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="from">Dari</Label>
                    <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="to">Sampai</Label>
                    <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      exportToExcel(reportRows(), 'laporan-kehadiran-x5', 'Kehadiran')
                      toast.success('Laporan diekspor ke Excel.')
                    }}
                  >
                    <Download className="h-4 w-4" /> Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      exportToPdf(
                        'Laporan Kehadiran Kelas X-5',
                        ['No', 'Nama', 'NISN', 'H', 'T', 'I', 'S', 'A', 'Total', '%'],
                        report.map((r, i) => [i + 1, r.student.full_name, r.student.nisn ?? '', r.present, r.late, r.permission, r.sick, r.absent, r.total, `${r.rate}%`]),
                        `Periode ${formatDate(from)} — ${formatDate(to)}`
                      )
                    }
                  >
                    <FileText className="h-4 w-4" /> PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {report.length === 0 ? (
                <EmptyState icon={CalendarCheck} title="Tidak ada data" description="Belum ada catatan kehadiran pada rentang tanggal ini." className="m-4" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Nama Siswa</TableHead>
                      <TableHead className="text-center">H</TableHead>
                      <TableHead className="text-center">T</TableHead>
                      <TableHead className="text-center">I</TableHead>
                      <TableHead className="text-center">S</TableHead>
                      <TableHead className="text-center">A</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-right">Persentase</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.map((r, i) => (
                      <TableRow key={r.student.id}>
                        <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{r.student.full_name}</TableCell>
                        <TableCell className="text-center text-emerald-500">{r.present}</TableCell>
                        <TableCell className="text-center text-amber-500">{r.late}</TableCell>
                        <TableCell className="text-center text-sky-500">{r.permission}</TableCell>
                        <TableCell className="text-center text-violet-500">{r.sick}</TableCell>
                        <TableCell className="text-center text-rose-500">{r.absent}</TableCell>
                        <TableCell className="text-center text-muted-foreground">{r.total}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={r.rate >= 90 ? 'success' : r.rate >= 75 ? 'warning' : 'destructive'}>{r.rate}%</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
