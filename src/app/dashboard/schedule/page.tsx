'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Clock, DoorOpen, User } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { useDataStore } from '@/store/data-store'
import { cn } from '@/lib/utils'

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
const JS_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export default function SchedulePage() {
  const schedules = useDataStore((s) => s.schedules)
  const todayName = JS_DAYS[new Date().getDay()]
  const [day, setDay] = useState(DAYS.includes(todayName) ? todayName : 'Senin')

  const byDay = useMemo(() => schedules.filter((s) => s.day === day), [schedules, day])

  return (
    <div className="space-y-6">
      <PageHeader title="Jadwal Pelajaran" description="Jadwal mingguan kelas X-5 semester ini." />

      <div className="flex flex-wrap gap-2">
        {DAYS.map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            aria-pressed={day === d}
            className={cn(
              'relative rounded-xl border px-4 py-2 text-sm font-medium transition-all',
              day === d
                ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25'
                : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-accent'
            )}
          >
            {d}
            {d === todayName && (
              <span className={cn('absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full', day === d ? 'bg-white' : 'bg-emerald-500')} />
            )}
          </button>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {byDay.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Tidak ada jadwal" description={`Belum ada jadwal untuk hari ${day}.`} />
        ) : (
          byDay.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card glass className="p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl brand-gradient text-xs font-bold text-white">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{s.subject}</h3>
                    <div className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {s.time}</p>
                      <p className="flex items-center gap-1.5"><DoorOpen className="h-3.5 w-3.5" /> {s.room}</p>
                      <p className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {s.teacher}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <Card glass className="hidden lg:block">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Hari {day}</CardTitle>
          {day === todayName && <Badge variant="success">Hari ini</Badge>}
        </CardHeader>
        <CardContent className="px-2 pb-4">
          {byDay.length === 0 ? (
            <EmptyState icon={CalendarDays} title="Tidak ada jadwal" description={`Belum ada jadwal untuk hari ${day}.`} className="m-4" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Jam</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Mata Pelajaran</TableHead>
                  <TableHead>Ruang</TableHead>
                  <TableHead>Guru</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byDay.map((s, i) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{s.time}</TableCell>
                    <TableCell className="font-medium">{s.subject}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.room}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.teacher}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Weekly overview */}
      <Card glass>
        <CardHeader>
          <CardTitle className="text-base">Ringkasan Mingguan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {DAYS.map((d) => {
              const items = schedules.filter((s) => s.day === d)
              return (
                <div key={d} className={cn('rounded-xl border p-3', d === todayName ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-card/40')}>
                  <p className="mb-2 text-sm font-semibold">{d}</p>
                  <ul className="space-y-1">
                    {items.map((s) => (
                      <li key={s.id} className="truncate text-xs text-muted-foreground">
                        • {s.subject}
                      </li>
                    ))}
                    {items.length === 0 && <li className="text-xs text-muted-foreground">—</li>}
                  </ul>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
