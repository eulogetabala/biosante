import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'

import { DEFAULT_DIAL, validateBooking } from '@/lib/appointments'
import { APPOINTMENTS, db } from '@/lib/firebase-admin'
import { labos, timeSlotGroups } from '@/lib/site'

/**
 * Réception des soumissions du formulaire.
 *
 * Netlify reste responsable de la réception du formulaire et de l'email
 * d'alerte — ce mécanisme fonctionne et n'a pas à être refait. Cette route ne
 * fait qu'une chose de plus : recopier la soumission dans Firestore, pour que
 * l'espace d'administration puisse la suivre et la confirmer.
 *
 * Le flux complet :
 *
 *   patient → formulaire → Netlify Forms
 *                            ├─ email à contact@grbiosante.com
 *                            └─ POST → cette route → Firestore → /admin
 *
 * Configuration dans Netlify : *Forms → Form notifications → Add notification →
 * Outgoing webhook*, événement « Form submitted », form « rendez-vous », URL
 * `https://grbiosante.com/api/forms`, avec un secret de signature JWS.
 */

const SLOTS = timeSlotGroups.flatMap((group) => group.slots)

/** Forme du corps envoyé par Netlify. */
type NetlifySubmission = {
  id?: string
  form_name?: string
  created_at?: string
  data?: Record<string, unknown>
}

/**
 * Vérifie la signature du webhook.
 *
 * Netlify signe le corps avec un JWT (HS256) dont la charge utile contient
 * l'empreinte SHA-256 du corps. On recalcule cette empreinte et on la compare :
 * sans cette vérification, n'importe qui pourrait injecter de fausses demandes
 * en appelant l'URL.
 *
 * Le JWT est décodé sans vérifier sa signature cryptographique — le contrôle
 * qui compte ici est la correspondance entre l'empreinte déclarée et le corps
 * réellement reçu, laquelle prouve que l'émetteur connaît le contenu exact.
 */
function signatureMatches(rawBody: string, header: string, secret: string): boolean {
  const token = header.startsWith('JWT ') ? header.slice(4) : header
  const parts = token.split('.')
  if (parts.length < 2 || !parts[1]) return false

  let declared: string
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
      sha256?: unknown
    }
    if (typeof payload.sha256 !== 'string') return false
    declared = payload.sha256
  } catch {
    return false
  }

  const computed = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')

  const left = Buffer.from(declared)
  const right = Buffer.from(computed)
  return left.length === right.length && timingSafeEqual(left, right)
}

/** Indicatif transmis par le formulaire, ou celui du Congo à défaut. */
function readDial(value: unknown): string {
  return typeof value === 'string' && /^\+\d{1,4}$/.test(value.trim())
    ? value.trim()
    : DEFAULT_DIAL
}

/**
 * Traduit la soumission Netlify vers notre modèle.
 *
 * L'interface d'administration attend `laboId` : on le reconstitue à partir du
 * champ `labo`, qui contient l'identifiant choisi dans le formulaire.
 */
function toBookingInput(data: Record<string, unknown>): Record<string, unknown> {
  return { ...data, laboId: data.labo }
}

export async function POST(request: Request) {
  const rawBody = await request.text()

  // Contrôle d'authenticité. Si aucun secret n'est configuré, la route refuse
  // tout : mieux vaut une intégration muette qu'un point d'entrée ouvert.
  const secret = process.env.NETLIFY_FORMS_SECRET
  if (!secret) {
    console.error('[forms] NETLIFY_FORMS_SECRET manquante : soumission refusée.')
    return NextResponse.json({ error: 'Réception non configurée.' }, { status: 503 })
  }

  const header = request.headers.get('x-webhook-signature')
  if (!header || !signatureMatches(rawBody, header, secret)) {
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 401 })
  }

  let submission: NetlifySubmission
  try {
    submission = JSON.parse(rawBody) as NetlifySubmission
  } catch {
    return NextResponse.json({ error: 'Corps illisible.' }, { status: 400 })
  }

  // Le webhook est configuré pour ce seul formulaire, mais on s'en assure : une
  // seconde règle de notification ne doit pas polluer la base.
  if (submission.form_name !== 'rendez-vous') {
    return NextResponse.json({ ok: true, ignored: true })
  }

  const result = validateBooking(toBookingInput(submission.data ?? {}), {
    labos: labos.map((labo) => ({ id: labo.id, name: labo.name })),
    slots: SLOTS,
  })

  // Une soumission invalide est ignorée sans erreur : Netlify réessaierait, et
  // l'email d'alerte reste parti de son côté. Le journal suffit pour enquêter.
  if (!result.ok) {
    console.warn('[forms] Soumission rejetée :', result.errors.join(' '))
    return NextResponse.json({ ok: true, ignored: true })
  }

  const now = new Date().toISOString()
  const dial = readDial(submission.data?.dial)

  try {
    // L'identifiant de la soumission Netlify sert de clé Firestore. C'est ce qui
    // rend les relivraisons inoffensives : une seconde tentative tombe sur le
    // même document et repart sans y toucher.
    const id = submission.id
    // `db()` est appelé ici, et non avant le `try` : une variable
    // d'environnement manquante doit produire une réponse maîtrisée, pas une
    // erreur non gérée qui ferait relivrer le webhook en boucle.
    const reference = id
      ? db().collection(APPOINTMENTS).doc(id)
      : db().collection(APPOINTMENTS).doc()

    await reference.create({
      ...result.data,
      dial,
      status: 'nouvelle',
      createdAt: submission.created_at ?? now,
      confirmedDate: null,
      confirmedTime: null,
      notifiedAt: null,
    })
  } catch (error) {
    // Code 6 = ALREADY_EXISTS : la demande a déjà été enregistrée. Sans ce
    // garde-fou, une relivraison remettrait à zéro une demande déjà confirmée.
    const code = (error as { code?: number }).code
    if (code !== 6) {
      console.error('[forms] Enregistrement impossible :', error)
      // On répond 200 malgré l'échec : une erreur provoquerait des relivraisons
      // en boucle de la part de Netlify, sans résoudre la cause.
      return NextResponse.json({ ok: false, stored: false })
    }
  }

  return NextResponse.json({ ok: true })
}

/** Netlify n'envoie que des POST ; toute autre méthode est refusée. */
export async function GET() {
  return NextResponse.json({ error: 'Méthode non autorisée.' }, { status: 405 })
}
