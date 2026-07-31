import type { Metadata } from 'next'
import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Login Siswa',
  description: 'Masuk ke dashboard siswa kelas X-5 SMAN 1 Purbalingga.',
}

export default function StudentLoginPage() {
  return (
    <AuthShell variant="indigo">
      <LoginForm role="student" />
    </AuthShell>
  )
}
