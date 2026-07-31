'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Jaring pengaman UI.
 *
 * Radix (Dialog/Select/DropdownMenu) mengunci scroll dengan menyetel
 * `pointer-events: none` pada <body>. Jika komponen ter-unmount saat animasi
 * masih berjalan — misalnya karena navigasi route terjadi tepat ketika modal
 * ditutup — style itu bisa tertinggal dan membuat SELURUH halaman tidak bisa
 * diklik (gejala: "sidebar dan semua elemen mati").
 *
 * Guard ini membersihkan sisa style tersebut setiap kali route berubah dan
 * saat tidak ada lagi overlay yang benar-benar terbuka.
 */
export function PointerEventsGuard() {
  const pathname = usePathname()

  useEffect(() => {
    const unlock = () => {
      const hasOpenOverlay =
        document.querySelector('[data-state="open"][role="dialog"]') ||
        document.querySelector('[data-radix-popper-content-wrapper]')

      if (!hasOpenOverlay) {
        const body = document.body
        if (body.style.pointerEvents === 'none') body.style.removeProperty('pointer-events')
        if (body.hasAttribute('data-scroll-locked')) body.removeAttribute('data-scroll-locked')
        if (body.style.overflow === 'hidden') body.style.removeProperty('overflow')
      }
    }

    // Bersihkan segera setelah navigasi, lalu sekali lagi setelah animasi keluar selesai.
    unlock()
    const t = setTimeout(unlock, 350)
    return () => clearTimeout(t)
  }, [pathname])

  return null
}
