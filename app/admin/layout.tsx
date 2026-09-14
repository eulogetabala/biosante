import type { Metadata } from 'next'

/**
 * Enveloppe de l'espace d'administration.
 *
 * Aucun lien ne doit mener ici depuis le site public ni depuis un moteur de
 * recherche : l'adresse se transmet de la main à la main. `robots` suffit pour
 * l'indexation ; ce n'est pas une protection, la vraie barrière reste la
 * vérification de session faite par chaque page et chaque route API.
 */

export const metadata: Metadata = {
  title: 'Administration',
  robots: { index: false, follow: false, nocache: true },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-shell">{children}</div>
}
