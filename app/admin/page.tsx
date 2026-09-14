import { redirect } from 'next/navigation'

import { currentAdmin } from '@/lib/auth'

import { Console } from './console'

/**
 * Vue d'ensemble.
 *
 * La page ne fait que deux choses : vérifier la session, puis céder la main au
 * composant client. Celui-ci lit les demandes via `/api/appointments`, la même
 * source que toutes les autres vues — les compteurs du menu ne peuvent donc
 * pas contredire ceux de la page.
 *
 * Aucune donnée n'est chargée ici : un second chemin de lecture devrait être
 * maintenu en cohérence avec le premier, pour aucun bénéfice visible.
 */

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const admin = await currentAdmin()
  if (!admin) redirect('/admin/login')

  return <Console admin={{ name: admin.name, email: admin.email }} />
}
