'use client'
import { motion, AnimatePresence } from 'framer-motion'

export function TypingIndicator({ name, visible }: { name: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          className="flex items-center gap-2 px-1 py-1"
          aria-live="polite"
        >
          <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-card px-3 py-2.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
                animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{name} sedang mengetik...</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
