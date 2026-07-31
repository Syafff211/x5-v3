'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { CalendarCheck, CheckCircle2, Clock, FileText, Heart, Loader2, XCircle } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/empty-state'
import { useAuthStore } from '@/store/auth-store'
import { nowIso, uid, useDataStore } from '@/store/data-store'
import { ATTENDANCE_CLASS, ATTENDANCE_LABEL, cn, formatDate, sanitizeText } from '@/lib/utils'
import type { AttendanceStatus } from '@/types/database'

const OPTIONS: { value: AttendanceStatus; label: string; icon: typeof CheckCircle2; color: string }[] = [
  { value: 'present', label: 'Hadir', icon: CheckCircle2, color: 'emerald' },
  { value: 'late', label: 'Terlambat', icon: Clock, color: 'amber' },
  { value: 'permission', label: 'Izin', icon: FileText, color: 'sky' },
  { value: 'sick', label: 'Sakit', icon: Heart, color: 'violet' },
  { value: 'absent', label: 'Alpa', icon: XCircle, color: 'rose' },
]

const RING: Record<string, string> = {
  emerald: 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  amber: 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  sky: 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  violet: 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400',
  rose: 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400',
}

export default function AttendancePage() {
  const profile = useAuthStore((s) => s.profile)
  const attendance = useDataStore((s) => s.attendance)
  const add = useDataStore((s) => s.add)

  const [status, setStatus] = useState<AttendanceStatus>('present')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const myAttendance = useMemo(
    () => attendance.filter((a) => a.student_id === profile?.id).sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [attendance, profile?.id]
  )
  const todayRecord = myAttendance.find((a) => a.date === today)

  const stats = useMemo(() => {
    const c = { present: 0, late: 0, permission: 0, sick: 0, absent: 0 }
    myAttendance.forEach((a) => (c[a.status] += 1))
    const total = myAttendance.length || 1
    return { ...c, rate: Math.round((c.present / total) * 100) }
  }, [myAttendance])

  const needsNote = status === 'permission' || status === 'sick'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (needsNote && note.trim().length < 4) {
      toast.error('Mohon isi alasan untuk status Izin/Sakit.')
      return
    }
    setSaving(true)
    await new Promise((r) => setTimeout(r, 500))
    add('attendance', {
      id: uid(),
      student_id: profile!.id,
      date: today,
      status,
      note: note.trim() ? sanitizeText(note, 300) : null,
      created_at: nowIso(),
    })
    setSaving(false)
    setNote('')
    toast.success(`Kehadiran hari ini tercatat: ${ATTENDANCE_LABEL[status]}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Kehadiran" description="Isi absensi harian dan pantau riwayat kehadiranmu." />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card glass className="p-4">
          <p className="text-xs text-muted-foreground">Persentase</p>
          <p className="mt-1 text-2xl font-bold text-emerald-500">{stats.rate}%</p>
        </Card>
        {OPTIONS.map((o) => (
          <Card key={o.value} glass className="p-4">
            <p className="truncate text-xs text-muted-foreground">{o.label}</p>
            <p className="mt-1 text-2xl font-bold">{stats[o.value]}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Form */}
        <Card glass className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="h-4 w-4 text-primary" /> Absensi Hari Ini
            </CardTitle>
            <p className="text-xs text-muted-foreground">{formatDate(new Date(), true)}</p>
          </CardHeader>
          <CardContent>
            {todayRecord ? (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-5 text-center">
                <CheckCircle2 className="mx-auto mb-2 h-9 w-9 text-emerald-500" />
                <p className="font-semibold">Kehadiran sudah tercatat</p>
                <Badge variant="outline" className={cn('mt-2 border', ATTENDANCE_CLASS[todayRecord.status])}>
                  {ATTENDANCE_LABEL[todayRecord.status]}
                </Badge>
                {todayRecord.note && <p className="mt-3 text-xs text-muted-foreground">&ldquo;{todayRecord.note}&rdquo;</p>}
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <fieldset>
                  <legend className="mb-2.5 text-sm font-medium">Status Kehadiran</legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2">
                    {OPTIONS.map((o) => {
                      const active = status === o.value
                      return (
                        <label
                          key={o.value}
                          className={cn(
                            'flex cursor-pointer items-center gap-2.5 rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all',
                            active ? RING[o.color] : 'border-border text-muted-foreground hover:border-border/80 hover:bg-accent/40'
                          )}
                        >
                          <input
                            type="radio"
                            name="status"
                            value={o.value}
                            checked={active}
                            onChange={() => setStatus(o.value)}
                            className="sr-only"
                          />
                          <o.icon className="h-4 w-4 shrink-0" />
                          {o.label}
                        </label>
                      )
                    })}
                  </div>
                </fieldset>

                <div className="space-y-2">
                  <Label htmlFor="note">
                    Keterangan {needsNote ? <span className="text-destructive">*</span> : <span className="text-muted-foreground">(opsional)</span>}
                  </Label>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={needsNote ? 'Contoh: Sakit demam, ada surat dokter.' : 'Tambahkan keterangan bila perlu...'}
                    maxLength={300}
                    required={needsNote}
                  />
                  <p className="text-right text-[11px] text-muted-foreground">{note.length}/300</p>
                </div>

                <Button type="submit" variant="gradient" className="w-full" disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</> : 'Kirim Absensi'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* History */}
        <Card glass className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Riwayat Kehadiran</CardTitle>
            <p className="text-xs text-muted-foreground">{myAttendance.length} catatan</p>
          </CardHeader>
          <CardContent>
            {myAttendance.length === 0 ? (
              <EmptyState icon={CalendarCheck} title="Belum ada riwayat" description="Riwayat kehadiran akan muncul setelah kamu mengisi absensi." />
            ) : (
              <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1 scrollbar-thin">
                {myAttendance.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-3"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted text-xs font-semibold">
                      {new Date(a.date).getDate()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{formatDate(a.date, true)}</p>
                      {a.note && <p className="truncate text-xs text-muted-foreground">{a.note}</p>}
                    </div>
                    <Badge variant="outline" className={cn('shrink-0 border', ATTENDANCE_CLASS[a.status])}>
                      {ATTENDANCE_LABEL[a.status]}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
