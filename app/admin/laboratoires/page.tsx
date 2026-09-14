import { redirect } from 'next/navigation'

import { currentAdmin } from '@/lib/auth'

import { LabsView } from './view'

export const dynamic = 'force-dynamic'

export default async function LaboratoiresPage() {
  const admin = await currentAdmin()
  if (!admin) redirect('/admin/login')

  return <LabsView admin={{ name: admin.name, email: admin.email }} />
}
