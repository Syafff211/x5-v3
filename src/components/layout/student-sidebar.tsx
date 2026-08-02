'use client'

import {
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Images,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Settings,
  UserCircle,
  Users,
} from 'lucide-react'
import { useMemo } from 'react'
import { SidebarNav, type NavItem } from './sidebar-nav'
import { useAuthStore } from '@/store/auth-store'
import { useDataStore } from '@/store/data-store'

const items: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Kehadiran', href: '/dashboard/attendance', icon: CalendarCheck },
  { label: 'Info PR', href: '/dashboard/assignments', icon: ClipboardList },
  { label: 'Pengumuman', href: '/dashboard/announcements', icon: Megaphone },
  { label: 'Galeri', href: '/dashboard/gallery', icon: Images },
  { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
  { label: 'Teman', href: '/dashboard/friends', icon: Users },
  { label: 'Jadwal Pelajaran', href: '/dashboard/schedule', icon: CalendarDays },
  { label: 'Profil', href: '/dashboard/profile', icon: UserCircle },
  { label: 'Pengaturan', href: '/dashboard/settings', icon: Settings },
]

export function StudentSidebar() {
  const profile = useAuthStore((s) => s.profile)
  const messages = useDataStore((s) => s.messages)

  // Badge Messages mengikuti jumlah pesan belum dibaca yang sebenarnya.
  const navItems = useMemo(() => {
    const unread = profile
      ? messages.filter((m) => m.receiver_id === profile.id && !m.is_read).length
      : 0
    return items.map((it) =>
      it.href === '/dashboard/messages' && unread > 0 ? { ...it, badge: unread } : it
    )
  }, [messages, profile])

  return <SidebarNav items={navItems} variant="student" title="X-5 SMAN 1 Pbg" subtitle="Dashboard Siswa" />
}
