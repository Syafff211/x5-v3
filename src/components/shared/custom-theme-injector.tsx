'use client'
import { useEffect } from 'react'
import { useThemeStore } from '@/store/theme-store'

/** Applies admin-configured primary colour + custom CSS at runtime. */
export function CustomThemeInjector() {
  const { primary, secondary, radius, customCss } = useThemeStore()

  useEffect(() => {
    const root = document.documentElement
    if (primary) root.style.setProperty('--primary', primary)
    if (secondary) root.style.setProperty('--secondary', secondary)
    if (radius) root.style.setProperty('--radius', radius)
  }, [primary, secondary, radius])

  useEffect(() => {
    let el = document.getElementById('x5-runtime-css') as HTMLStyleElement | null
    if (!el) {
      el = document.createElement('style')
      el.id = 'x5-runtime-css'
      document.head.appendChild(el)
    }
    el.textContent = customCss ?? ''
  }, [customCss])

  return null
}
