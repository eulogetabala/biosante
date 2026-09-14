import { redirect } from 'next/navigation'

import { currentAdmin } from '@/lib/auth'

import { CalendarView } from './view'

export const dynamic = 'force-dynamic'

export default async function CalendrierPage() {
  const admin = await currentAdmin()
  if (!admin) redirect('/admin/login')

  return <CalendarView admin={{ name: admin.name, email: admin.email }} />
}
