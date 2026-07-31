'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  Images,
  Instagram,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  Shield,
  Sparkles,
  Users,
  Youtube,
  Github,
  BookOpen,
  TrendingUp,
  CalendarDays,
  UserCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FeatureCard } from '@/components/shared/feature-card'
import { AnimatedCounter } from '@/components/shared/animated-counter'
import { ParticlesBackground } from '@/components/shared/particles-background'
import { GradientOrbs } from '@/components/shared/gradient-orbs'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { useLandingStore } from '@/store/landing-store'

const ICONS: Record<string, any> = {
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  MessageSquare,
  Images,
  Megaphone,
  BookOpen,
  TrendingUp,
  CalendarDays,
  UserCircle,
  Users,
  Shield,
}

export function LandingPage() {
  const content = useLandingStore((s) => s.content)

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background">
      {/* ---------- NAVBAR ---------- */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto mt-3 w-[min(100%-1.5rem,72rem)]">
          <nav className="glass-strong flex items-center justify-between rounded-2xl px-4 py-2.5 shadow-lg">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Beranda X-5">
              <div className="grid h-9 w-9 place-items-center rounded-xl brand-gradient text-sm font-bold text-white shadow-lg shadow-primary/30">
                X5
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-tight">X-5 SMAN 1 Purbalingga</p>
                <p className="text-[11px] leading-tight text-muted-foreground">Kelas Digital</p>
              </div>
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {[
                ['Fitur', '#fitur'],
                ['Statistik', '#statistik'],
                ['Tentang', '#tentang'],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
                <Link href="/auth/admin">Admin</Link>
              </Button>
              <Button asChild size="sm" variant="gradient">
                <Link href="/auth/login">
                  Masuk <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main id="main">
        {/* ---------- HERO ---------- */}
        <section className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 pb-20 pt-32">
          <GradientOrbs />
          <ParticlesBackground />
          <div className="pointer-events-none absolute inset-0 bg-grid-dark bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />

          <div className="relative mx-auto max-w-4xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge className="mb-6 gap-1.5 border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                {content.hero_badge}
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-balance text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl"
            >
              <span className="text-gradient">{content.hero_title}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
            >
              {content.hero_subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Button asChild size="lg" variant="gradient" className="w-full sm:w-auto">
                <Link href="/auth/login">
                  <GraduationCap className="h-5 w-5" />
                  {content.cta_primary}
                </Link>
              </Button>
              <Button asChild size="lg" variant="glass" className="w-full sm:w-auto">
                <Link href="/auth/admin">
                  <Shield className="h-5 w-5" />
                  {content.cta_secondary}
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground"
            >
              {['Real-time', 'PWA & Offline', 'Aman dengan RLS', 'Responsif'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {t}
                </span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ---------- FEATURES ---------- */}
        <section id="fitur" className="relative px-4 py-24">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mx-auto mb-14 max-w-2xl text-center"
            >
              <Badge variant="outline" className="mb-4">
                Fitur Unggulan
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Semua kebutuhan kelas, <span className="text-gradient">satu platform</span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                Dirancang untuk memudahkan siswa dan wali kelas mengelola kegiatan belajar sehari-hari.
              </p>
            </motion.div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {content.features.map((f, i) => (
                <FeatureCard
                  key={f.title}
                  icon={ICONS[f.icon] ?? Sparkles}
                  title={f.title}
                  description={f.description}
                  delay={i * 0.08}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ---------- STATS ---------- */}
        <section id="statistik" className="relative px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="glass-strong relative overflow-hidden rounded-3xl p-8 sm:p-12">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-[90px]" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-[90px]" />
              <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {content.stats.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="text-center"
                  >
                    <p className="text-4xl font-extrabold tracking-tight text-gradient sm:text-5xl">
                      <AnimatedCounter value={s.value} suffix={s.suffix} />
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------- ABOUT / CTA ---------- */}
        <section id="tentang" className="relative px-4 py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <Badge variant="outline" className="mb-4">
                Tentang Kelas
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Kelas X-5, <span className="text-gradient">solid dan berprestasi</span>
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Kami adalah 32 siswa kelas X-5 SMAN 1 Purbalingga yang percaya bahwa belajar jadi lebih menyenangkan
                ketika terorganisir dengan baik. Platform ini kami gunakan setiap hari untuk absensi, mengumpulkan
                tugas, melihat nilai, dan tetap terhubung satu sama lain.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  ['Absensi digital tanpa kertas', CalendarCheck],
                  ['Tugas & materi terpusat, tidak tercecer', ClipboardList],
                  ['Transparansi nilai untuk siswa & orang tua', GraduationCap],
                ].map(([text, Icon]: any) => (
                  <li key={text} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm text-muted-foreground">{text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="gradient">
                  <Link href="/auth/login">
                    Mulai Sekarang <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="glass-strong rounded-3xl p-6">
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500/70" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/70" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
                  <span className="ml-2 text-xs text-muted-foreground">dashboard · x-5</span>
                </div>
                <div className="space-y-3">
                  {[
                    ['Kehadiran hari ini', '30 / 32 siswa', 'bg-emerald-500'],
                    ['Tugas aktif', '5 tugas', 'bg-indigo-500'],
                    ['Rata-rata nilai', '87.4', 'bg-fuchsia-500'],
                    ['Pesan belum dibaca', '2 pesan', 'bg-amber-500'],
                  ].map(([label, val, color], i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex items-center justify-between rounded-xl border border-border/60 bg-card/50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`h-2 w-2 rounded-full ${color}`} />
                        <span className="text-sm text-muted-foreground">{label}</span>
                      </div>
                      <span className="text-sm font-semibold">{val}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ---------- FOOTER ---------- */}
      <footer className="relative border-t border-border/60 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="grid h-10 w-10 place-items-center rounded-xl brand-gradient font-bold text-white">X5</div>
                <div>
                  <p className="font-semibold">X-5 SMAN 1 Purbalingga</p>
                  <p className="text-xs text-muted-foreground">Platform Kelas Digital</p>
                </div>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{content.footer_text}</p>
              <div className="mt-5 flex gap-2">
                {[
                  [Instagram, 'Instagram', 'https://instagram.com'],
                  [Youtube, 'YouTube', 'https://youtube.com'],
                  [Github, 'GitHub', 'https://github.com'],
                  [Mail, 'Email', 'mailto:support@x5-sman1.web.id'],
                ].map(([Icon, label, href]: any) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={label}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold">Navigasi</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a className="hover:text-foreground" href="#fitur">Fitur</a></li>
                <li><a className="hover:text-foreground" href="#statistik">Statistik</a></li>
                <li><a className="hover:text-foreground" href="#tentang">Tentang</a></li>
                <li><Link className="hover:text-foreground" href="/auth/login">Login Siswa</Link></li>
                <li><Link className="hover:text-foreground" href="/auth/admin">Login Admin</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold">Kontak</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Jl. MT Haryono No.9, Purbalingga, Jawa Tengah</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a className="hover:text-foreground" href="mailto:support@x5-sman1.web.id">
                    support@x5-sman1.web.id
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} Kelas X-5 SMAN 1 Purbalingga. Semua hak dilindungi.</p>
            <p>
              Dibangun dengan Next.js, Supabase &amp; Tailwind CSS
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
