'use client'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function FeatureCard({
  icon: Icon,
  title,
  description,
  delay = 0,
}: {
  icon: LucideIcon
  title: string
  description: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay }}
      className="h-full"
    >
      <Card glass className="group relative h-full overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 opacity-0 transition-opacity duration-300 group-hover:from-primary/10 group-hover:to-fuchsia-500/10 group-hover:opacity-100" />
        <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-40 brand-gradient" style={{ zIndex: -1 }} />
        <div className="relative">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl brand-gradient text-white shadow-lg shadow-primary/25 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">{title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </Card>
    </motion.div>
  )
}
