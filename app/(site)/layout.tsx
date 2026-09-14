import { Analytics } from '@vercel/analytics/next'

import { Footer } from '@/components/layout/Footer'
import { Nav } from '@/components/brand/Nav'

/**
 * Layout du site public.
 *
 * Le nom du dossier, `(site)`, est un groupe de routes : les parenthèses sont
 * retirées de l'URL. Les pages qu'il contient restent donc servies à la racine
 * (`/`, `/laboratoire`, `/services`, `/contact`), tout en partageant ce chrome.
 *
 * C'est ce découpage qui permet à `/admin` de vivre dans le même déploiement
 * sans hériter de la navigation grand public.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      {children}
      <Footer />
      {process.env.NODE_ENV === 'production' && <Analytics />}
    </>
  )
}
