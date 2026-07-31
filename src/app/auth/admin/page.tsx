import type { Metadata } from 'next'
import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Login Admin',
  description: 'Masuk ke panel admin kelas X-5 SMAN 1 Purbalingga.',
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  return (
    <AuthShell variant="red">
      <LoginForm role="admin" />
    </AuthShell>
  )
}
