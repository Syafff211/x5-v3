'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Bell, Loader2, Lock, Monitor, Moon, Palette, Save, Shield, Sun } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const NOTIFS = [
  { key: 'assignments', label: 'Info PR Baru', desc: 'Pemberitahuan saat guru menambahkan PR.' },
  { key: 'announcements', label: 'Pengumuman', desc: 'Pemberitahuan pengumuman kelas.' },
  { key: 'messages', label: 'Pesan Masuk', desc: 'Pemberitahuan chat dari teman sekelas.' },
]

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [notifs, setNotifs] = useState<Record<string, boolean>>({ assignments: true, announcements: true, messages: false })
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('x5-notifs')
    if (saved) {
      try { setNotifs(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [])

  const toggleNotif = (key: string, value: boolean) => {
    const next = { ...notifs, [key]: value }
    setNotifs(next)
    localStorage.setItem('x5-notifs', JSON.stringify(next))
    toast.success('Preferensi notifikasi disimpan.')
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pw.next.length < 8) return toast.error('Password baru minimal 8 karakter.')
    if (pw.next !== pw.confirm) return toast.error('Konfirmasi password tidak cocok.')
    setSaving(true)
    const supabase = createClient()
    if (supabase) {
      const { error } = await supabase.auth.updateUser({ password: pw.next })
      setSaving(false)
      if (error) return toast.error(error.message)
    } else {
      await new Promise((r) => setTimeout(r, 700))
      setSaving(false)
    }
    setPw({ current: '', next: '', confirm: '' })
    toast.success('Password berhasil diubah.')
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan" description="Sesuaikan tampilan, notifikasi, dan keamanan akunmu." />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Theme */}
        <Card glass>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4 text-primary" /> Tampilan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="mb-2.5 block text-sm">Mode Tema</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['dark', 'Gelap', Moon],
                ['light', 'Terang', Sun],
                ['system', 'Sistem', Monitor],
              ].map(([value, label, Icon]: any) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  aria-pressed={mounted && theme === value}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 text-sm font-medium transition-all',
                    mounted && theme === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-accent'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Mode gelap aktif secara default untuk kenyamanan mata saat malam hari.</p>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card glass>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-amber-500" /> Notifikasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {NOTIFS.map((n) => (
              <div key={n.key} className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card/40 p-3">
                <div className="min-w-0">
                  <Label htmlFor={`n-${n.key}`} className="cursor-pointer text-sm">{n.label}</Label>
                  <p className="text-xs text-muted-foreground">{n.desc}</p>
                </div>
                <Switch id={`n-${n.key}`} checked={!!notifs[n.key]} onCheckedChange={(v) => toggleNotif(n.key, v)} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Password */}
        <Card glass className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4 text-rose-500" /> Ubah Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="cur">Password Saat Ini</Label>
                <Input id="cur" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">Password Baru</Label>
                <Input id="new" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" placeholder="Min. 8 karakter" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conf">Konfirmasi</Label>
                <Input id="conf" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} autoComplete="new-password" placeholder="Ulangi password" required />
              </div>
              <div className="sm:col-span-3 flex justify-end">
                <Button type="submit" variant="gradient" disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</> : <><Save className="h-4 w-4" /> Simpan Password</>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security info */}
        <Card glass className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-emerald-500" /> Keamanan & Privasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {[
                'Data dilindungi Row Level Security (RLS) Supabase',
                'Kamu hanya bisa mengakses datamu sendiri',
                'Semua koneksi terenkripsi via HTTPS',
                'Password di-hash dan tidak pernah disimpan mentah',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2 rounded-xl border border-border/60 bg-card/40 p-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {t}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
