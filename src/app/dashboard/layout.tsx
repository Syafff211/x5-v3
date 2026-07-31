import { StudentSidebar } from '@/components/layout/student-sidebar'
import { AuthGuard } from '@/components/layout/auth-guard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard area="student">
      <div className="flex min-h-dvh bg-background">
        <StudentSidebar />
        <main id="main" className="min-w-0 flex-1 px-4 pb-16 pt-20 sm:px-5 lg:px-6 lg:pb-10 lg:pt-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </AuthGuard>
  )
}
