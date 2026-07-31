import type { Role } from '@/types/database'

/**
 * ---------------------------------------------------------------------------
 * ROLE-BASED ACCESS CONTROL
 * ---------------------------------------------------------------------------
 * student     -> /dashboard/*   siswa biasa
 * admin       -> /admin/*       sekretaris / ketua kelas (operasional harian)
 * super_admin -> /admin/*       kendali penuh + kelola akun admin
 *
 * super_admin adalah superset dari admin: semua yang bisa dilakukan admin,
 * bisa juga dilakukan super admin.
 * ---------------------------------------------------------------------------
 */

export const ROLE_LABEL: Record<Role, string> = {
  student: 'Siswa',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

/** Halaman login untuk masing-masing peran. */
export const LOGIN_PATH: Record<Role, string> = {
  student: '/auth/login',
  admin: '/auth/admin',
  super_admin: '/auth/s/admin',
}

/** Halaman tujuan setelah login sukses. */
export const HOME_PATH: Record<Role, string> = {
  student: '/dashboard',
  admin: '/admin',
  super_admin: '/admin',
}

export const isSuperAdmin = (role?: Role | null) => role === 'super_admin'
export const isAdminLevel = (role?: Role | null) => role === 'admin' || role === 'super_admin'
export const isStudent = (role?: Role | null) => role === 'student'

/**
 * Kemampuan yang HANYA dimiliki super admin.
 * Dipakai untuk menyembunyikan menu sekaligus memblokir akses rute.
 */
export const SUPER_ADMIN_ONLY_PATHS = [
  '/admin/admins',   // manajemen akun admin
  '/admin/database', // ekspor / backup / restore database
  '/admin/theme',    // kustomisasi tema & CSS global
  '/admin/landing',  // CMS halaman publik
] as const

/** Apakah `role` boleh membuka `pathname`? */
export function canAccessPath(role: Role | null | undefined, pathname: string): boolean {
  if (!role) return false

  if (pathname.startsWith('/admin')) {
    if (!isAdminLevel(role)) return false
    const restricted = SUPER_ADMIN_ONLY_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + '/')
    )
    return restricted ? isSuperAdmin(role) : true
  }

  if (pathname.startsWith('/dashboard')) return isStudent(role)

  return true
}

/** Peran yang diterima oleh masing-masing halaman login. */
export function rolesAcceptedBy(loginPath: string): Role[] {
  if (loginPath === '/auth/s/admin') return ['super_admin']
  if (loginPath === '/auth/admin') return ['admin']
  return ['student']
}
