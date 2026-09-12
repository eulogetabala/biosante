import { Analytics } from '@vercel/analytics/next'
import { Montserrat, Plus_Jakarta_Sans } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import 'leaflet/dist/leaflet.css'
import './globals.css'

import { Footer } from '@/components/layout/Footer'
import { Nav } from '@/components/brand/Nav'
import { site } from '@/lib/site'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description:
    'Groupe Bio Santé Diagnostic : laboratoires d’analyses médicales à Brazzaville (Mpila et Cité Flamboyants), hématologie, microbiologie, biochimie et biologie moléculaire.',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${jakarta.variable} ${montserrat.variable} bg-white`}>
      <body className="antialiased">
        <Nav />
        {children}
        <Footer />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
