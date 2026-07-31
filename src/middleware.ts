import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { canAccessPath, HOME_PATH, isAdminLevel, LOGIN_PATH } from '@/lib/rbac'
import type { Role } from '@/types/database'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Mode demo: proteksi ditangani AuthGuard di sisi klien.
  if (!isSupabaseConfigured) return NextResponse.next()

  const { response, user, role: rawRole } = await updateSession(request)
  const role = rawRole as Role | null

  const isDashboard = pathname.startsWith('/dashboard')
  const isAdminArea = pathname.startsWith('/admin')

  // Belum login.
  if ((isDashboard || isAdminArea) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = isAdminArea ? LOGIN_PATH.admin : LOGIN_PATH.student
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (role) {
    // Siswa mencoba masuk area admin.
    if (isAdminArea && !isAdminLevel(role)) {
      const url = request.nextUrl.clone()
      url.pathname = HOME_PATH[role]
      return NextResponse.redirect(url)
    }

    // Admin/super admin membuka dashboard siswa.
    if (isDashboard && isAdminLevel(role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }

    // Admin biasa membuka rute khusus super admin.
    if (isAdminArea && !canAccessPath(role, pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      url.searchParams.set('denied', '1')
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|sw.js|og-image.svg|robots.txt|sitemap.xml).*)',
  ],
}
