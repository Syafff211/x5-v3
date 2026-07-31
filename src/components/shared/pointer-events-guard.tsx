'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Jaring pengaman UI.
 *
 * Dua sumber "halaman tiba-tiba tidak bisa diklik":
 *
 * 1. Radix (Dialog/Select/DropdownMenu) mengunci scroll dengan menyetel
 *    `pointer-events: none` pada <body>. Kalau komponen ter-unmount saat
 *    animasi masih jalan, style itu bisa tertinggal.
 *
 * 2. Overlay drawer (Framer Motion) yang animasi keluarnya tersendat saat
 *    navigasi, sehingga elemen tetap ada di DOM dengan `opacity: 0` —
 *    tak terlihat, tapi masih menangkap semua klik.
 *
 * Guard ini membersihkan keduanya setiap kali route berubah.
 */
export function PointerEventsGuard() {
  const pathname = usePathname()

  useEffect(() => {
    const unlock = () => {
      const body = document.body

      // --- 1. Lepas kunci pointer-events pada body ---
      const hasOpenOverlay =
        document.querySelector('[data-state="open"][role="dialog"]') ||
        document.querySelector('[data-radix-popper-content-wrapper]')

      if (!hasOpenOverlay) {
        if (body.style.pointerEvents === 'none') body.style.removeProperty('pointer-events')
        if (body.hasAttribute('data-scroll-locked')) body.removeAttribute('data-scroll-locked')
        if (body.style.overflow === 'hidden') body.style.removeProperty('overflow')
      }

      // --- 2. Netralkan overlay full-screen yang sudah tak terlihat ---
      // Kriteria: fixed, menutupi hampir seluruh layar, tapi opacity ~0.
      document.querySelectorAll<HTMLElement>('body div').forEach((el) => {
        const cs = getComputedStyle(el)
        if (cs.position !== 'fixed' || cs.pointerEvents === 'none') return

        const r = el.getBoundingClientRect()
        const menutupiLayar = r.width >= window.innerWidth * 0.9 && r.height >= window.innerHeight * 0.9
        const takTerlihat = parseFloat(cs.opacity || '1') < 0.05

        if (menutupiLayar && takTerlihat) {
          el.style.setProperty('pointer-events', 'none')
        }
      })
    }

    // Bersihkan segera, lalu ulangi setelah animasi keluar selesai.
    unlock()
    const t1 = setTimeout(unlock, 250)
    const t2 = setTimeout(unlock, 600)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [pathname])

  return null
}
