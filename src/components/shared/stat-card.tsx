'use client'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { AnimatedCounter } from './animated-counter'

interface StatCardProps {
  label: string
  value: number | string
  suffix?: string
  icon: LucideIcon
  trend?: string
  accent?: 'indigo' | 'emerald' | 'amber' | 'fuchsia' | 'sky' | 'rose'
  delay?: number
  animate?: boolean
}

const ACCENTS: Record<string, string> = {
  indigo: 'from-indigo-500 to-violet-500',
  emerald: 'from-emerald-500 to-teal-500',
  amber: 'from-amber-500 to-orange-500',
  fuchsia: 'from-fuchsia-500 to-pink-500',
  sky: 'from-sky-500 to-blue-500',
  rose: 'from-rose-500 to-red-500',
}

export function StatCard({ label, value, suffix = '', icon: Icon, trend, accent = 'indigo', delay = 0, animate = true }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay }}
    >
      <Card glass className="group relative overflow-hidden p-5 card-hover">
        <div className={cn('pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity group-hover:opacity-40', ACCENTS[accent])} />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {typeof value === 'number' && animate ? <AnimatedCounter value={value} suffix={suffix} /> : `${value}${suffix}`}
            </p>
            {trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
          </div>
          <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg', ACCENTS[accent])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
