'use client'

import { useMemo } from 'react'
import {
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Database,
  FileBarChart,
  GraduationCap,
  Images,
  LayoutDashboard,
  Layout,
  Megaphone,
  MessageSquare,
  Network,
  Palette,
  Settings,
  UserCog,
  Users,
} from 'lucide-react'
import { SidebarNav, type NavItem } from './sidebar-nav'
import { useAuthStore } from '@/store/auth-store'
import { canAccessPath, isSuperAdmin } from '@/lib/rbac'

/** Menu operasional — tersedia untuk Admin maupun Super Admin. */
const BASE_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Kelola Siswa', href: '/admin/students', icon: Users },
  { label: 'Kehadiran', href: '/admin/attendance', icon: CalendarCheck },
  { label: 'Info PR', href: '/admin/assignments', icon: ClipboardList },
  { label: 'Nilai', href: '/admin/grades', icon: GraduationCap },
  { label: 'Galeri', href: '/admin/gallery', icon: Images },
  { label: 'Pengumuman', href: '/admin/announcements', icon: Megaphone },
  { label: 'Jadwal Pelajaran', href: '/admin/schedule', icon: BookOpen },
  { label: 'Kalender', href: '/admin/calendar', icon: CalendarDays },
  { label: 'Organisasi', href: '/admin/organization', icon: Network },
  { label: 'Messages', href: '/admin/messages', icon: MessageSquare },
  { label: 'Laporan', href: '/admin/reports', icon: FileBarChart },
]

/** Menu khusus Super Admin. */
const SUPER_ITEMS: NavItem[] = [
  { label: 'Manajemen Admin', href: '/admin/admins', icon: UserCog },
  { label: 'Landing CMS', href: '/admin/landing', icon: Layout },
  { label: 'Theme & CSS', href: '/admin/theme', icon: Palette },
  { label: 'Database', href: '/admin/database', icon: Database },
]

const SETTINGS_ITEM: NavItem = { label: 'Pengaturan', href: '/admin/settings', icon: Settings }

export function AdminSidebar() {
  const profile = useAuthStore((s) => s.profile)
  const role = profile?.role

  const items = useMemo(() => {
    // Menu difilter dengan aturan RBAC yang sama dengan penjaga rute,
    // sehingga tampilan dan hak akses tidak pernah berbeda.
    const merged = isSuperAdmin(role) ? [...BASE_ITEMS, ...SUPER_ITEMS] : [...BASE_ITEMS]
    return [...merged.filter((i) => canAccessPath(role, i.href)), SETTINGS_ITEM]
  }, [role])

  return (
    <SidebarNav
      items={items}
      variant="admin"
      title="X-5 SMAN 1 Pbg"
      subtitle={isSuperAdmin(role) ? 'Super Admin Panel' : 'Admin Panel'}
    />
  )
}
