import { NextResponse } from 'next/server'

import { currentAdmin } from '@/lib/auth'
import { parseAppointment } from '@/lib/appointments'
import { APPOINTMENTS, db } from '@/lib/firebase-admin'
import { channels } from '@/lib/notify'
import { timeSlotGroups } from '@/lib/site'

/**
 * Validation, annulation ou confirmation d'un rendez-vous.
 *
 * Route protégée : l'identité de l'administrateur est revérifiée à chaque
 * appel. La confirmation ne notifie pas le patient elle-même — aucun service
 * d'envoi automatique n'est branché. Elle renvoie à la place le lien WhatsApp
 * prêt à ouvrir, que le tableau de bord transforme en fenêtre de conversation.
 */

const SLOTS = timeSlotGroups.flatMap((group) => group.slots)

/** Actions acceptées. */
type Action =
  /** Retient un créneau, prépare le message, et engage le rendez-vous. */
  | 'confirm'
  /** Annule la demande. */
  | 'cancel'
  /** Marque le rappel comme transmis. */
  | 'reminded'

function readAction(value: unknown): Action {
  if (value === 'cancel') return 'cancel'
  if (value === 'reminded') return 'reminded'
  return 'confirm'
}

export async function POST(request: Request) {
  const admin = await currentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Session expirée.' }, { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as
    | { id?: unknown; date?: unknown; time?: unknown; action?: unknown }
    | null

  const id = typeof payload?.id === 'string' ? payload.id : ''
  const action = readAction(payload?.action)

  if (!id) {
    return NextResponse.json({ error: 'Demande introuvable.' }, { status: 400 })
  }

  const reference = db().collection(APPOINTMENTS).doc(id)

  try {
    const snapshot = await reference.get()
    if (!snapshot.exists) {
      return NextResponse.json({ error: 'Demande supprimée.' }, { status: 404 })
    }

    /* -------------------------------------------------------------- */
    /* Annulation                                                     */
    /* -------------------------------------------------------------- */

    if (action === 'cancel') {
      await reference.update({
        status: 'annulee',
        cancelledAt: new Date().toISOString(),
        cancelledBy: admin.email,
      })
      return NextResponse.json({ ok: true })
    }

    /* -------------------------------------------------------------- */
    /* Rappel transmis                                                */
    /* -------------------------------------------------------------- */

    // On ne date que le rappel. La confirmation, elle, engage le rendez-vous
    // depuis le geste « Confirmer » : la redater ici serait redondant.
    if (action === 'reminded') {
      await reference.update({
        remindedAt: new Date().toISOString(),
        remindedBy: admin.email,
      })
      return NextResponse.json({ ok: true })
    }

    /* -------------------------------------------------------------- */
    /* Validation du créneau                                          */
    /* -------------------------------------------------------------- */

    const date = typeof payload?.date === 'string' ? payload.date.trim() : ''
    const time = typeof payload?.time === 'string' ? payload.time.trim() : ''

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Choisissez une date valide.' }, { status: 400 })
    }
    if (!SLOTS.includes(time)) {
      return NextResponse.json({ error: 'Choisissez un créneau valide.' }, { status: 400 })
    }

    await reference.update({
      status: 'confirmee',
      confirmedDate: date,
      confirmedTime: time,
      confirmedBy: admin.email,
      confirmedAt: new Date().toISOString(),
      // Confirmer engage le rendez-vous : le geste ouvre la conversation dans
      // la foulée, donc le patient est prévenu à cet instant précis. On le date
      // ici plutôt que d'attendre un second clic de confirmation d'envoi, qui
      // faisait quitter la ligne de sa propre vue.
      //
      // Sans envoi effectif — l'administrateur ferme la messagerie — la ligne
      // reste marquée prévenue à tort. C'est le prix assumé d'un parcours à un
      // seul geste ; « Rappeler » rattrape le cas.
      notifiedAt: new Date().toISOString(),
      notifiedBy: admin.email,
      // Un rappel daté ne vaut plus rien si le créneau change : le patient a
      // été prévenu d'une heure qui n'est plus la bonne.
      remindedAt: null,
    })

    const appointment = parseAppointment(id, {
      ...snapshot.data(),
      status: 'confirmee',
      confirmedDate: date,
      confirmedTime: time,
    })

    // Le lien est calculé côté serveur, à partir du numéro et de l'indicatif
    // enregistrés : le tableau de bord n'a pas à reconstituer le numéro.
    const ready = channels(appointment, 'confirmation')

    return NextResponse.json({
      ok: true,
      whatsapp: ready.whatsapp,
      sms: ready.sms,
      message: ready.message,
      number: ready.number,
      valid: ready.valid,
    })
  } catch (error) {
    console.error('[confirm] Mise à jour impossible :', error)
    return NextResponse.json(
      { error: 'La mise à jour n’a pas abouti. Réessayez.' },
      { status: 500 },
    )
  }
}
