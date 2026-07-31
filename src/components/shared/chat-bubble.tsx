'use client'
import { motion } from 'framer-motion'
import { Check, CheckCheck } from 'lucide-react'
import { cn, formatTime } from '@/lib/utils'

export function ChatBubble({
  content,
  isOwn,
  time,
  isRead,
}: {
  content: string
  isOwn: boolean
  time: string
  isRead?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22 }}
      className={cn('flex w-full', isOwn ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm sm:max-w-[65%]',
          isOwn
            ? 'brand-gradient rounded-br-md text-white'
            : 'rounded-bl-md border border-border bg-card text-card-foreground'
        )}
      >
        <p className="whitespace-pre-wrap break-words leading-relaxed">{content}</p>
        <div className={cn('mt-1 flex items-center justify-end gap-1 text-[10px]', isOwn ? 'text-white/75' : 'text-muted-foreground')}>
          <span>{formatTime(time)}</span>
          {isOwn &&
            (isRead ? (
              <CheckCheck className="h-3 w-3" aria-label="Dibaca" />
            ) : (
              <Check className="h-3 w-3" aria-label="Terkirim" />
            ))}
        </div>
      </div>
    </motion.div>
  )
}
