'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Bell, Building2, Lock, Monitor, Moon, Save, Shield, Sun } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { cn } from '@/lib/utils'

export default function AdminSettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [school, setSchool] = useState({
    class_name: 'X-5',
    school_name: 'SMAN 1 Purbalingga',
    homeroom: 'Dra. Sri Wahyuni, M.Pd.',
    academic_year: '2025/2026',
    email: 'support@x5-sman1.web.id',
  })
  const [flags, setFlags] = useState({ self_attendance: true, public_gallery: false, allow_chat: true, maintenance: false })
  const [pw, setPw] = useState({ next: '', confirm: '' })

  useEffect(() => {
    setMounted(true)
    const s = localStorage.getItem('x5-school')
    if (s) { try { setSchool(JSON.parse(s)) } catch {} }
    const f = localStorage.getItem('x5-flags')
    if (f) { try { setFlags(JSON.parse(f)) } catch {} }
  }, [])

  function saveSchool() {
    localStorage.setItem('x5-school', JSON.stringify(school))
    toast.success('Informasi kelas disimpan.')
  }

  function setFlag(key: keyof typeof flags, value: boolean) {
    const next = { ...flags, [key]: value }
    setFlags(next)
    localStorage.setItem('x5-flags', JSON.stringify(next))
    toast.success('Pengaturan diperbarui.')
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pw.next.length < 8) return toast.error('Password minimal 8 karakter.')
    if (pw.next !== pw.confirm) return toast.error('Konfirmasi password tidak cocok.')
    const supabase = createClient()
    if (supabase) {
      const { error } = await supabase.auth.updateUser({ password: pw.next })
      if (error) return toast.error(error.message)
    }
    setPw({ next: '', confirm: '' })
    toast.success('Password admin berhasil diubah.')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan" description="Konfigurasi kelas, fitur aplikasi, dan keamanan admin." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card glass>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-primary" /> Informasi Kelas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="s-class">Nama Kelas</Label>
                <Input id="s-class" value={school.class_name} onChange={(e) => setSchool({ ...school, class_name: e.target.value })} maxLength={20} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-year">Tahun Ajaran</Label>
                <Input id="s-year" value={school.academic_year} onChange={(e) => setSchool({ ...school, academic_year: e.target.value })} maxLength={20} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="s-school">Nama Sekolah</Label>
                <Input id="s-school" value={school.school_name} onChange={(e) => setSchool({ ...school, school_name: e.target.value })} maxLength={80} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="s-hr">Wali Kelas</Label>
                <Input id="s-hr" value={school.homeroom} onChange={(e) => setSchool({ ...school, homeroom: e.target.value })} maxLength={80} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="s-email">Email Kontak</Label>
                <Input id="s-email" type="email" value={school.email} onChange={(e) => setSchool({ ...school, email: e.target.value })} />
              </div>
            </div>
            <Button variant="gradient" onClick={saveSchool}><Save className="h-4 w-4" /> Simpan</Button>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4 text-amber-500" /> Fitur Aplikasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {([
              ['self_attendance', 'Absensi Mandiri Siswa', 'Siswa dapat mengisi kehadirannya sendiri.'],
              ['allow_chat', 'Chat Antar Siswa', 'Aktifkan fitur messages di dashboard siswa.'],
              ['public_gallery', 'Galeri Publik', 'Tampilkan galeri di landing page tanpa login.'],
              ['maintenance', 'Mode Maintenance', 'Nonaktifkan akses siswa sementara.'],
            ] as const).map(([key, label, desc]) => (
              <div key={key} className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/40 p-3">
                <div className="min-w-0">
                  <Label htmlFor={`f-${key}`} className="cursor-pointer text-sm">{label}</Label>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch id={`f-${key}`} checked={flags[key]} onCheckedChange={(v) => setFlag(key, v)} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Monitor className="h-4 w-4 text-sky-500" /> Tampilan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {[['dark', 'Gelap', Moon], ['light', 'Terang', Sun], ['system', 'Sistem', Monitor]].map(([value, label, Icon]: any) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  aria-pressed={mounted && theme === value}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 text-sm font-medium transition-all',
                    mounted && theme === value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Lock className="h-4 w-4 text-rose-500" /> Password Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={changePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="a-new">Password Baru</Label>
                <Input id="a-new" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} placeholder="Min. 8 karakter" autoComplete="new-password" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-conf">Konfirmasi Password</Label>
                <Input id="a-conf" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" required />
              </div>
              <Button type="submit" variant="gradient" className="w-full"><Save className="h-4 w-4" /> Ubah Password</Button>
            </form>
          </CardContent>
        </Card>

        <Card glass className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4 text-emerald-500" /> Status Sistem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Backend', isSupabaseConfigured ? 'Supabase Terhubung' : 'Mode Demo', isSupabaseConfigured],
                ['Row Level Security', isSupabaseConfigured ? 'Aktif' : 'Menunggu setup', isSupabaseConfigured],
                ['Realtime', isSupabaseConfigured ? 'Aktif' : 'Simulasi lokal', isSupabaseConfigured],
                ['PWA', 'Terpasang', true],
              ].map(([label, value, ok]: any) => (
                <div key={label} className="rounded-xl border border-border/60 bg-card/40 p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full', ok ? 'bg-emerald-500' : 'bg-amber-500')} />
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>
            {!isSupabaseConfigured && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-muted-foreground">
                <Badge variant="warning" className="mb-1.5">Info</Badge>
                <p>Isi <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_URL</code> dan <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di environment variable, lalu jalankan skema SQL di <code className="rounded bg-muted px-1">supabase/schema.sql</code>.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
