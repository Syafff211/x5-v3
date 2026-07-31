import Link from 'next/link'
import { Home, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GradientOrbs } from '@/components/shared/gradient-orbs'

export default function NotFound() {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-background px-4">
      <GradientOrbs />
      <div className="relative text-center">
        <p className="text-8xl font-extrabold tracking-tight text-gradient sm:text-9xl">404</p>
        <h1 className="mt-4 text-2xl font-bold">Halaman Tidak Ditemukan</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Halaman yang kamu cari mungkin sudah dipindahkan atau tidak pernah ada.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="gradient">
            <Link href="/"><Home className="h-4 w-4" /> Kembali ke Beranda</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard"><Search className="h-4 w-4" /> Buka Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
