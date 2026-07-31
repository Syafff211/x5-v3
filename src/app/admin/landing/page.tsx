'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ExternalLink, Eye, Layout, RotateCcw, Save } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLandingStore } from '@/store/landing-store'
import { sanitizeText } from '@/lib/utils'

export default function AdminLandingPage() {
  const content = useLandingStore((s) => s.content)
  const updateStore = useLandingStore((s) => s.update)
  const reset = useLandingStore((s) => s.reset)
  const [draft, setDraft] = useState(content)

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => setDraft((d) => ({ ...d, [key]: value }))

  function save() {
    updateStore({
      ...draft,
      hero_title: sanitizeText(draft.hero_title, 100),
      hero_subtitle: sanitizeText(draft.hero_subtitle, 400),
      hero_badge: sanitizeText(draft.hero_badge, 100),
      footer_text: sanitizeText(draft.footer_text, 300),
    })
    toast.success('Landing page diperbarui. Buka beranda untuk melihat hasilnya.')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Landing CMS"
        description="Edit konten halaman utama tanpa menyentuh kode."
        action={
          <>
            <Button variant="outline" size="sm" onClick={() => { reset(); setDraft(useLandingStore.getState().content); toast.success('Konten dikembalikan ke default.') }}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/" target="_blank"><ExternalLink className="h-4 w-4" /> Buka Beranda</Link>
            </Button>
            <Button variant="gradient" size="sm" onClick={save}><Save className="h-4 w-4" /> Simpan</Button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Editor */}
        <Tabs defaultValue="hero">
          <TabsList className="w-full">
            <TabsTrigger value="hero" className="flex-1">Hero</TabsTrigger>
            <TabsTrigger value="stats" className="flex-1">Statistik</TabsTrigger>
            <TabsTrigger value="features" className="flex-1">Fitur</TabsTrigger>
            <TabsTrigger value="footer" className="flex-1">Footer</TabsTrigger>
          </TabsList>

          <TabsContent value="hero">
            <Card glass>
              <CardHeader><CardTitle className="text-base">Hero Section</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="h-badge">Badge</Label>
                  <Input id="h-badge" value={draft.hero_badge} onChange={(e) => set('hero_badge', e.target.value)} maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="h-title">Judul Utama</Label>
                  <Input id="h-title" value={draft.hero_title} onChange={(e) => set('hero_title', e.target.value)} maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="h-sub">Subjudul</Label>
                  <Textarea id="h-sub" value={draft.hero_subtitle} onChange={(e) => set('hero_subtitle', e.target.value)} maxLength={400} className="min-h-24" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="h-cta1">Tombol Utama</Label>
                    <Input id="h-cta1" value={draft.cta_primary} onChange={(e) => set('cta_primary', e.target.value)} maxLength={40} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="h-cta2">Tombol Kedua</Label>
                    <Input id="h-cta2" value={draft.cta_secondary} onChange={(e) => set('cta_secondary', e.target.value)} maxLength={40} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card glass>
              <CardHeader><CardTitle className="text-base">Statistik (4 kartu)</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {draft.stats.map((s, i) => (
                  <div key={i} className="grid gap-2 rounded-xl border border-border/60 bg-card/40 p-3 sm:grid-cols-[1fr_90px_70px]">
                    <Input
                      value={s.label}
                      onChange={(e) => set('stats', draft.stats.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                      placeholder="Label"
                      aria-label={`Label statistik ${i + 1}`}
                    />
                    <Input
                      type="number"
                      value={s.value}
                      onChange={(e) => set('stats', draft.stats.map((x, j) => (j === i ? { ...x, value: Number(e.target.value) } : x)))}
                      placeholder="Nilai"
                      aria-label={`Nilai statistik ${i + 1}`}
                    />
                    <Input
                      value={s.suffix}
                      onChange={(e) => set('stats', draft.stats.map((x, j) => (j === i ? { ...x, suffix: e.target.value } : x)))}
                      placeholder="%"
                      maxLength={3}
                      aria-label={`Suffix statistik ${i + 1}`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card glass>
              <CardHeader><CardTitle className="text-base">Kartu Fitur</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {draft.features.map((f, i) => (
                  <div key={i} className="space-y-2 rounded-xl border border-border/60 bg-card/40 p-3">
                    <Input
                      value={f.title}
                      onChange={(e) => set('features', draft.features.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                      placeholder="Judul fitur"
                      aria-label={`Judul fitur ${i + 1}`}
                    />
                    <Textarea
                      value={f.description}
                      onChange={(e) => set('features', draft.features.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))}
                      placeholder="Deskripsi fitur"
                      maxLength={200}
                      aria-label={`Deskripsi fitur ${i + 1}`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="footer">
            <Card glass>
              <CardHeader><CardTitle className="text-base">Footer</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="f-text">Teks Footer</Label>
                  <Textarea id="f-text" value={draft.footer_text} onChange={(e) => set('footer_text', e.target.value)} maxLength={300} className="min-h-24" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Live preview */}
        <Card glass className="h-fit xl:sticky xl:top-6">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4 text-primary" /> Live Preview
            </CardTitle>
            <Badge variant="outline">Real-time</Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-border">
              {/* Hero preview */}
              <div className="relative bg-gradient-to-br from-indigo-950 via-slate-950 to-fuchsia-950 px-5 py-10 text-center">
                <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-fuchsia-500/30 blur-3xl" />
                <div className="relative">
                  <span className="inline-block rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] text-white/90 backdrop-blur">
                    {draft.hero_badge}
                  </span>
                  <h2 className="mt-3 bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-xl font-extrabold text-transparent">
                    {draft.hero_title}
                  </h2>
                  <p className="mx-auto mt-2 max-w-xs text-[11px] leading-relaxed text-white/70">{draft.hero_subtitle}</p>
                  <div className="mt-4 flex justify-center gap-2">
                    <span className="rounded-lg brand-gradient px-3 py-1.5 text-[10px] font-medium text-white">{draft.cta_primary}</span>
                    <span className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-medium text-white">{draft.cta_secondary}</span>
                  </div>
                </div>
              </div>

              {/* Stats preview */}
              <div className="grid grid-cols-4 gap-2 border-t border-border bg-card p-4">
                {draft.stats.map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-base font-bold text-primary">{s.value}{s.suffix}</p>
                    <p className="mt-0.5 truncate text-[9px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Features preview */}
              <div className="grid grid-cols-3 gap-2 border-t border-border bg-card p-4">
                {draft.features.slice(0, 6).map((f, i) => (
                  <div key={i} className="rounded-lg border border-border/60 p-2">
                    <div className="mb-1 h-5 w-5 rounded brand-gradient" />
                    <p className="truncate text-[10px] font-semibold">{f.title}</p>
                    <p className="line-clamp-2 text-[9px] text-muted-foreground">{f.description}</p>
                  </div>
                ))}
              </div>

              {/* Footer preview */}
              <div className="border-t border-border bg-card px-4 py-3 text-center">
                <p className="text-[10px] text-muted-foreground">{draft.footer_text}</p>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Layout className="h-3.5 w-3.5" /> Klik Simpan untuk menerapkan ke halaman utama.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
