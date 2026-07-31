'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Check, Code2, Palette, RotateCcw, Save } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { hexToHsl, hslToHex, useThemeStore } from '@/store/theme-store'
import { cn } from '@/lib/utils'

const PRESETS = [
  { name: 'Indigo', primary: '#6366f1', secondary: '#a855f7' },
  { name: 'Violet', primary: '#8b5cf6', secondary: '#d946ef' },
  { name: 'Emerald', primary: '#10b981', secondary: '#14b8a6' },
  { name: 'Rose', primary: '#f43f5e', secondary: '#ec4899' },
  { name: 'Amber', primary: '#f59e0b', secondary: '#f97316' },
  { name: 'Sky', primary: '#0ea5e9', secondary: '#6366f1' },
]

const RADII = [
  { label: 'Tajam', value: '0.25rem' },
  { label: 'Sedang', value: '0.5rem' },
  { label: 'Bulat', value: '0.75rem' },
  { label: 'Sangat Bulat', value: '1rem' },
]

const SAMPLE_CSS = `/* Contoh: efek glow ekstra pada kartu */
.card-hover:hover {
  box-shadow: 0 20px 60px -20px hsl(var(--primary) / 0.6);
}`

export default function AdminThemePage() {
  const store = useThemeStore()
  const [primaryHex, setPrimaryHex] = useState('#6366f1')
  const [secondaryHex, setSecondaryHex] = useState('#a855f7')
  const [radius, setRadius] = useState(store.radius)
  const [css, setCss] = useState(store.customCss)

  useEffect(() => {
    setPrimaryHex(hslToHex(store.primary))
    setSecondaryHex(hslToHex(store.secondary))
    setRadius(store.radius)
    setCss(store.customCss)
  }, [store.primary, store.secondary, store.radius, store.customCss])

  // Live preview while editing
  useEffect(() => {
    document.documentElement.style.setProperty('--primary', hexToHsl(primaryHex))
  }, [primaryHex])
  useEffect(() => {
    document.documentElement.style.setProperty('--secondary', hexToHsl(secondaryHex))
  }, [secondaryHex])
  useEffect(() => {
    document.documentElement.style.setProperty('--radius', radius)
  }, [radius])

  function save() {
    store.setPrimary(hexToHsl(primaryHex))
    store.setSecondary(hexToHsl(secondaryHex))
    store.setRadius(radius)
    store.setCustomCss(css)
    toast.success('Tema berhasil disimpan dan diterapkan.')
  }

  function resetAll() {
    store.reset()
    toast.success('Tema dikembalikan ke default.')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Theme & CSS"
        description="Sesuaikan warna, sudut membulat, dan CSS kustom aplikasi."
        action={
          <>
            <Button variant="outline" size="sm" onClick={resetAll}><RotateCcw className="h-4 w-4" /> Reset</Button>
            <Button variant="gradient" size="sm" onClick={save}><Save className="h-4 w-4" /> Simpan Tema</Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Colors */}
        <Card glass>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Palette className="h-4 w-4 text-primary" /> Warna</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label className="mb-2.5 block">Preset Cepat</Label>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((p) => {
                  const active = primaryHex.toLowerCase() === p.primary.toLowerCase()
                  return (
                    <button
                      key={p.name}
                      onClick={() => { setPrimaryHex(p.primary); setSecondaryHex(p.secondary) }}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border-2 p-2.5 text-xs font-medium transition-all',
                        active ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'
                      )}
                    >
                      <span className="h-6 w-6 shrink-0 rounded-lg" style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})` }} />
                      <span className="truncate">{p.name}</span>
                      {active && <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-primary" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="c-primary">Warna Primary</Label>
                <div className="flex gap-2">
                  <input
                    id="c-primary"
                    type="color"
                    value={primaryHex}
                    onChange={(e) => setPrimaryHex(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-input bg-transparent p-1"
                  />
                  <Input value={primaryHex} onChange={(e) => setPrimaryHex(e.target.value)} className="font-mono text-xs" maxLength={7} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-secondary">Warna Secondary</Label>
                <div className="flex gap-2">
                  <input
                    id="c-secondary"
                    type="color"
                    value={secondaryHex}
                    onChange={(e) => setSecondaryHex(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-input bg-transparent p-1"
                  />
                  <Input value={secondaryHex} onChange={(e) => setSecondaryHex(e.target.value)} className="font-mono text-xs" maxLength={7} />
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-2.5 block">Sudut Membulat</Label>
              <div className="grid grid-cols-4 gap-2">
                {RADII.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRadius(r.value)}
                    className={cn(
                      'border-2 p-2.5 text-xs font-medium transition-all',
                      radius === r.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent'
                    )}
                    style={{ borderRadius: r.value }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card glass>
          <CardHeader><CardTitle className="text-base">Preview Komponen</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="default" size="sm">Primary</Button>
              <Button variant="gradient" size="sm">Gradient</Button>
              <Button variant="outline" size="sm">Outline</Button>
              <Button variant="ghost" size="sm">Ghost</Button>
              <Button variant="destructive" size="sm">Hapus</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Sukses</Badge>
              <Badge variant="warning">Peringatan</Badge>
              <Badge variant="destructive">Bahaya</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
            <div className="rounded-2xl brand-gradient p-5 text-white">
              <p className="text-sm font-semibold">Banner Gradient</p>
              <p className="mt-1 text-xs text-white/80">Menggunakan warna primary dan secondary.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prev-input">Contoh Input</Label>
              <Input id="prev-input" placeholder="Ketik sesuatu..." />
            </div>
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <p className="text-sm font-medium">Kartu dengan border radius</p>
              <p className="mt-1 text-xs text-muted-foreground">Radius saat ini: {radius}</p>
            </div>
          </CardContent>
        </Card>

        {/* Custom CSS */}
        <Card glass className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base"><Code2 className="h-4 w-4 text-fuchsia-500" /> Custom CSS</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setCss(SAMPLE_CSS)}>Sisipkan Contoh</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={css}
              onChange={(e) => setCss(e.target.value)}
              placeholder="/* Tulis CSS kustom di sini */"
              className="min-h-48 font-mono text-xs"
              spellCheck={false}
              aria-label="Editor CSS kustom"
            />
            <p className="text-xs text-muted-foreground">
              CSS akan disuntikkan ke seluruh halaman setelah disimpan. Variabel yang tersedia:{' '}
              <code className="rounded bg-muted px-1 py-0.5">--primary</code>,{' '}
              <code className="rounded bg-muted px-1 py-0.5">--secondary</code>,{' '}
              <code className="rounded bg-muted px-1 py-0.5">--radius</code>,{' '}
              <code className="rounded bg-muted px-1 py-0.5">--background</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
