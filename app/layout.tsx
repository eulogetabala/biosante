import { Montserrat, Plus_Jakarta_Sans } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import 'leaflet/dist/leaflet.css'
import './globals.css'

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
  // Nécessaire pour que og:image reçoive une URL absolue : les robots des
  // réseaux sociaux n'acceptent pas de chemin relatif.
  metadataBase: new URL(`https://${site.domain}`),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description:
    'Groupe Bio Santé Diagnostic : laboratoires d’analyses médicales à Brazzaville (Mpila et Cité Flamboyants), hématologie, microbiologie, biochimie et biologie moléculaire.',
  // Le logo du groupe sert d'icône d'onglet. Les fichiers vivent dans app/ :
  // Next.js les détecte, sert /icon.png et /apple-icon.png, et injecte les
  // balises <link> correspondantes. Inutile de déclarer favicon.ico ici, Next.js
  // l'ajoute déjà de son côté.
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png', sizes: '512x512' }],
    apple: [{ url: '/apple-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description:
      'Laboratoires d’analyses médicales à Brazzaville : Mpila et Cité Flamboyants.',
    images: [{ url: '/icon.png', width: 512, height: 512, alt: site.name }],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

/**
 * Racine minimale : polices, styles et <html>. Le chrome public (Nav, Footer,
 * Analytics) vit dans le layout du groupe `(site)`, pas ici — sinon l'espace
 * d'administration `/admin` hériterait du menu et du pied de page du site.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${jakarta.variable} ${montserrat.variable} bg-white`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
