'use client'

import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Download, FileSpreadsheet, Pencil, Plus, Search, Trash2, Upload, UserPlus, Users } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/empty-state'
import { nowIso, uid, useDataStore } from '@/store/data-store'
import { avatarFor } from '@/lib/demo-data'
import { exportToExcel, importFromExcel } from '@/lib/export'
import { initials, sanitizeText } from '@/lib/utils'
import type { Profile } from '@/types/database'

const EMPTY = { full_name: '', nisn: '', email: '', phone: '', address: '', parent_name: '' }

export default function AdminStudentsPage() {
  const students = useDataStore((s) => s.students)
  const add = useDataStore((s) => s.add)
  const update = useDataStore((s) => s.update)
  const remove = useDataStore((s) => s.remove)

  const [query, setQuery] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState<Profile | null>(null)
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Profile | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students
      .filter((s) => s.role === 'student')
      .filter((s) => !q || s.full_name.toLowerCase().includes(q) || (s.nisn ?? '').includes(q) || s.email.toLowerCase().includes(q))
      .sort((a, b) => a.full_name.localeCompare(b.full_name))
  }, [students, query])

  function openAdd() {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }

  function openEdit(s: Profile) {
    setEditing(s)
    setForm({
      full_name: s.full_name,
      nisn: s.nisn ?? '',
      email: s.email,
      phone: s.phone ?? '',
      address: s.address ?? '',
      parent_name: s.parent_name ?? '',
    })
    setOpen(true)
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (form.full_name.trim().length < 3) return toast.error('Nama minimal 3 karakter.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return toast.error('Format email tidak valid.')

    const duplicate = students.find(
      (s) => s.id !== editing?.id && (s.email.toLowerCase() === form.email.toLowerCase() || (form.nisn && s.nisn === form.nisn))
    )
    if (duplicate) return toast.error('Email atau NISN sudah terdaftar.')

    const payload = {
      full_name: sanitizeText(form.full_name, 100),
      nisn: sanitizeText(form.nisn, 20),
      email: form.email.trim().toLowerCase(),
      phone: sanitizeText(form.phone, 20),
      address: sanitizeText(form.address, 200),
      parent_name: sanitizeText(form.parent_name, 100),
      updated_at: nowIso(),
    }

    if (editing) {
      update('profiles', editing.id, payload)
      toast.success('Data siswa diperbarui.')
    } else {
      add('profiles', {
        id: uid(),
        user_id: null,
        avatar_url: avatarFor(payload.full_name),
        role: 'student' as const,
        created_at: nowIso(),
        ...payload,
      })
      toast.success('Siswa berhasil ditambahkan.')
    }
    setOpen(false)
    setForm(EMPTY)
    setEditing(null)
  }

  function doDelete() {
    if (!confirmDelete) return
    remove('profiles', confirmDelete.id)
    toast.success(`${confirmDelete.full_name} dihapus.`)
    setConfirmDelete(null)
  }

  function handleExport() {
    if (!list.length) return toast.error('Tidak ada data untuk diekspor.')
    exportToExcel(
      list.map((s, i) => ({
        No: i + 1,
        'Nama Lengkap': s.full_name,
        NISN: s.nisn,
        Email: s.email,
        'No. HP': s.phone,
        'Orang Tua': s.parent_name,
        Alamat: s.address,
      })),
      'data-siswa-x5',
      'Data Siswa'
    )
    toast.success('Data siswa diekspor ke Excel.')
  }

  async function handleImport(file: File) {
    try {
      const rows = await importFromExcel(file)
      if (!rows.length) return toast.error('File kosong atau format tidak dikenali.')
      let added = 0
      rows.forEach((r) => {
        const name = String(r['Nama Lengkap'] ?? r['nama'] ?? r['Nama'] ?? '').trim()
        const email = String(r['Email'] ?? r['email'] ?? '').trim().toLowerCase()
        if (!name || !email) return
        if (students.some((s) => s.email.toLowerCase() === email)) return
        add('profiles', {
          id: uid(),
          user_id: null,
          full_name: name,
          nisn: String(r['NISN'] ?? r['nisn'] ?? ''),
          email,
          phone: String(r['No. HP'] ?? r['phone'] ?? ''),
          address: String(r['Alamat'] ?? r['address'] ?? ''),
          parent_name: String(r['Orang Tua'] ?? r['parent_name'] ?? ''),
          avatar_url: avatarFor(name),
          role: 'student' as const,
          created_at: nowIso(),
          updated_at: nowIso(),
        })
        added += 1
      })
      toast.success(`${added} siswa berhasil diimpor.`)
    } catch {
      toast.error('Gagal membaca file Excel.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function downloadTemplate() {
    exportToExcel(
      [{ 'Nama Lengkap': 'Contoh Nama Siswa', NISN: '0071234567', Email: 'contoh@student.sch.id', 'No. HP': '081234567890', 'Orang Tua': 'Bpk. Contoh', Alamat: 'Purbalingga' }],
      'template-import-siswa',
      'Template'
    )
    toast.success('Template Excel diunduh.')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Siswa"
        description={`${list.length} siswa terdaftar di kelas X-5`}
        action={
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
            />
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <FileSpreadsheet className="h-4 w-4" /> Template
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Import
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button variant="gradient" size="sm" onClick={openAdd}>
              <UserPlus className="h-4 w-4" /> Tambah Siswa
            </Button>
          </>
        }
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari nama, NISN, atau email..." className="pl-9" aria-label="Cari siswa" />
      </div>

      <Card glass>
        <CardContent className="p-0 sm:px-2 sm:pb-4 sm:pt-2">
          {list.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum ada siswa"
              description="Tambahkan siswa satu per satu atau impor dari file Excel."
              action={<Button variant="gradient" onClick={openAdd}><Plus className="h-4 w-4" /> Tambah Siswa</Button>}
              className="m-4"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Siswa</TableHead>
                  <TableHead className="hidden md:table-cell">NISN</TableHead>
                  <TableHead className="hidden lg:table-cell">Kontak</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((s, i) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          {s.avatar_url && <AvatarImage src={s.avatar_url} alt={s.full_name} />}
                          <AvatarFallback className="text-[10px]">{initials(s.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{s.full_name}</p>
                          <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="font-mono text-[11px]">{s.nisn}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      <p>{s.phone}</p>
                      <p className="truncate max-w-[180px]">{s.address}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(s)} aria-label={`Edit ${s.full_name}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setConfirmDelete(s)}
                          aria-label={`Hapus ${s.full_name}`}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Siswa' : 'Tambah Siswa'}</DialogTitle>
            <DialogDescription>{editing ? `Perbarui data ${editing.full_name}.` : 'Masukkan data siswa baru kelas X-5.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="f-name">Nama Lengkap *</Label>
                <Input id="f-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="f-nisn">NISN</Label>
                <Input id="f-nisn" value={form.nisn} onChange={(e) => setForm({ ...form, nisn: e.target.value })} maxLength={20} inputMode="numeric" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="f-phone">No. HP</Label>
                <Input id="f-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="f-email">Email *</Label>
                <Input id="f-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="f-parent">Nama Orang Tua / Wali</Label>
                <Input id="f-parent" value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} maxLength={100} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="f-address">Alamat</Label>
                <Textarea id="f-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} maxLength={200} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit" variant="gradient">{editing ? 'Simpan Perubahan' : 'Tambah Siswa'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Siswa?</DialogTitle>
            <DialogDescription>
              Data <span className="font-medium text-foreground">{confirmDelete?.full_name}</span> akan dihapus permanen.
              Tindakan ini tidak dapat dibatalkan.
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
