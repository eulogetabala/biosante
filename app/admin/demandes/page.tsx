import { redirect } from 'next/navigation'

import { currentAdmin } from '@/lib/auth'

import { Board } from './board'

/**
 * Board de traitement. La page ne fait que vérifier la session ; les données
 * sont lues par le composant client via `/api/appointments`.
 */

export const dynamic = 'force-dynamic'

export default async function DemandesPage() {
  const admin = await currentAdmin()
  if (!admin) redirect('/admin/login')

  return <Board admin={{ name: admin.name, email: admin.email }} />
}
