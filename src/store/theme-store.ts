'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface ThemeState {
  /** HSL triplet strings, e.g. "239 84% 67%" */
  primary: string
  secondary: string
  radius: string
  customCss: string
  setPrimary: (v: string) => void
  setSecondary: (v: string) => void
  setRadius: (v: string) => void
  setCustomCss: (v: string) => void
  reset: () => void
}

const DEFAULTS = { primary: '239 84% 67%', secondary: '270 70% 60%', radius: '0.75rem', customCss: '' }

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setPrimary: (primary) => set({ primary }),
      setSecondary: (secondary) => set({ secondary }),
      setRadius: (radius) => set({ radius }),
      setCustomCss: (customCss) => set({ customCss }),
      reset: () => set({ ...DEFAULTS }),
    }),
    { name: 'x5-theme', storage: createJSONStorage(() => localStorage) }
  )
)

/** #6366f1 -> "239 84% 67%" */
export function hexToHsl(hex: string): string {
  const m = hex.replace('#', '')
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m
  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  const l = (max + min) / 2
  const d = max - min
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
  }
  h = Math.round(h * 60)
  if (h < 0) h += 360
  return `${h} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export function hslToHex(hsl: string): string {
  const [hRaw, sRaw, lRaw] = hsl.split(' ')
  const h = parseFloat(hRaw)
  const s = parseFloat(sRaw) / 100
  const l = parseFloat(lRaw) / 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let [r, g, b] = [0, 0, 0]
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}
