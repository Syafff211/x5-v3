'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { KeyRound, Loader2, Lock } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError('Password minimal 8 karakter.')
    if (password !== confirm) return setError('Konfirmasi password tidak cocok.')

    setLoading(true)
    const supabase = createClient()
    if (supabase) {
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) {
        setLoading(false)
        setError(err.message)
        return
      }
    } else {
      await new Promise((r) => setTimeout(r, 600))
    }
    setLoading(false)
    toast.success('Password berhasil diperbarui.')
    router.push('/auth/login')
  }

  return (
    <AuthShell>
      <div className="mb-7 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl brand-gradient text-white shadow-lg shadow-primary/30">
          <KeyRound className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Atur Password Baru</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Gunakan minimal 8 karakter yang kuat dan mudah diingat.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="pw">Password Baru</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="pw" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" placeholder="••••••••" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pw2">Konfirmasi Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="pw2" type="password" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="pl-9" placeholder="••••••••" />
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" variant="gradient" className="w-full" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</> : 'Simpan Password'}
        </Button>
      </form>

      <div className="mt-6 border-t border-border/60 pt-5 text-center text-sm text-muted-foreground">
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          Kembali ke Login
        </Link>
      </div>
    </AuthShell>
  )
}
