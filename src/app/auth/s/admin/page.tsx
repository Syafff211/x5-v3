import type { Metadata } from 'next'
import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Login Super Admin',
  description: 'Masuk ke panel Super Admin kelas X-5 SMAN 1 Purbalingga.',
  robots: { index: false, follow: false },
}

export default function SuperAdminLoginPage() {
  return (
    <AuthShell variant="red">
      <LoginForm role="super_admin" />
    </AuthShell>
  )
}
