'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('x5-pwa-dismissed') === '1') return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setTimeout(() => setVisible(true), 3500)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setVisible(false)
    setDeferred(null)
  }

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem('x5-pwa-dismissed', '1')
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md sm:left-auto sm:right-6"
          role="dialog"
          aria-label="Install aplikasi"
        >
          <div className="glass-strong flex items-center gap-3 rounded-2xl p-4 shadow-2xl">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl brand-gradient text-white">
              <Smartphone className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Install Aplikasi X-5</p>
              <p className="text-xs text-muted-foreground">Akses lebih cepat, bisa offline.</p>
            </div>
            <Button size="sm" variant="gradient" onClick={install}>
              <Download className="h-4 w-4" /> Install
            </Button>
            <button onClick={dismiss} aria-label="Tutup" className="rounded-lg p-1 text-muted-foreground hover:bg-accent">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
