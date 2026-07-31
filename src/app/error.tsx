'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">Terjadi Kesalahan</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Maaf, terjadi kesalahan tak terduga. Coba muat ulang halaman ini.
        </p>
        <Button variant="gradient" className="mt-8" onClick={reset}>
          <RefreshCcw className="h-4 w-4" /> Muat Ulang
        </Button>
      </div>
    </div>
  )
}
