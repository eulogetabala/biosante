import { redirect } from 'next/navigation'

import { currentAdmin } from '@/lib/auth'

import { PatientsView } from './view'

export const dynamic = 'force-dynamic'

export default async function PatientsPage() {
  const admin = await currentAdmin()
  if (!admin) redirect('/admin/login')

  return <PatientsView admin={{ name: admin.name, email: admin.email }} />
}
