'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CalendarCheck, ClipboardList, Download, FileBarChart, FileText, GraduationCap, Users } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDataStore } from '@/store/data-store'
import { exportToExcel, exportToPdf } from '@/lib/export'
import { ATTENDANCE_LABEL, GRADE_TYPE_LABEL, average, cn, formatDate, formatDateTime } from '@/lib/utils'

type ReportKey = 'attendance' | 'grades' | 'assignments' | 'students'

const REPORTS: { key: ReportKey; title: string; desc: string; icon: typeof Users; accent: string }[] = [
  { key: 'attendance', title: 'Laporan Kehadiran', desc: 'Rekap kehadiran seluruh siswa per periode.', icon: CalendarCheck, accent: 'from-emerald-500 to-teal-500' },
  { key: 'grades', title: 'Laporan Nilai', desc: 'Rekap nilai dan peringkat kelas.', icon: GraduationCap, accent: 'from-fuchsia-500 to-pink-500' },
  { key: 'assignments', title: 'Laporan Tugas', desc: 'Status pengumpulan tugas per siswa.', icon: ClipboardList, accent: 'from-indigo-500 to-violet-500' },
  { key: 'students', title: 'Data Siswa', desc: 'Daftar lengkap data induk siswa.', icon: Users, accent: 'from-sky-500 to-blue-500' },
]

export default function AdminReportsPage() {
  const { students, attendance, grades, assignments, submissions } = useDataStore()
  const [selected, setSelected] = useState<ReportKey>('attendance')
  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))

  const studentList = useMemo(
    () => students.filter((s) => s.role === 'student').sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [students]
  )

  const built = useMemo(() => {
    if (selected === 'attendance') {
      const inRange = attendance.filter((a) => a.date >= from && a.date <= to)
      const headers = ['No', 'Nama', 'NISN', 'Hadir', 'Terlambat', 'Izin', 'Sakit', 'Alpa', 'Total', 'Persentase']
      const rows = studentList.map((s, i) => {
        const r = inRange.filter((a) => a.student_id === s.id)
        const c = { present: 0, late: 0, permission: 0, sick: 0, absent: 0 }
        r.forEach((x) => (c[x.status] += 1))
        const rate = r.length ? Math.round((c.present / r.length) * 100) : 0
        return [i + 1, s.full_name, s.nisn ?? '', c.present, c.late, c.permission, c.sick, c.absent, r.length, `${rate}%`]
      })
      return { headers, rows, title: 'Laporan Kehadiran Kelas X-5', subtitle: `Periode ${formatDate(from)} — ${formatDate(to)}` }
    }

    if (selected === 'grades') {
      const headers = ['Peringkat', 'Nama', 'NISN', 'Harian', 'UTS', 'UAS', 'Rata-rata']
      const rows = studentList
        .map((s) => {
          const g = grades.filter((x) => x.student_id === s.id)
          const byType = (t: string) => average(g.filter((x) => x.type === t).map((x) => x.score))
          return { s, daily: byType('daily'), mid: byType('midterm'), fin: byType('final'), avg: average(g.map((x) => x.score)) }
        })
        .sort((a, b) => b.avg - a.avg)
        .map((r, i) => [i + 1, r.s.full_name, r.s.nisn ?? '', r.daily, r.mid, r.fin, r.avg])
      return { headers, rows, title: 'Laporan Nilai Kelas X-5', subtitle: `Rata-rata kelas: ${average(grades.map((g) => g.score))}` }
    }

    if (selected === 'assignments') {
      const headers = ['No', 'Judul Tugas', 'Mapel', 'Deadline', 'Terkumpul', 'Dinilai', 'Rata-rata Nilai']
      const rows = assignments.map((a, i) => {
        const subs = submissions.filter((s) => s.assignment_id === a.id)
        const scored = subs.filter((s) => s.score != null)
        return [
          i + 1,
          a.title,
          a.subject,
          formatDateTime(a.deadline),
          `${subs.length}/${studentList.length}`,
          scored.length,
          scored.length ? average(scored.map((s) => s.score!)) : '—',
        ]
      })
      return { headers, rows, title: 'Laporan Tugas Kelas X-5', subtitle: `${assignments.length} tugas · ${submissions.length} pengumpulan` }
    }

    const headers = ['No', 'Nama Lengkap', 'NISN', 'Email', 'No. HP', 'Orang Tua', 'Alamat']
    const rows = studentList.map((s, i) => [i + 1, s.full_name, s.nisn ?? '', s.email, s.phone ?? '', s.parent_name ?? '', s.address ?? ''])
    return { headers, rows, title: 'Data Induk Siswa Kelas X-5', subtitle: `${studentList.length} siswa terdaftar` }
  }, [selected, studentList, attendance, grades, assignments, submissions, from, to])

  function toExcel() {
    const objs = built.rows.map((r) => Object.fromEntries(built.headers.map((h, i) => [h, r[i]])))
    exportToExcel(objs, `laporan-${selected}-x5`, built.title.slice(0, 30))
    toast.success('Laporan diekspor ke Excel.')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Report Generator" description="Buat dan unduh laporan kelas dalam format Excel atau PDF." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REPORTS.map((r) => (
          <button key={r.key} onClick={() => setSelected(r.key)} className="text-left">
            <Card
              glass
              className={cn(
                'h-full p-5 transition-all hover:-translate-y-1',
                selected === r.key ? 'border-primary ring-2 ring-primary/30' : 'hover:border-primary/40'
              )}
            >
              <div className={cn('mb-3 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg', r.accent)}>
                <r.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold">{r.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
            </Card>
          </button>
        ))}
      </div>

      <Card glass>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileBarChart className="h-4 w-4 text-primary" /> {built.title}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">{built.subtitle}</p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              {selected === 'attendance' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="r-from" className="text-[11px]">Dari</Label>
                    <Input id="r-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-36" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="r-to" className="text-[11px]">Sampai</Label>
                    <Input id="r-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-36" />
                  </div>
                </>
              )}
              <Button variant="outline" size="sm" onClick={toExcel}><Download className="h-4 w-4" /> Excel</Button>
              <Button variant="gradient" size="sm" onClick={() => exportToPdf(built.title, built.headers, built.rows, built.subtitle)}>
                <FileText className="h-4 w-4" /> PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[520px] overflow-auto rounded-xl border border-border/60 scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                <tr>
                  {built.headers.map((h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {built.rows.map((r, i) => (
                  <tr key={i} className="border-t border-border/50 hover:bg-accent/40">
                    {r.map((c, j) => (
                      <td key={j} className="max-w-[220px] truncate whitespace-nowrap px-3 py-2 text-xs">{String(c)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{built.rows.length} baris</span>
            <Badge variant="outline">Siap diekspor</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
