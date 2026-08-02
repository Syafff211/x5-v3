'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, ClipboardList, Clock, Paperclip } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/shared/empty-state'
import { useDataStore } from '@/store/data-store'
import { cn, deadlineInfo, formatDateTime } from '@/lib/utils'

export default function AssignmentsPage() {
  const assignments = useDataStore((s) => s.assignments)
  const [filter, setFilter] = useState<'aktif' | 'lewat' | 'semua'>('aktif')
  const [mapel, setMapel] = useState('all')

  const daftarMapel = useMemo(
    () => Array.from(new Set(assignments.map((a) => a.subject))).sort(),
    [assignments]
  )

  const list = useMemo(() => {
    const sekarang = Date.now()
    return [...assignments]
      .filter((a) => {
        const lewat = new Date(a.deadline).getTime() < sekarang
        if (filter === 'aktif' && lewat) return false
        if (filter === 'lewat' && !lewat) return false
        return mapel === 'all' || a.subject === mapel
      })
      .sort((a, b) => +new Date(a.deadline) - +new Date(b.deadline))
  }, [assignments, filter, mapel])

  const jumlah = useMemo(() => {
    const sekarang = Date.now()
    return {
      aktif: assignments.filter((a) => new Date(a.deadline).getTime() >= sekarang).length,
      lewat: assignments.filter((a) => new Date(a.deadline).getTime() < sekarang).length,
      semua: assignments.length,
    }
  }, [assignments])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Info PR"
        description="Daftar pekerjaan rumah beserta mata pelajaran dan tenggatnya."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="aktif">Aktif ({jumlah.aktif})</TabsTrigger>
            <TabsTrigger value="lewat">Lewat ({jumlah.lewat})</TabsTrigger>
            <TabsTrigger value="semua">Semua ({jumlah.semua})</TabsTrigger>
          </TabsList>
        </Tabs>

        {daftarMapel.length > 0 && (
          <Select value={mapel} onValueChange={setMapel}>
            <SelectTrigger className="sm:w-56" aria-label="Filter mata pelajaran">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Mata Pelajaran</SelectItem>
              {daftarMapel.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Tidak ada PR"
          description={
            filter === 'aktif'
              ? 'Belum ada PR yang aktif saat ini. Nikmati waktu luangmu!'
              : 'Belum ada PR pada kategori ini.'
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((a, i) => {
            const info = deadlineInfo(a.deadline)
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.4) }}
              >
                <Card glass className="flex h-full flex-col p-5 card-hover">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <ClipboardList className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{a.title}</h3>
                        <Badge variant="outline" className="mt-1 text-[11px]">
                          {a.subject}
                        </Badge>
                      </div>
                    </div>
                    <Badge
                      variant={
                        info.tone === 'overdue' || info.tone === 'urgent'
                          ? 'destructive'
                          : info.tone === 'soon'
                            ? 'warning'
                            : 'outline'
                      }
                      className="shrink-0"
                    >
                      {info.label}
                    </Badge>
                  </div>

                  {a.description && (
                    <p className="mb-4 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {a.description}
                    </p>
                  )}

                  <div
                    className={cn(
                      'flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/40 px-3 py-2.5 text-xs',
                      info.tone === 'overdue' ? 'text-muted-foreground' : 'text-foreground'
                    )}
                  >
                    <CalendarClock className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="text-muted-foreground">Tenggat:</span>
                    <span className="font-medium">{formatDateTime(a.deadline)}</span>
                  </div>

                  {a.file_url && (
                    <p className="mt-2 flex items-center gap-1.5 truncate text-xs text-primary">
                      <Paperclip className="h-3 w-3 shrink-0" /> {a.file_url}
                    </p>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-card/40 px-4 py-3 text-xs text-muted-foreground">
        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Halaman ini hanya menampilkan informasi PR. Pengumpulan tugas dilakukan langsung kepada guru
          sesuai arahan masing-masing mata pelajaran.
        </p>
      </div>
    </div>
  )
}
