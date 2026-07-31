'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { MessageSquare, Search, Send, Users } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/store/auth-store'
import { nowIso, uid, useDataStore } from '@/store/data-store'
import { initials, relativeTime, sanitizeText } from '@/lib/utils'

export default function AdminMessagesPage() {
  const profile = useAuthStore((s) => s.profile)
  const students = useDataStore((s) => s.students)
  const messages = useDataStore((s) => s.messages)
  const add = useDataStore((s) => s.add)

  const [query, setQuery] = useState('')
  const [broadcast, setBroadcast] = useState('')
  const [selected, setSelected] = useState<string[]>([])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students
      .filter((s) => s.role === 'student')
      .filter((s) => !q || s.full_name.toLowerCase().includes(q))
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
  }, [students, query])

  const toggle = (id: string) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  function send() {
    const content = sanitizeText(broadcast, 1500)
    if (content.length < 3) return toast.error('Tulis pesan minimal 3 karakter.')
    const targets = selected.length ? selected : list.map((s) => s.id)
    targets.forEach((id) =>
      add('messages', {
        id: uid(),
        sender_id: profile?.id ?? 'admin-1',
        receiver_id: id,
        content,
        is_read: false,
        created_at: nowIso(),
      })
    )
    toast.success(`Pesan terkirim ke ${targets.length} siswa.`)
    setBroadcast('')
    setSelected([])
  }

  const recent = useMemo(
    () => [...messages].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 12),
    [messages]
  )
  const nameOf = (id: string) => students.find((s) => s.id === id)?.full_name ?? 'Admin'

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" description="Kirim pesan broadcast ke siswa dan pantau aktivitas chat kelas." />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card glass className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Send className="h-4 w-4 text-primary" /> Broadcast Pesan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bc">Isi Pesan</Label>
              <Textarea id="bc" value={broadcast} onChange={(e) => setBroadcast(e.target.value)} maxLength={1500} className="min-h-28" placeholder="Tulis pesan untuk siswa..." />
              <p className="text-right text-[11px] text-muted-foreground">{broadcast.length}/1500</p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Penerima {selected.length > 0 ? `(${selected.length} dipilih)` : '(semua siswa)'}</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelected(list.map((s) => s.id))}>Pilih semua</Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelected([])}>Bersihkan</Button>
                </div>
              </div>
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari siswa..." className="h-9 pl-9" aria-label="Cari siswa" />
              </div>
              <div className="max-h-56 space-y-1 overflow-y-auto pr-1 scrollbar-thin">
                {list.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
                      selected.includes(s.id) ? 'border-primary bg-primary/10' : 'border-border/60 hover:bg-accent/50'
                    }`}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      {s.avatar_url && <AvatarImage src={s.avatar_url} alt="" />}
                      <AvatarFallback className="text-[10px]">{initials(s.full_name)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate text-sm">{s.full_name}</span>
                    {selected.includes(s.id) && <Badge className="shrink-0 text-[10px]">Dipilih</Badge>}
                  </button>
                ))}
              </div>
            </div>

            <Button variant="gradient" className="w-full" onClick={send}>
              <Send className="h-4 w-4" /> Kirim ke {selected.length || list.length} Siswa
            </Button>
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4 text-fuchsia-500" /> Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recent.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Belum ada aktivitas chat.</p>}
            {recent.map((m) => (
              <div key={m.id} className="rounded-xl border border-border/60 bg-card/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-medium">{nameOf(m.sender_id)} → {nameOf(m.receiver_id)}</p>
                  {!m.is_read && <Badge variant="warning" className="shrink-0 text-[9px]">Baru</Badge>}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{m.content}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">{relativeTime(m.created_at)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card glass>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-emerald-500" /> Statistik Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ['Total Pesan', messages.length],
              ['Belum Dibaca', messages.filter((m) => !m.is_read).length],
              ['Siswa Aktif', new Set(messages.map((m) => m.sender_id)).size],
              ['Hari Ini', messages.filter((m) => m.created_at.slice(0, 10) === new Date().toISOString().slice(0, 10)).length],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-border/60 bg-card/40 p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
