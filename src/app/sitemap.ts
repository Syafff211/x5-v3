import type { MetadataRoute } from 'next'

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://x5-sman1-purbalingga.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/auth/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/auth/forgot-password`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
