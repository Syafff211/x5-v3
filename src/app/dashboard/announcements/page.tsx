'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Pin, Search } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/shared/empty-state'
import { useDataStore } from '@/store/data-store'
import { cn, formatDate, relativeTime } from '@/lib/utils'

export default function AnnouncementsPage() {
  const announcements = useDataStore((s) => s.announcements)
  const [query, setQuery] = useState('')

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...announcements]
      .filter((a) => !q || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q))
      .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned) || +new Date(b.created_at) - +new Date(a.created_at))
  }, [announcements, query])

  return (
    <div className="space-y-6">
      <PageHeader title="Pengumuman" description="Informasi terbaru dari wali kelas dan pengurus kelas." />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari pengumuman..." className="pl-9" aria-label="Cari pengumuman" />
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Megaphone} title="Tidak ada pengumuman" description="Belum ada pengumuman yang cocok dengan pencarianmu." />
      ) : (
        <div className="space-y-4">
          {list.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.06, 0.4) }}>
              <Card
                glass
                className={cn(
                  'relative overflow-hidden p-5 transition-colors sm:p-6',
                  a.is_pinned && 'border-amber-500/30 bg-amber-500/[0.04]'
                )}
              >
                {a.is_pinned && <div className="absolute inset-y-0 left-0 w-1 bg-amber-500" />}
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <div
                    className={cn(
                      'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                      a.is_pinned ? 'bg-amber-500/15 text-amber-500' : 'bg-primary/10 text-primary'
                    )}
                  >
                    {a.is_pinned ? <Pin className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />}
                  </div>
                  <h2 className="min-w-0 flex-1 text-base font-semibold sm:text-lg">{a.title}</h2>
                  {a.is_pinned && (
                    <Badge variant="warning" className="gap-1">
                      <Pin className="h-3 w-3" /> Penting
                    </Badge>
                  )}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{a.content}</p>
                <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <span>{formatDate(a.created_at, true)}</span>
                  <span>·</span>
                  <span>{relativeTime(a.created_at)}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
