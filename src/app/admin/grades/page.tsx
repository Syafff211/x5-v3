'use client'

import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Download, FileSpreadsheet, FileText, GraduationCap, Plus, Save, Trash2, Upload } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { nowIso, uid, useDataStore } from '@/store/data-store'
import { SUBJECTS } from '@/lib/demo-data'
import { exportToExcel, exportToPdf, importFromExcel } from '@/lib/export'
import { GRADE_TYPE_LABEL, average, cn, formatDate, gradeBadge, gradeColor } from '@/lib/utils'
import type { GradeType } from '@/types/database'

export default function AdminGradesPage() {
  const students = useDataStore((s) => s.students)
  const grades = useDataStore((s) => s.grades)
  const add = useDataStore((s) => s.add)
  const remove = useDataStore((s) => s.remove)

  const studentList = useMemo(
    () => students.filter((s) => s.role === 'student').sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [students]
  )

  const [subject, setSubject] = useState(SUBJECTS[0])
  const [type, setType] = useState<GradeType>('daily')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  const [fSubject, setFSubject] = useState('all')
  const [fType, setFType] = useState('all')

  const nameOf = (id: string) => students.find((s) => s.id === id)?.full_name ?? '—'

  const filtered = useMemo(
    () =>
      grades
        .filter((g) => (fSubject === 'all' || g.subject === fSubject) && (fType === 'all' || g.type === fType))
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [grades, fSubject, fType]
  )

  function saveBulk() {
    const entries = Object.entries(inputs).filter(([, v]) => v !== '')
    if (!entries.length) return toast.error('Belum ada nilai yang diisi.')

    let invalid = 0
    entries.forEach(([studentId, raw]) => {
      const score = Number(raw)
      if (Number.isNaN(score) || score < 0 || score > 100) return invalid++
      add('grades', { id: uid(), student_id: studentId, subject, type, score, date, created_at: nowIso() })
    })

    if (invalid) toast.error(`${invalid} nilai diabaikan (harus 0–100).`)
    toast.success(`${entries.length - invalid} nilai tersimpan untuk ${subject}.`)
    setInputs({})
  }

  async function handleImport(file: File) {
    try {
      const rows = await importFromExcel(file)
      let added = 0
      rows.forEach((r) => {
        const nisn = String(r['NISN'] ?? r['nisn'] ?? '').trim()
        const name = String(r['Nama'] ?? r['nama'] ?? '').trim().toLowerCase()
        const score = Number(r['Nilai'] ?? r['nilai'] ?? r['score'])
        const st = students.find((s) => (nisn && s.nisn === nisn) || (name && s.full_name.toLowerCase() === name))
        if (!st || Number.isNaN(score) || score < 0 || score > 100) return
        add('grades', {
          id: uid(),
          student_id: st.id,
          subject: String(r['Mapel'] ?? r['mapel'] ?? subject),
          type,
          score,
          date,
          created_at: nowIso(),
        })
        added++
      })
      toast.success(`${added} nilai berhasil diimpor.`)
    } catch {
      toast.error('Gagal membaca file Excel.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const perStudent = useMemo(
    () =>
      studentList
        .map((s) => {
          const list = grades.filter((g) => g.student_id === s.id)
          return { student: s, avg: average(list.map((g) => g.score)), count: list.length }
        })
        .sort((a, b) => b.avg - a.avg),
    [studentList, grades]
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Kelola Nilai" description={`${grades.length} nilai tercatat · rata-rata kelas ${average(grades.map((g) => g.score))}`} />

      <Tabs defaultValue="input">
        <TabsList>
          <TabsTrigger value="input"><Plus className="h-4 w-4" /> Input Nilai</TabsTrigger>
          <TabsTrigger value="list"><GraduationCap className="h-4 w-4" /> Daftar Nilai</TabsTrigger>
          <TabsTrigger value="report"><FileText className="h-4 w-4" /> Laporan</TabsTrigger>
        </TabsList>

        {/* INPUT */}
        <TabsContent value="input">
          <Card glass>
            <CardHeader>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Mata Pelajaran</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Jenis Penilaian</Label>
                  <Select value={type} onValueChange={(v) => setType(v as GradeType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Harian</SelectItem>
                      <SelectItem value="midterm">UTS</SelectItem>
                      <SelectItem value="final">UAS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="g-date">Tanggal</Label>
                  <Input id="g-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="flex items-end gap-2">
                  <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="sr-only" onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])} />
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="flex-1">
                    <Upload className="h-4 w-4" /> Import
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      exportToExcel(studentList.map((s, i) => ({ No: i + 1, Nama: s.full_name, NISN: s.nisn, Mapel: subject, Nilai: '' })), 'template-nilai', 'Template')
                      toast.success('Template diunduh.')
                    }}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {Object.values(inputs).filter((v) => v !== '').length} dari {studentList.length} siswa terisi
                </p>
                <Button variant="gradient" size="sm" onClick={saveBulk}>
                  <Save className="h-4 w-4" /> Simpan Semua
                </Button>
              </div>
              {studentList.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-3">
                  <span className="w-6 shrink-0 text-xs text-muted-foreground">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground">{s.nisn}</p>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0-100"
                    value={inputs[s.id] ?? ''}
                    onChange={(e) => setInputs((p) => ({ ...p, [s.id]: e.target.value }))}
                    className="h-9 w-24 shrink-0 text-center"
                    aria-label={`Nilai ${s.full_name}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LIST */}
        <TabsContent value="list">
          <Card glass>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Daftar Nilai ({filtered.length})</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Select value={fSubject} onValueChange={setFSubject}>
                    <SelectTrigger className="h-9 w-40 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Mapel</SelectItem>
                      {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={fType} onValueChange={setFType}>
                    <SelectTrigger className="h-9 w-32 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Jenis</SelectItem>
                      <SelectItem value="daily">Harian</SelectItem>
                      <SelectItem value="midterm">UTS</SelectItem>
                      <SelectItem value="final">UAS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              {filtered.length === 0 ? (
                <EmptyState icon={GraduationCap} title="Belum ada nilai" description="Input nilai melalui tab Input Nilai." className="m-4" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Siswa</TableHead>
                      <TableHead>Mapel</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead className="text-center">Nilai</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.slice(0, 100).map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">{nameOf(g.student_id)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{g.subject}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[11px]">{GRADE_TYPE_LABEL[g.type]}</Badge></TableCell>
                        <TableCell className="text-center">
                          <span className={cn('inline-flex min-w-11 justify-center rounded-lg border px-2 py-0.5 text-sm font-bold', gradeBadge(g.score))}>{g.score}</span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(g.date)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:bg-destructive/10"
                            aria-label="Hapus nilai"
                            onClick={() => { remove('grades', g.id); toast.success('Nilai dihapus.') }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORT */}
        <TabsContent value="report">
          <Card glass>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Rekap Nilai per Siswa</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    exportToExcel(perStudent.map((p, i) => ({ Peringkat: i + 1, Nama: p.student.full_name, NISN: p.student.nisn, 'Jumlah Nilai': p.count, 'Rata-rata': p.avg })), 'laporan-nilai-x5', 'Nilai')
                    toast.success('Laporan diekspor.')
                  }}
                >
                  <Download className="h-4 w-4" /> Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    exportToPdf(
                      'Laporan Nilai Kelas X-5',
                      ['Peringkat', 'Nama', 'NISN', 'Jumlah Nilai', 'Rata-rata'],
                      perStudent.map((p, i) => [i + 1, p.student.full_name, p.student.nisn ?? '', p.count, p.avg]),
                      `Rata-rata kelas: ${average(grades.map((g) => g.score))}`
                    )
                  }
                >
                  <FileText className="h-4 w-4" /> PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-2 pb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead className="text-center">Jumlah Nilai</TableHead>
                    <TableHead className="text-right">Rata-rata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perStudent.map((p, i) => (
                    <TableRow key={p.student.id}>
                      <TableCell>
                        <span className={cn('grid h-7 w-7 place-items-center rounded-lg text-xs font-bold', i < 3 ? 'brand-gradient text-white' : 'bg-muted text-muted-foreground')}>
                          {i + 1}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{p.student.full_name}</TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">{p.count}</TableCell>
                      <TableCell className={cn('text-right font-bold tabular-nums', gradeColor(p.avg))}>{p.avg}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
