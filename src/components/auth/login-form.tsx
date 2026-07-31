'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, GraduationCap, Loader2, Lock, Mail, Shield, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth-store'
import type { Role } from '@/types/database'
import { HOME_PATH } from '@/lib/rbac'
import { cn } from '@/lib/utils'

interface LoginFormProps {
  role: Role
}

export function LoginForm({ role }: LoginFormProps) {
  const router = useRouter()
  const signIn = useAuthStore((s) => s.signIn)
  const loading = useAuthStore((s) => s.loading)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSuper = role === 'super_admin'
  const isAdmin = role === 'admin' || isSuper

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Format email tidak valid.')
      return
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }

    const { error: err } = await signIn(email.trim().toLowerCase(), password, role)
    if (err) {
      setError(err)
      toast.error(err)
      return
    }
    toast.success(
      isSuper ? 'Selamat datang, Super Admin!' : isAdmin ? 'Selamat datang, Admin!' : 'Login berhasil. Selamat belajar!'
    )
    router.push(HOME_PATH[role])
    router.refresh()
  }

  return (
    <>
      <div className="mb-7 text-center">
        <div
          className={cn(
            'mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl text-white shadow-lg',
            isSuper
              ? 'bg-gradient-to-br from-amber-500 to-rose-600 shadow-amber-500/30'
              : isAdmin
                ? 'bg-gradient-to-br from-rose-500 to-purple-600 shadow-rose-500/30'
                : 'brand-gradient shadow-primary/30'
          )}
        >
          {isSuper ? <ShieldCheck className="h-7 w-7" /> : isAdmin ? <Shield className="h-7 w-7" /> : <GraduationCap className="h-7 w-7" />}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isSuper ? 'Login Super Admin' : isAdmin ? 'Login Admin' : 'Login Siswa'}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isSuper
            ? 'Kendali penuh sistem kelas X-5'
            : isAdmin
              ? 'Panel operasional harian kelas X-5'
              : 'Masuk ke dashboard kelas X-5'}
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
              inputMode="email"
              autoComplete="email"
              required
              placeholder={
                isSuper ? 'superadmin@x5-sman1.web.id' : isAdmin ? 'admin@x5-sman1.web.id' : 'namadepan@x5-sman1.web.id'
              }
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
              aria-invalid={!!error}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
              Lupa password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 pr-10"
              aria-invalid={!!error}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className={cn(
            'w-full',
            isSuper
              ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-lg shadow-amber-500/25 hover:brightness-110'
              : isAdmin
                ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg shadow-rose-500/25 hover:brightness-110'
                : 'brand-gradient text-white shadow-lg shadow-primary/25 hover:brightness-110'
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Memproses...
            </>
          ) : isSuper ? (
            'Masuk sebagai Super Admin'
          ) : isAdmin ? (
            'Masuk sebagai Admin'
          ) : (
            'Masuk'
          )}
        </Button>
      </form>

      <div className="mt-6 border-t border-border/60 pt-5 text-center text-sm text-muted-foreground">
        {isSuper ? (
          <>
            Bukan super admin?{' '}
            <Link href="/auth/admin" className="font-medium text-primary hover:underline">
              Login Admin
            </Link>
            {' · '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Login Siswa
            </Link>
          </>
        ) : isAdmin ? (
          <>
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Login Siswa
            </Link>
            {' · '}
            <Link href="/auth/s/admin" className="font-medium text-primary hover:underline">
              Login Super Admin
            </Link>
          </>
        ) : (
          <>
            Pengurus kelas?{' '}
            <Link href="/auth/admin" className="font-medium text-primary hover:underline">
              Login sebagai Admin
            </Link>
          </>
        )}
      </div>
    </>
  )
}
