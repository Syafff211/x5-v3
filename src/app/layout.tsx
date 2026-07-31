import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://x5-sman1-purbalingga.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'X-5 SMAN 1 Purbalingga — Platform Kelas Digital',
    template: '%s · X-5 SMAN 1 Purbalingga',
  },
  description:
    'Platform digital kelas modern X-5 SMAN 1 Purbalingga: kehadiran, tugas, nilai, materi, galeri, pengumuman, dan chat kelas real-time.',
  keywords: ['X-5', 'SMAN 1 Purbalingga', 'kelas digital', 'e-learning', 'absensi online', 'platform sekolah'],
  authors: [{ name: 'Kelas X-5 SMAN 1 Purbalingga' }],
  applicationName: 'X-5 SMAN 1 Purbalingga',
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: siteUrl,
    siteName: 'X-5 SMAN 1 Purbalingga',
    title: 'X-5 SMAN 1 Purbalingga — Platform Kelas Digital',
    description: 'Kehadiran, tugas, nilai, materi, galeri, dan chat kelas dalam satu platform modern.',
    images: [{ url: '/og-image.svg', width: 1200, height: 630, alt: 'X-5 SMAN 1 Purbalingga' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'X-5 SMAN 1 Purbalingga — Platform Kelas Digital',
    description: 'Kehadiran, tugas, nilai, materi, galeri, dan chat kelas dalam satu platform modern.',
    images: ['/og-image.svg'],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: '/icons/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icons/apple-icon.png' }],
  },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'X-5 Kelas' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-dvh font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Lewati ke konten utama
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
