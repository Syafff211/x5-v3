'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  CalendarCheck,
  GraduationCap,
  HelpCircle,
  MessageCircleMore,
  Send,
  Shield,
  Sparkles,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Pesan {
  dari: 'bot' | 'user'
  teks: string
  aksi?: { label: string; href: string }[]
}

const SAPAAN: Pesan = {
  dari: 'bot',
  teks: 'Halo! Aku Asisten X-5. Ada yang bisa kubantu seputar kelas ini?',
}

const CEPAT = [
  { icon: GraduationCap, label: 'Cara login siswa' },
  { icon: CalendarCheck, label: 'Lihat kehadiran' },
  { icon: BookOpen, label: 'Cek Info PR' },
  { icon: Shield, label: 'Login admin' },
]

/** Jawaban sederhana berbasis kata kunci — tanpa panggilan API. */
function jawab(tanya: string): Pesan {
  const t = tanya.toLowerCase()

  if (t.includes('login') && (t.includes('admin') || t.includes('guru') || t.includes('wali'))) {
    return {
      dari: 'bot',
      teks: 'Pengurus kelas masuk lewat halaman Login Admin. Wali kelas dengan akses penuh memakai halaman Super Admin.',
      aksi: [
        { label: 'Login Admin', href: '/auth/admin' },
        { label: 'Login Super Admin', href: '/auth/s/admin' },
      ],
    }
  }
  if (t.includes('login') || t.includes('masuk') || t.includes('daftar') || t.includes('akun')) {
    return {
      dari: 'bot',
      teks: 'Siswa masuk memakai email sekolah dan password yang dibagikan wali kelas. Lupa password? Ada tautan "Lupa password?" di halaman login.',
      aksi: [
        { label: 'Login Siswa', href: '/auth/login' },
        { label: 'Lupa Password', href: '/auth/forgot-password' },
      ],
    }
  }
  if (t.includes('hadir') || t.includes('absen') || t.includes('kehadiran')) {
    return {
      dari: 'bot',
      teks: 'Absensi diisi sendiri tiap hari lewat menu Kehadiran: pilih Hadir, Terlambat, Izin, Sakit, atau Alpa. Riwayat dan persentasenya langsung terlihat.',
      aksi: [{ label: 'Buka Kehadiran', href: '/dashboard/attendance' }],
    }
  }
  if (t.includes('pr') || t.includes('tugas')) {
    return {
      dari: 'bot',
      teks: 'Semua PR ada di menu Info PR — lengkap dengan mata pelajaran dan tenggatnya. Pengumpulan dilakukan langsung ke guru sesuai arahan masing-masing.',
      aksi: [{ label: 'Buka Info PR', href: '/dashboard/assignments' }],
    }
  }
  if (t.includes('jadwal')) {
    return {
      dari: 'bot',
      teks: 'Jadwal Pelajaran menampilkan mata pelajaran, jam, ruang, dan guru pengampu untuk tiap hari.',
      aksi: [{ label: 'Lihat Jadwal', href: '/dashboard/schedule' }],
    }
  }
  if (t.includes('galeri') || t.includes('foto')) {
    return { dari: 'bot', teks: 'Dokumentasi kegiatan kelas ada di bagian Galeri pada halaman ini. Klik fotonya untuk melihat ukuran penuh.' }
  }
  if (t.includes('pengurus') || t.includes('organisasi') || t.includes('ketua')) {
    return { dari: 'bot', teks: 'Susunan pengurus kelas bisa dilihat di bagian Struktur Organisasi, tepat di bawah galeri.' }
  }
  if (t.includes('chat') || t.includes('pesan') || t.includes('teman')) {
    return {
      dari: 'bot',
      teks: 'Menu Messages memungkinkan kamu mengobrol dengan teman sekelas secara langsung, lengkap dengan indikator mengetik dan tanda dibaca.',
      aksi: [{ label: 'Buka Messages', href: '/dashboard/messages' }],
    }
  }
  if (t.includes('terima kasih') || t.includes('makasih') || t.includes('thanks')) {
    return { dari: 'bot', teks: 'Sama-sama! Semangat belajarnya ya.' }
  }

  return {
    dari: 'bot',
    teks: 'Maaf, aku belum paham maksudnya. Coba tanyakan soal login, kehadiran, Info PR, jadwal, galeri, atau pengurus kelas.',
    aksi: [{ label: 'Login Siswa', href: '/auth/login' }],
  }
}

/** Tautan pintasan yang relevan dengan pertanyaan, dilampirkan ke jawaban AI. */
function tautanTerkait(tanya: string): Pesan['aksi'] {
  const t = tanya.toLowerCase()
  if (t.includes('admin') && t.includes('login')) return [{ label: 'Login Admin', href: '/auth/admin' }]
  if (t.includes('login') || t.includes('masuk') || t.includes('akun')) return [{ label: 'Login Siswa', href: '/auth/login' }]
  if (t.includes('hadir') || t.includes('absen')) return [{ label: 'Buka Kehadiran', href: '/dashboard/attendance' }]
  if (t.includes('pr') || t.includes('tugas')) return [{ label: 'Buka Info PR', href: '/dashboard/assignments' }]
  if (t.includes('jadwal')) return [{ label: 'Lihat Jadwal', href: '/dashboard/schedule' }]
  return undefined
}

