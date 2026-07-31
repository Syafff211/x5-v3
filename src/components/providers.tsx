'use client'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PWAInstallPrompt } from '@/components/shared/pwa-install-prompt'
import { ServiceWorkerRegister } from '@/components/shared/service-worker-register'
import { CustomThemeInjector } from '@/components/shared/custom-theme-injector'
import { PointerEventsGuard } from '@/components/shared/pointer-events-guard'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <TooltipProvider delayDuration={200}>
        <CustomThemeInjector />
        <PointerEventsGuard />
        {children}
        {/*
          Toaster dipindah ke bottom-right dan container-nya dibuat click-through.
          Sebelumnya `top-center` + z-index 999999999 + pointer-events:auto menutupi
          tombol hamburger dan header sehingga sidebar/halaman terasa "terkunci".
          Hanya kartu toast-nya yang menerima pointer events.
        */}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          offset={16}
          toastOptions={{
            classNames: {
              toast: 'rounded-xl border-border pointer-events-auto',
            },
          }}
          style={{ pointerEvents: 'none' }}
        />
        <PWAInstallPrompt />
        <ServiceWorkerRegister />
      </TooltipProvider>
    </ThemeProvider>
  )
}
