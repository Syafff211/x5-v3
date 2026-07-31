'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { KeyRound, Pencil, Plus, Search, Shield, ShieldCheck, Trash2, UserCog } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { useAuthStore } from '@/store/auth-store'
import { nowIso, uid, useDataStore } from '@/store/data-store'
import { avatarFor } from '@/lib/demo-data'
import { ROLE_LABEL } from '@/lib/rbac'
import { cn, formatDate, initials, sanitizeText } from '@/lib/utils'
import type { Profile, Role } from '@/types/database'

const EMPTY = { full_name: '', email: '', phone: '', role: 'admin' as Exclude<Role, 'student'> }

export default function SuperAdminAdminsPage() {
  const me = useAuthStore((s) => s.profile)
  const students = useDataStore((s) => s.students)
  const add = useDataStore((s) => s.add)
  const update = useDataStore((s) => s.update)
  const remove = useDataStore((s) => s.remove)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Profile | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [confirmDelete, setConfirmDelete] = useState<Profile | null>(null)

  const admins = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students
      .filter((s) => s.role === 'admin' || s.role === 'super_admin')
      .filter((s) => !q || s.full_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
      .sort((a, b) => (a.role === b.role ? a.full_name.localeCompare(b.full_name) : a.role === 'super_admin' ? -1 : 1))
  }, [students, query])

  const superAdminCount = students.filter((s) => s.role === 'super_admin').length

  function openAdd() {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }

  function openEdit(a: Profile) {
    setEditing(a)
    setForm({
      full_name: a.full_name,
      email: a.email,
      phone: a.phone ?? '',
      role: (a.role === 'super_admin' ? 'super_admin' : 'admin') as Exclude<Role, 'student'>,
    })
    setOpen(true)
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (form.full_name.trim().length < 3) return toast.error('Nama minimal 3 karakter.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return toast.error('Format email tidak valid.')

    const dup = students.find((s) => s.id !== editing?.id && s.email.toLowerCase() === form.email.trim().toLowerCase())
    if (dup) return toast.error('Email sudah terdaftar.')

    // Jangan sampai sistem kehilangan super admin terakhir.
    if (editing?.role === 'super_admin' && form.role !== 'super_admin' && superAdminCount <= 1) {
      return toast.error('Minimal harus ada satu Super Admin.')
    }

    const payload = {
      full_name: sanitizeText(form.full_name, 100),
      email: form.email.trim().toLowerCase(),
      phone: sanitizeText(form.phone, 20),
      role: form.role,
      updated_at: nowIso(),
    }

    if (editing) {
      update('profiles', editing.id, payload)
      if (editing.id === me?.id && form.role !== me.role) {
        useAuthStore.getState().setProfile({ ...me, ...payload } as Profile)
      }
      toast.success('Data admin diperbarui.')
    } else {
      add('profiles', {
        id: uid(),
        user_id: null,
        nisn: null,
        address: null,
        parent_name: null,
        avatar_url: avatarFor(payload.full_name),
        created_at: nowIso(),
        ...payload,
      })
      toast.success(`${ROLE_LABEL[form.role]} baru ditambahkan.`)
    }
    setOpen(false)
  }

  function doDelete() {
    if (!confirmDelete) return
    if (confirmDelete.id === me?.id) {
      toast.error('Kamu tidak bisa menghapus akunmu sendiri.')
      setConfirmDelete(null)
      return
    }
    if (confirmDelete.role === 'super_admin' && superAdminCount <= 1) {
      toast.error('Minimal harus ada satu Super Admin.')
      setConfirmDelete(null)
      return
    }
    remove('profiles', confirmDelete.id)
    toast.success(`Akun ${confirmDelete.full_name} dihapus.`)
    setConfirmDelete(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen Admin"
        description={`${admins.length} akun pengelola · ${superAdminCount} super admin`}
        action={
          <Button variant="gradient" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Tambah Admin
          </Button>
        }
      />

      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div className="text-sm">
          <p className="font-medium text-amber-600 dark:text-amber-400">Halaman khusus Super Admin</p>
          <p className="mt-0.5 text-muted-foreground">
            <strong>Super Admin</strong> memiliki kendali penuh termasuk mengelola akun admin, database, tema, dan CMS.{' '}
            <strong>Admin</strong> (sekretaris/ketua kelas) hanya mengelola data operasional harian.
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama atau email admin..."
          className="pl-9"
          aria-label="Cari admin"
        />
      </div>

      <Card glass>
        <CardContent className="p-0 sm:px-2 sm:pb-4 sm:pt-2">
          {admins.length === 0 ? (
            <EmptyState
              icon={UserCog}
              title="Belum ada admin"
              description="Tambahkan akun sekretaris atau ketua kelas."
              action={<Button variant="gradient" onClick={openAdd}><Plus className="h-4 w-4" /> Tambah Admin</Button>}
              className="m-4"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Akun</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead className="hidden md:table-cell">Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((a, i) => {
                  const isSuper = a.role === 'super_admin'
                  const isMe = a.id === me?.id
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            {a.avatar_url && <AvatarImage src={a.avatar_url} alt={a.full_name} />}
                            <AvatarFallback className="text-[10px]">{initials(a.full_name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                              {a.full_name}
                              {isMe && <Badge variant="outline" className="text-[10px]">Kamu</Badge>}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{a.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            'gap-1',
                            isSuper
                              ? 'border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : 'border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          )}
                        >
                          {isSuper ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                          {ROLE_LABEL[a.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {formatDate(a.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Reset password ${a.full_name}`}
                            onClick={() => toast.success(`Link reset password dikirim ke ${a.email}.`)}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(a)} aria-label={`Edit ${a.full_name}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setConfirmDelete(a)}
                            aria-label={`Hapus ${a.full_name}`}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Tambah / Edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Admin' : 'Tambah Admin'}</DialogTitle>
            <DialogDescription>
              {editing ? `Perbarui data ${editing.full_name}.` : 'Buat akun pengelola baru untuk kelas X-5.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="a-name">Nama Lengkap *</Label>
              <Input id="a-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-email">Email *</Label>
              <Input id="a-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="a-phone">No. HP</Label>
                <Input id="a-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-role">Peran *</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Exclude<Role, 'student'> })}>
                  <SelectTrigger id="a-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin (Sekretaris / Ketua Kelas)</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="rounded-xl border border-border/60 bg-card/40 p-3 text-xs text-muted-foreground">
              Password awal akan dikirim ke email tersebut. Saat Supabase aktif, akun dibuat lewat Auth Admin API.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" variant="gradient">{editing ? 'Simpan Perubahan' : 'Tambah Admin'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Hapus */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Akun Admin?</DialogTitle>
            <DialogDescription>
              Akses <span className="font-medium text-foreground">{confirmDelete?.full_name}</span> akan dicabut permanen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Batal</Button>
            <Button variant="destructive" onClick={doDelete}><Trash2 className="h-4 w-4" /> Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