export function FloatingAssistant() {
  const [buka, setBuka] = useState(false)
  const [pesan, setPesan] = useState<Pesan[]>([SAPAAN])
  const [teks, setTeks] = useState('')
  const [mengetik, setMengetik] = useState(false)
  const [adaNotif, setAdaNotif] = useState(true)
  const akhirRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    akhirRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [pesan, mengetik])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setBuka(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const kirim = async (isi: string) => {
    const bersih = isi.trim()
    if (!bersih || mengetik) return

    const riwayatBaru: Pesan[] = [...pesan, { dari: 'user', teks: bersih }]
    setPesan(riwayatBaru)
    setTeks('')
    setMengetik(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pesan: bersih,
          riwayat: riwayatBaru
            .slice(-7, -1)
            .map((m) => ({ role: m.dari === 'user' ? 'user' : 'assistant', content: m.teks })),
        }),
      })

      const data = await res.json().catch(() => null)

      if (data?.fallback) {
        setMengetik(false)
        setPesan((p) => [...p, jawab(bersih)])
        return
      }

      if (res.ok && data?.jawaban) {
        setMengetik(false)
        setPesan((p) => [...p, { dari: 'bot', teks: data.jawaban, aksi: tautanTerkait(bersih) }])
        return
      }

      if (res.status === 429 && data?.error) {
        setMengetik(false)
        setPesan((p) => [...p, { dari: 'bot', teks: data.error }])
        return
      }

      setMengetik(false)
      setPesan((p) => [...p, jawab(bersih)])
    } catch {
      setMengetik(false)
      setPesan((p) => [...p, jawab(bersih)])
    }
  }

  return (
    <>
      {/* Tombol mengambang */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 220, damping: 18 }}
        onClick={() => {
          setBuka((v) => !v)
          setAdaNotif(false)
        }}
        aria-label={buka ? 'Tutup asisten' : 'Buka asisten kelas'}
        aria-expanded={buka}
        className={cn(
          'group fixed bottom-5 right-5 z-[80] grid h-14 w-14 place-items-center rounded-2xl',
          'brand-gradient text-white shadow-xl shadow-primary/30',
          'transition-transform duration-200 hover:scale-110 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
        )}
      >
        {/* denyut halus */}
        {!buka && <span className="absolute inset-0 rounded-2xl brand-gradient opacity-60 motion-safe:animate-ping" style={{ animationDuration: '2.5s' }} />}
        <span className="relative">
          {buka ? <X className="h-6 w-6" /> : <MessageCircleMore className="h-6 w-6" />}
        </span>
        {adaNotif && !buka && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-background bg-rose-500 text-[10px] font-bold text-white">
            1
          </span>
        )}
      </motion.button>

      {/* Panel percakapan */}
      <AnimatePresence>
        {buka && (
          <motion.div
            key="assistant-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-label="Asisten Kelas X-5"
            className="fixed bottom-24 right-5 z-[80] flex h-[30rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
          >
            {/* Kepala */}
            <div className="relative overflow-hidden brand-gradient px-4 py-3.5 text-white">
              <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/20 backdrop-blur">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Asisten Kelas X-5</p>
                  <p className="flex items-center gap-1.5 text-[11px] text-white/85">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    Siap membantu
                  </p>
                </div>
                <button
                  onClick={() => setBuka(false)}
                  aria-label="Tutup"
                  className="rounded-lg p-1.5 transition-colors hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Isi percakapan */}
            <div className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-3.5 scrollbar-thin">
              {pesan.map((m, i) => (
                <div key={i} className={cn('flex', m.dari === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className="max-w-[85%]">
                    <div
                      className={cn(
                        'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm',
                        m.dari === 'user'
                          ? 'rounded-br-md brand-gradient text-white'
                          : 'rounded-bl-md border border-border bg-card'
                      )}
                    >
                      {m.teks}
                    </div>
                    {m.aksi && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.aksi.map((a) => (
                          <Button key={a.href} asChild size="sm" variant="outline" className="h-7 rounded-lg text-[11px]">
                            <Link href={a.href}>{a.label}</Link>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {mengetik && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-card px-3.5 py-3">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                        animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Pertanyaan cepat, hanya di awal */}
              {pesan.length === 1 && !mengetik && (
                <div className="space-y-1.5 pt-1">
                  <p className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
                    <HelpCircle className="h-3 w-3" /> Pertanyaan populer
                  </p>
                  {CEPAT.map((c) => (
                    <button
                      key={c.label}
                      onClick={() => kirim(c.label)}
                      className="flex w-full items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 text-left text-xs transition-colors hover:border-primary/40 hover:bg-accent"
                    >
                      <c.icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
              <div ref={akhirRef} />
            </div>

            {/* Masukan */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                kirim(teks)
              }}
              className="flex items-center gap-2 border-t border-border bg-card p-2.5"
            >
              <input
                value={teks}
                onChange={(e) => setTeks(e.target.value)}
                placeholder="Tulis pertanyaan..."
                aria-label="Tulis pertanyaan"
                maxLength={200}
                className="h-10 flex-1 rounded-xl border border-input bg-background/50 px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button type="submit" size="icon" variant="gradient" disabled={!teks.trim()} aria-label="Kirim">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
