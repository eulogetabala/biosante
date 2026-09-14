import { NextResponse } from 'next/server'

import { parseAppointment, type Appointment } from '@/lib/appointments'
import { currentAdmin } from '@/lib/auth'
import { APPOINTMENTS, db } from '@/lib/firebase-admin'

/**
 * Lecture des demandes pour l'espace d'administration.
 *
 * Les vues d'administration sont des composants clients : elles ont besoin des
 * demandes pour filtrer, rechercher et grouper sans aller-retour réseau à
 * chaque frappe. Cette route est donc leur unique source, et elle refait le
 * contrôle de session — une route API n'hérite d'aucune protection parce
 * qu'elle est rangée sous `/admin`.
 *
 * Volontairement limitée à la lecture : toutes les écritures passent par
 * `/api/confirm`, qui revalide les créneaux côté serveur.
 */

export const dynamic = 'force-dynamic'

/** Nombre de demandes servies. Au-delà, il faudra paginer. */
const PAGE_SIZE = 300

export async function GET() {
  const admin = await currentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Session expirée.' }, { status: 401 })
  }

  try {
    const snapshot = await db()
      .collection(APPOINTMENTS)
      .orderBy('createdAt', 'desc')
      .limit(PAGE_SIZE)
      .get()

    const appointments: Appointment[] = snapshot.docs.map((doc) =>
      parseAppointment(doc.id, doc.data()),
    )

    return NextResponse.json(
      { appointments, email: admin.email },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[admin] Lecture des demandes impossible :', error)
    return NextResponse.json({ error: 'Lecture des demandes impossible.' }, { status: 503 })
  }
}
