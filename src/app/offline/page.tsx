import Link from 'next/link'
import { CloudOff, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Offline', robots: { index: false } }

export default function OfflinePage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <CloudOff className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">Kamu Sedang Offline</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Halaman ini belum tersimpan di cache. Periksa koneksi internetmu lalu coba lagi. Halaman yang pernah dibuka
          tetap bisa diakses secara offline.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="gradient">
            <Link href="/dashboard"><RefreshCcw className="h-4 w-4" /> Coba Lagi</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
