'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { GradientOrbs } from '@/components/shared/gradient-orbs'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { Badge } from '@/components/ui/badge'

export function AuthShell({
  children,
  variant = 'indigo',
}: {
  children: React.ReactNode
  variant?: 'indigo' | 'red'
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-12">
      <GradientOrbs variant={variant} />
      <div className="pointer-events-none absolute inset-0 bg-grid-dark bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]" />

      <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Beranda
        </Link>
      </div>
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="glass-strong rounded-3xl p-7 shadow-2xl sm:p-9">{children}</div>

        {!isSupabaseConfigured && (
          <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-xs text-amber-600 dark:text-amber-400">
            <Badge variant="warning" className="mb-1.5">Mode Demo</Badge>
            <p>
              Supabase belum dikonfigurasi. Masuk dengan email apa pun dan password minimal 6 karakter untuk mencoba
              aplikasi.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
