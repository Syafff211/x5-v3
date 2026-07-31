'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Crown, Mail, MessageSquare, Phone, Search, Users } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/shared/empty-state'
import { useAuthStore } from '@/store/auth-store'
import { useDataStore } from '@/store/data-store'
import { initials } from '@/lib/utils'

export default function FriendsPage() {
  const profile = useAuthStore((s) => s.profile)
  const students = useDataStore((s) => s.students)
  const organization = useDataStore((s) => s.organization)
  const [query, setQuery] = useState('')

  const roleFor = (id: string) => organization.find((o) => o.student_id === id)?.position

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students
      .filter((s) => s.role === 'student')
      .filter((s) => !q || s.full_name.toLowerCase().includes(q) || (s.nisn ?? '').includes(q))
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
  }, [students, query])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teman Sekelas"
        description={`${students.filter((s) => s.role === 'student').length} siswa di kelas X-5`}
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama atau NISN..." className="pl-9" aria-label="Cari teman" />
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Users} title="Tidak ditemukan" description="Coba kata kunci lain." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s, i) => {
            const position = roleFor(s.id)
            const isMe = s.id === profile?.id
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.4) }}>
                <Card glass className="h-full p-5 card-hover">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-14 w-14 shrink-0 ring-2 ring-primary/20">
                      {s.avatar_url && <AvatarImage src={s.avatar_url} alt={s.full_name} />}
                      <AvatarFallback>{initials(s.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="truncate font-semibold">{s.full_name}</h3>
                        {isMe && <Badge variant="outline" className="text-[10px]">Kamu</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">NISN {s.nisn}</p>
                      {position && (
                        <Badge className="mt-1.5 gap-1 text-[10px]">
                          <Crown className="h-2.5 w-2.5" /> {position}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{s.email}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{s.phone}</span>
                    </p>
                  </div>

                  {!isMe && (
                    <Button asChild size="sm" variant="outline" className="mt-4 w-full">
                      <Link href={`/dashboard/messages?to=${s.id}`}>
                        <MessageSquare className="h-4 w-4" /> Kirim Pesan
                      </Link>
                    </Button>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
