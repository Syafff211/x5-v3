'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useDataStore } from '@/store/data-store'
import { canAccessPath, isAdminLevel, HOME_PATH, LOGIN_PATH } from '@/lib/rbac'
import type { Role } from '@/types/database'

/**
 * `area` menggantikan pemeriksaan peran tunggal supaya `admin` dan
 * `super_admin` sama-sama bisa membuka /admin, sementara rute khusus
 * super admin tetap terkunci lewat `canAccessPath`.
 */
export function AuthGuard({
  area,
  role,
  children,
}: {
  /** Area yang dilindungi. */
  area?: 'student' | 'admin'
  /**
   * Alias lama dari `area`. Dipertahankan agar layout versi lama
   * (`<AuthGuard role="admin">`) tetap ter-compile tanpa error.
   */
  role?: 'student' | 'admin' | 'super_admin'
  children: React.ReactNode
}) {
  // super_admin dipetakan ke area admin.
  const resolvedArea: 'student' | 'admin' =
    area ?? (role === 'student' ? 'student' : 'admin')
  const router = useRouter()
  const pathname = usePathname()
  const profile = useAuthStore((s) => s.profile)
  const initialize = useAuthStore((s) => s.initialize)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let active = true
    setChecked(false)
    ;(async () => {
      // Tunggu Zustand selesai memulihkan sesi dari localStorage.
      // Tanpa ini, membuka URL langsung (bukan navigasi antar-halaman) sempat
      // membaca profile = null dan pengguna terlempar ke halaman login.
      const persist = (useAuthStore as any).persist
      if (persist && !persist.hasHydrated?.()) {
        await new Promise<void>((resolve) => {
          const stop = persist.onFinishHydration?.(() => resolve())
          setTimeout(() => {
            stop?.()
            resolve()
          }, 1200)
        })
      }
      if (!active) return

      if (!useAuthStore.getState().initialized) await initialize()
      if (!active) return

      const current = useAuthStore.getState().profile
      const currentRole = current?.role as Role | undefined

      // Belum login -> ke halaman login yang sesuai area.
      if (!current || !currentRole) {
        router.replace(resolvedArea === 'admin' ? LOGIN_PATH.admin : LOGIN_PATH.student)
        return
      }

      // Salah area (mis. siswa membuka /admin) -> lempar ke rumahnya.
      const inRightArea =
        resolvedArea === 'admin' ? isAdminLevel(currentRole) : currentRole === 'student'
      if (!inRightArea) {
        router.replace(HOME_PATH[currentRole])
        return
      }

      // Admin biasa membuka rute khusus super admin -> tolak.
      if (!canAccessPath(currentRole, pathname)) {
        router.replace('/admin?denied=1')
        return
      }

      if (!useDataStore.getState().hydrated) {
        await useDataStore.getState().hydrateFromSupabase()
      }
      if (!active) return
      setChecked(true)
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedArea, pathname])

  if (!checked || !profile) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl brand-gradient text-white shadow-lg shadow-primary/30">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
