'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Mail } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth-store'

export default function ForgotPasswordPage() {
  const resetPassword = useAuthStore((s) => s.resetPassword)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Format email tidak valid.')
      return
    }
    setLoading(true)
    const { error: err } = await resetPassword(email.trim().toLowerCase())
    setLoading(false)
    if (err) {
      setError(err)
      toast.error(err)
      return
    }
    setSent(true)
    toast.success('Link reset password telah dikirim.')
  }

  return (
    <AuthShell>
      {sent ? (
        <div className="text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-500">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Cek Email Kamu</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kami sudah mengirim link reset password ke <span className="font-medium text-foreground">{email}</span>.
            Cek juga folder spam jika tidak muncul dalam beberapa menit.
          </p>
          <Button asChild variant="outline" className="mt-6 w-full">
            <Link href="/auth/login">
              <ArrowLeft className="h-4 w-4" /> Kembali ke Login
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl brand-gradient text-white shadow-lg shadow-primary/30">
              <KeyRound className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Lupa Password</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Masukkan email terdaftar, kami akan kirim link untuk mengatur ulang password.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nama@student.sman1purbalingga.sch.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" variant="gradient" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Mengirim...
                </>
              ) : (
                'Kirim Link Reset'
              )}
            </Button>
          </form>

          <div className="mt-6 border-t border-border/60 pt-5 text-center text-sm text-muted-foreground">
            Ingat password?{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Kembali ke Login
            </Link>
          </div>
        </>
      )}
    </AuthShell>
  )
}
