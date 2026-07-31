'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Camera, Loader2, Mail, MapPin, Pencil, Phone, Save, UserCircle, Users, X } from 'lucide-react'
import { PageHeader } from '@/components/shared/page-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/store/auth-store'
import { useDataStore } from '@/store/data-store'
import { average, initials, sanitizeText } from '@/lib/utils'

export default function ProfilePage() {
  const profile = useAuthStore((s) => s.profile)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const { attendance, grades, submissions } = useDataStore()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: '', phone: '', address: '', parent_name: '' })

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? '',
        phone: profile.phone ?? '',
        address: profile.address ?? '',
        parent_name: profile.parent_name ?? '',
      })
    }
  }, [profile])

  const myAttendance = attendance.filter((a) => a.student_id === profile?.id)
  const rate = myAttendance.length
    ? Math.round((myAttendance.filter((a) => a.status === 'present').length / myAttendance.length) * 100)
    : 0
  const avg = average(grades.filter((g) => g.student_id === profile?.id).map((g) => g.score))
  const subCount = submissions.filter((s) => s.student_id === profile?.id).length

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (form.full_name.trim().length < 3) return toast.error('Nama minimal 3 karakter.')
    setSaving(true)
    const { error } = await updateProfile({
      full_name: sanitizeText(form.full_name, 100),
      phone: sanitizeText(form.phone, 20),
      address: sanitizeText(form.address, 200),
      parent_name: sanitizeText(form.parent_name, 100),
    })
    setSaving(false)
    if (error) return toast.error(error)
    setEditing(false)
    toast.success('Profil berhasil diperbarui.')
  }

  if (!profile) return null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil"
        description="Kelola informasi pribadi dan data kontakmu."
        action={
          !editing ? (
            <Button variant="gradient" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" /> Edit Profil
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setEditing(false)}>
              <X className="h-4 w-4" /> Batal
            </Button>
          )
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card glass className="overflow-hidden">
            <div className="relative h-28 brand-gradient">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
            </div>
            <CardContent className="-mt-12 text-center">
              <div className="relative mx-auto w-fit">
                <Avatar className="h-24 w-24 ring-4 ring-background">
                  {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
                  <AvatarFallback className="text-2xl">{initials(profile.full_name)}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => toast.info('Unggah foto tersedia setelah Supabase Storage aktif.')}
                  aria-label="Ganti foto profil"
                  className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>
              <h2 className="mt-3 text-lg font-bold">{profile.full_name}</h2>
              <p className="text-sm text-muted-foreground">NISN {profile.nisn}</p>
              <Badge className="mt-2">Siswa Kelas X-5</Badge>

              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border/60 pt-4">
                {[
                  ['Kehadiran', `${rate}%`],
                  ['Rata-rata', `${avg}`],
                  ['PR', `${subCount}`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-lg font-bold">{value}</p>
                    <p className="text-[11px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Details / form */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="lg:col-span-2">
          <Card glass>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCircle className="h-4 w-4 text-primary" /> {editing ? 'Edit Informasi' : 'Informasi Pribadi'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <form onSubmit={save} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nama Lengkap</Label>
                      <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required maxLength={100} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-ro">Email</Label>
                      <Input id="email-ro" value={profile.email} disabled className="opacity-60" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nisn-ro">NISN</Label>
                      <Input id="nisn-ro" value={profile.nisn ?? ''} disabled className="opacity-60" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">No. HP</Label>
                      <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="parent">Nama Orang Tua / Wali</Label>
                      <Input id="parent" value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} maxLength={100} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="address">Alamat</Label>
                      <Textarea id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} maxLength={200} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setEditing(false)}>Batal</Button>
                    <Button type="submit" variant="gradient" disabled={saving}>
                      {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</> : <><Save className="h-4 w-4" /> Simpan</>}
                    </Button>
                  </div>
                </form>
              ) : (
                <dl className="grid gap-4 sm:grid-cols-2">
                  {[
                    ['Nama Lengkap', profile.full_name, UserCircle],
                    ['Email', profile.email, Mail],
                    ['NISN', profile.nisn, UserCircle],
                    ['No. HP', profile.phone, Phone],
                    ['Orang Tua / Wali', profile.parent_name, Users],
                    ['Alamat', profile.address, MapPin],
                  ].map(([label, value, Icon]: any) => (
                    <div key={label} className="rounded-xl border border-border/60 bg-card/40 p-3.5">
                      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" /> {label}
                      </dt>
                      <dd className="mt-1 break-words text-sm font-medium">{value || '—'}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
