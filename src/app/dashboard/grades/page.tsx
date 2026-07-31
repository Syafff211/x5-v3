'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Award, GraduationCap, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatCard } from '@/components/shared/stat-card'
import { EmptyState } from '@/components/shared/empty-state'
import { useAuthStore } from '@/store/auth-store'
import { useDataStore } from '@/store/data-store'
import { GRADE_TYPE_LABEL, average, cn, formatDate, gradeBadge, gradeColor } from '@/lib/utils'

export default function GradesPage() {
  const profile = useAuthStore((s) => s.profile)
  const grades = useDataStore((s) => s.grades)
  const [subject, setSubject] = useState('all')
  const [type, setType] = useState('all')

  const mine = useMemo(() => grades.filter((g) => g.student_id === profile?.id), [grades, profile?.id])
  const subjects = useMemo(() => Array.from(new Set(mine.map((g) => g.subject))).sort(), [mine])

  const filtered = useMemo(
    () =>
      mine
        .filter((g) => (subject === 'all' || g.subject === subject) && (type === 'all' || g.type === type))
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [mine, subject, type]
  )

  const perSubject = useMemo(
    () =>
      subjects
        .map((s) => {
          const list = mine.filter((g) => g.subject === s)
          return { subject: s, avg: average(list.map((g) => g.score)), count: list.length }
        })
        .sort((a, b) => b.avg - a.avg),
    [subjects, mine]
  )

  const overall = average(mine.map((g) => g.score))
  const best = perSubject[0]
  const highest = mine.length ? Math.max(...mine.map((g) => g.score)) : 0

  return (
    <div className="space-y-6">
      <PageHeader title="Nilai" description="Rekap nilai harian, UTS, dan UAS beserta rata-rata per mata pelajaran." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Rata-rata Keseluruhan" value={overall} icon={GraduationCap} accent="indigo" trend={`${mine.length} nilai`} />
        <StatCard label="Nilai Tertinggi" value={highest} icon={Award} accent="emerald" trend="dari semua mapel" />
        <StatCard label="Mapel Terbaik" value={best?.avg ?? 0} icon={TrendingUp} accent="fuchsia" trend={best?.subject ?? '-'} />
        <StatCard label="Total Mapel" value={subjects.length} icon={GraduationCap} accent="amber" trend="mata pelajaran" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Per subject averages */}
        <Card glass>
          <CardHeader>
            <CardTitle className="text-base">Rata-rata per Mapel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {perSubject.map((s, i) => (
              <motion.div key={s.subject} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="truncate pr-2">{s.subject}</span>
                  <span className={cn('shrink-0 font-semibold tabular-nums', gradeColor(s.avg))}>{s.avg}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.avg}%` }}
                    transition={{ duration: 0.8, delay: i * 0.04, ease: 'easeOut' }}
                    className={cn(
                      'h-full rounded-full',
                      s.avg >= 85 ? 'bg-emerald-500' : s.avg >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                    )}
                  />
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Table */}
        <Card glass className="lg:col-span-2">
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Daftar Nilai</CardTitle>
              <div className="flex gap-2">
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="h-9 w-full text-xs sm:w-40" aria-label="Filter mapel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Mapel</SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="h-9 w-full text-xs sm:w-32" aria-label="Filter jenis">
                    <SelectValue />
                  </SelectTrigger>
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
          <CardContent className="p-0 sm:px-2 sm:pb-4">
            {filtered.length === 0 ? (
              <EmptyState icon={GraduationCap} title="Belum ada nilai" description="Nilai akan muncul setelah guru menginput." className="m-4" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mata Pelajaran</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead className="text-center">Nilai</TableHead>
                    <TableHead className="text-right">Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.subject}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px]">{GRADE_TYPE_LABEL[g.type]}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn('inline-flex min-w-11 justify-center rounded-lg border px-2 py-0.5 text-sm font-bold tabular-nums', gradeBadge(g.score))}>
                          {g.score}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right text-xs text-muted-foreground">{formatDate(g.date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/60 bg-card/40 px-4 py-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Keterangan warna:</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> ≥ 85 Sangat Baik</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> 70–84 Cukup</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> &lt; 70 Perlu Perbaikan</span>
      </div>
    </div>
  )
}
