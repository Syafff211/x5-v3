'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  LogOut,
  Menu,
  Settings,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuthStore } from '@/store/auth-store'
import { cn, initials } from '@/lib/utils'
import { toast } from 'sonner'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: number
}

interface SidebarNavProps {
  items: NavItem[]
  variant: 'student' | 'admin'
  title: string
  subtitle: string
}

export function SidebarNav({ items, variant, title, subtitle }: SidebarNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const profile = useAuthStore((s) => s.profile)
  const signOut = useAuthStore((s) => s.signOut)

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isAdmin = variant === 'admin'

  useEffect(() => {
    const saved = localStorage.getItem('x5-sidebar-collapsed')
    if (saved === '1') setCollapsed(true)
  }, [])

  // Tutup drawer setiap kali route berubah. Dijalankan juga saat komponen
  // di-render ulang oleh navigasi, sebagai pengaman kalau animasi keluar
  // sempat tersendat.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const toggleCollapse = () => {
    setCollapsed((v) => {
      localStorage.setItem('x5-sidebar-collapsed', v ? '0' : '1')
      return !v
    })
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('Berhasil keluar.')
    router.push(isAdmin ? '/auth/admin' : '/auth/login')
  }

  const isActive = (href: string) => {
    const base = isAdmin ? '/admin' : '/dashboard'
    if (href === base) return pathname === base
    return pathname === href || pathname.startsWith(href + '/')
  }

  const NavLinks = ({ compact }: { compact: boolean }) => (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3 scrollbar-thin" aria-label="Menu utama">
      {items.map((item) => {
        const active = isActive(item.href)
        const link = (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
              active
                ? isAdmin
                  ? 'bg-gradient-to-r from-rose-500/20 to-purple-500/20 text-foreground'
                  : 'bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/15 text-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              compact && 'justify-center px-2'
            )}
          >
            {active && (
              <motion.span
                layoutId={`sidebar-active-${variant}`}
                className={cn(
                  'absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full',
                  isAdmin ? 'bg-rose-500' : 'bg-primary'
                )}
              />
            )}
            <item.icon className={cn('h-[18px] w-[18px] shrink-0', active && (isAdmin ? 'text-rose-500' : 'text-primary'))} />
            {!compact && <span className="truncate">{item.label}</span>}
            {!compact && !!item.badge && (
              <Badge className="ml-auto h-5 min-w-5 justify-center px-1.5 text-[10px]">{item.badge}</Badge>
            )}
            {compact && !!item.badge && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
            )}
          </Link>
        )

        return compact ? (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ) : (
          link
        )
      })}
    </nav>
  )

  const SidebarBody = ({ compact }: { compact: boolean }) => (
    <>
      {/* Logo */}
      <div className={cn('flex items-center gap-2.5 border-b border-border/60 px-4 py-4', compact && 'justify-center px-2')}>
        <div
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold text-white shadow-lg',
            isAdmin ? 'bg-gradient-to-br from-rose-500 to-purple-600 shadow-rose-500/25' : 'brand-gradient shadow-primary/25'
          )}
        >
          X5
        </div>
        {!compact && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">{title}</p>
            <p className="truncate text-[11px] leading-tight text-muted-foreground">{subtitle}</p>
          </div>
        )}
        {!compact && isAdmin && (
          <Badge variant="destructive" className="shrink-0 text-[10px]">
            {profile?.role === 'super_admin' ? 'SUPER' : 'ADMIN'}
          </Badge>
        )}
      </div>

      <NavLinks compact={compact} />

      {/* User section */}
      <div className="border-t border-border/60 p-3">
        {compact ? (
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-9 w-9">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
              <AvatarFallback>{initials(profile?.full_name ?? 'X5')}</AvatarFallback>
            </Avatar>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" onClick={handleSignOut} aria-label="Keluar">
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Keluar</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="rounded-xl border border-border/60 bg-card/50 p-2.5">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-9 w-9 shrink-0">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
                <AvatarFallback>{initials(profile?.full_name ?? 'X5')}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">{profile?.full_name ?? 'Pengguna'}</p>
                <p className="truncate text-[11px] leading-tight text-muted-foreground">
                  {isAdmin ? 'Wali Kelas' : profile?.nisn ? `NISN ${profile.nisn}` : 'Siswa'}
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-1">
              <ThemeToggle className="h-8 w-8" />
              <Button asChild variant="ghost" size="icon-sm" aria-label="Pengaturan">
                <Link href={isAdmin ? '/admin/settings' : '/dashboard/settings'}>
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" /> Keluar
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* ---------- MOBILE TOP BAR ---------- */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label="Buka menu" aria-expanded={mobileOpen}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={cn(
              'grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold text-white',
              isAdmin ? 'bg-gradient-to-br from-rose-500 to-purple-600' : 'brand-gradient'
            )}
          >
            X5
          </div>
          <p className="truncate text-sm font-semibold">{title}</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <Avatar className="h-8 w-8">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
            <AvatarFallback className="text-[10px]">{initials(profile?.full_name ?? 'X5')}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* ---------- MOBILE DRAWER ---------- */}
      {/*
        Tidak memakai AnimatePresence.

        AnimatePresence menahan elemen di DOM selama animasi keluar. Kalau
        navigasi terjadi saat drawer menutup, unmount-nya bisa tidak pernah
        selesai — overlay tertinggal dengan opacity 0 tapi masih menangkap
        semua klik, sehingga halaman terasa "mati setelah sekali klik".

        Render kondisional biasa + animasi CSS: begitu `mobileOpen` false,
        elemen benar-benar hilang dari DOM pada render itu juga.
      */}
      {mobileOpen && (
        <div className="lg:hidden">
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            aria-hidden
          />
          <aside
            className="fixed inset-y-0 left-0 z-[71] flex w-[280px] flex-col border-r border-border bg-card shadow-2xl animate-in slide-in-from-left duration-300"
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
          >
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup menu"
              className="absolute right-2 top-3.5 z-10"
            >
              <X className="h-4 w-4" />
            </Button>
            <SidebarBody compact={false} />
          </aside>
        </div>
      )}

      {/* ---------- DESKTOP SIDEBAR ---------- */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-border/60 bg-card/50 backdrop-blur-xl transition-[width] duration-300 lg:flex',
          collapsed ? 'w-[76px]' : 'w-[260px]'
        )}
      >
        <SidebarBody compact={collapsed} />
        <button
          onClick={toggleCollapse}
          aria-label={collapsed ? 'Perluas sidebar' : 'Perkecil sidebar'}
          className="absolute -right-3 top-20 grid h-6 w-6 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-md transition-colors hover:text-foreground"
        >
          <ChevronLeft className={cn('h-3.5 w-3.5 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </aside>

      {/* Spacer for content offset */}
      <div className={cn('hidden shrink-0 transition-[width] duration-300 lg:block', collapsed ? 'w-[76px]' : 'w-[260px]')} aria-hidden />
    </>
  )
}
