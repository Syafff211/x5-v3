'use client'

import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Database, Download, HardDriveDownload, RefreshCcw, Table2, Upload } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDataStore } from '@/store/data-store'
import { exportToExcel, exportToJson } from '@/lib/export'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { cn } from '@/lib/utils'

const TABLES = [
  { key: 'students', label: 'profiles', desc: 'Data siswa & admin' },
  { key: 'attendance', label: 'attendance', desc: 'Catatan kehadiran' },
  { key: 'assignments', label: 'assignments', desc: 'Daftar tugas' },
  { key: 'submissions', label: 'assignment_submissions', desc: 'Pengumpulan tugas' },
  { key: 'grades', label: 'grades', desc: 'Nilai siswa' },
  { key: 'announcements', label: 'announcements', desc: 'Pengumuman kelas' },
  { key: 'gallery', label: 'gallery', desc: 'Media galeri' },
  { key: 'messages', label: 'messages', desc: 'Pesan chat' },
  { key: 'schedules', label: 'schedules', desc: 'Jadwal pelajaran' },
  { key: 'organization', label: 'organization', desc: 'Struktur organisasi' },
  { key: 'events', label: 'events', desc: 'Agenda kalender' },
] as const

export default function AdminDatabasePage() {
  const data = useDataStore()
  const replace = useDataStore((s) => s.replace)
  const resetAll = useDataStore((s) => s.resetAll)

  const [selected, setSelected] = useState<(typeof TABLES)[number]['key']>('students')
  const [confirmReset, setConfirmReset] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const rows = (data as any)[selected] as Record<string, unknown>[]
  const columns = useMemo(() => (rows?.length ? Object.keys(rows[0]).filter((c) => c !== 'profiles') : []), [rows])
  const totalRows = TABLES.reduce((sum, t) => sum + ((data as any)[t.key]?.length ?? 0), 0)

  function backupAll() {
    const snapshot = Object.fromEntries(TABLES.map((t) => [t.label, (data as any)[t.key]]))
    exportToJson({ exported_at: new Date().toISOString(), version: 1, tables: snapshot }, 'backup-x5-database')
    toast.success('Backup database berhasil diunduh.')
  }

  async function restore(file: File) {
    try {
      const parsed = JSON.parse(await file.text())
      const tables = parsed?.tables
      if (!tables || typeof tables !== 'object') throw new Error('invalid')
      let restored = 0
      TABLES.forEach((t) => {
        if (Array.isArray(tables[t.label])) {
          replace(t.label as any, tables[t.label])
          restored++
        }
      })
      toast.success(`${restored} tabel berhasil dipulihkan.`)
    } catch {
      toast.error('File backup tidak valid.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Database"
        description={`${TABLES.length} tabel · ${totalRows} baris data`}
        action={
          <>
            <input ref={fileRef} type="file" accept=".json" className="sr-only" onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])} />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Restore</Button>
            <Button variant="outline" size="sm" onClick={backupAll}><HardDriveDownload className="h-4 w-4" /> Backup</Button>
            <Button variant="destructive" size="sm" onClick={() => setConfirmReset(true)}><RefreshCcw className="h-4 w-4" /> Reset Data</Button>
          </>
        }
      />

      {!isSupabaseConfigured && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="text-sm">
            <p className="font-medium text-amber-600 dark:text-amber-400">Mode Demo Aktif</p>
            <p className="mt-0.5 text-muted-foreground">
              Data disimpan di localStorage browser. Setelah variabel Supabase diisi, semua operasi otomatis tersinkron
              ke database Postgres dengan RLS aktif.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-4">
        {/* Table list */}
        <Card glass className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Tabel</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {TABLES.map((t) => {
              const count = (data as any)[t.key]?.length ?? 0
              return (
                <button
                  key={t.key}
                  onClick={() => setSelected(t.key)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                    selected === t.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Table2 className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">{t.label}</span>
                  <Badge variant="outline" className="shrink-0 text-[10px]">{count}</Badge>
                </button>
              )
            })}
          </CardContent>
        </Card>

        {/* Table viewer */}
        <Card glass className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="font-mono text-base">{TABLES.find((t) => t.key === selected)?.label}</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {TABLES.find((t) => t.key === selected)?.desc} · {rows?.length ?? 0} baris
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!rows?.length) return toast.error('Tabel kosong.')
                exportToExcel(rows.map((r) => Object.fromEntries(columns.map((c) => [c, String((r as any)[c] ?? '')]))), `table-${selected}`, selected)
                toast.success('Tabel diekspor.')
              }}
            >
              <Download className="h-4 w-4" /> Export
            </Button>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {!rows?.length ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Tabel kosong.</p>
            ) : (
              <div className="max-h-[520px] overflow-auto scrollbar-thin">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      {columns.map((c) => (
                        <TableHead key={c} className="whitespace-nowrap font-mono text-[10px]">{c}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.slice(0, 50).map((r, i) => (
                      <TableRow key={i}>
                        {columns.map((c) => (
                          <TableCell key={c} className="max-w-[180px] truncate whitespace-nowrap text-xs">
                            {formatCell((r as any)[c])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {rows.length > 50 && (
                  <p className="py-3 text-center text-xs text-muted-foreground">Menampilkan 50 dari {rows.length} baris. Ekspor untuk melihat semua.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schema info */}
      <Card glass>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Database className="h-4 w-4 text-primary" /> Informasi Skema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Storage Buckets', 'avatars, assignments, submissions, gallery'],
              ['RLS', 'Aktif di semua tabel'],
              ['Auth', 'Email/Password + role-based'],
              ['Realtime', 'messages (INSERT), broadcast typing'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-border/60 bg-card/40 p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm font-medium">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Semua Data?</DialogTitle>
            <DialogDescription>
              Semua tabel akan dikembalikan ke data awal (seed). Buat backup terlebih dahulu jika diperlukan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReset(false)}>Batal</Button>
            <Button variant="destructive" onClick={() => { resetAll(); setConfirmReset(false); toast.success('Data direset ke kondisi awal.') }}>
              <RefreshCcw className="h-4 w-4" /> Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatCell(v: unknown) {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
