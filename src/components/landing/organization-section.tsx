'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Crown, Network, Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useDataStore } from '@/store/data-store'
import { cn, initials } from '@/lib/utils'

/** Warna aksen per jabatan agar hierarki mudah dibaca sekilas. */
const AKSEN: Record<string, string> = {
  'Ketua Kelas': 'from-amber-500 to-orange-500',
  'Wakil Ketua': 'from-indigo-500 to-violet-500',
  Sekretaris: 'from-sky-500 to-blue-500',
  Bendahara: 'from-emerald-500 to-teal-500',
}
const AKSEN_DEFAULT = 'from-fuchsia-500 to-pink-500'

export function OrganizationSection() {
  const organization = useDataStore((s) => s.organization)
  const students = useDataStore((s) => s.students)

  const pengurus = useMemo(
    () =>
      [...organization]
        .sort((a, b) => a.order - b.order)
        .map((o) => {
          // Tiga sumber nama, dicoba berurutan:
          //   1. hasil join dari server (paling andal),
          //   2. pencocokan manual ke daftar siswa,
          //   3. baru menyerah.
          const siswa = o.student_id
            ? students.find((s) => s.id === o.student_id)
            : undefined
          return {
            id: o.id,
            position: o.position,
            nama: o.profiles?.full_name ?? siswa?.full_name ?? null,
            avatar: o.profiles?.avatar_url ?? siswa?.avatar_url ?? null,
          }
        })
        // Jabatan yang siswanya belum diisi tidak perlu dipajang ke pengunjung.
        .filter((p) => !!p.nama) as { id: string; position: string; nama: string; avatar: string | null }[],
    [organization, students]
  )

  if (pengurus.length === 0) return null

  const inti = pengurus.slice(0, 4)
  const seksi = pengurus.slice(4)

  return (
    <section id="organisasi" className="relative px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <Badge variant="outline" className="mb-4 gap-1.5">
            <Network className="h-3.5 w-3.5" />
            Struktur Organisasi
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Pengurus <span className="text-gradient">Kelas X-5</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Mereka yang menjaga kelas tetap tertib, kompak, dan berjalan lancar setiap hari.
          </p>
        </motion.div>

        {/* Pengurus inti */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {inti.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Card
                glass
                className="group relative h-full overflow-hidden p-6 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40"
              >
                <div
                  className={cn(
                    'pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity group-hover:opacity-40',
                    AKSEN[p.position] ?? AKSEN_DEFAULT
                  )}
                />
                <div className="relative">
                  <div className="relative mx-auto w-fit">
                    <Avatar className="h-20 w-20 ring-2 ring-primary/25 transition-transform duration-300 group-hover:scale-105">
                      {p.avatar && <AvatarImage src={p.avatar} alt={p.nama} />}
                      <AvatarFallback className="text-lg">{initials(p.nama)}</AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        'absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-background bg-gradient-to-br text-white shadow-lg',
                        AKSEN[p.position] ?? AKSEN_DEFAULT
                      )}
                    >
                      <Crown className="h-3.5 w-3.5" />
                    </span>
                  </div>

                  <h3 className="mt-4 text-sm font-semibold leading-snug">{p.nama}</h3>
                  <Badge
                    className={cn(
                      'mt-2 border-transparent bg-gradient-to-r text-white',
                      AKSEN[p.position] ?? AKSEN_DEFAULT
                    )}
                  >
                    {p.position}
                  </Badge>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Seksi pendukung */}
        {seksi.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <Card glass className="p-6">
              <p className="mb-4 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                Seksi Pendukung
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {seksi.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2.5 rounded-full border border-border/60 bg-card/50 py-1.5 pl-1.5 pr-4 transition-colors hover:border-primary/40"
                  >
                    <Avatar className="h-8 w-8">
                      {p.avatar && <AvatarImage src={p.avatar} alt={p.nama} />}
                      <AvatarFallback className="text-[10px]">{initials(p.nama)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium leading-tight">{p.nama}</p>
                      <p className="truncate text-[10px] leading-tight text-muted-foreground">{p.position}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </section>
  )
}
