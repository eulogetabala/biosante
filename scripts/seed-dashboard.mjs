/**
 * Jeu de démonstration : remplit le tableau de bord de demandes fictives.
 *
 * À quoi ça sert : avec trois demandes réelles, la courbe d'activité est
 * plate, le beignet se réduit à une part et le calendrier est vide. Impossible
 * de juger un design dans ces conditions. Ce script fabrique une trentaine de
 * demandes réparties sur trois mois, avec des états variés, pour que chaque
 * vue de la console ait de quoi s'afficher.
 *
 * L'objectif est de l'écrire exactement comme le ferait le webhook Netlify :
 * mêmes champs, mêmes types, même route. Sinon on jugerait un design sur des
 * données qui n'existent pas en production.
 *
 * ─── Comment les retirer ────────────────────────────────────────────────────
 * Chaque document porte `demo: true`. Ces demandes sont donc supprimables sans
 * risquer d'emporter les vraies :
 *
 *   node scripts/seed-dashboard.mjs --purge
 *
 * La purge ne supprime QUE les documents marqués. Les demandes réelles, qui
 * n'ont pas ce champ, sont laissées intactes.
 *
 * ─── Usage ─────────────────────────────────────────────────────────────────
 *   npm run dev                        (dans un autre terminal)
 *   node scripts/seed-dashboard.mjs --nombre 36
 *   node scripts/seed-dashboard.mjs    (valeur par défaut : 36)
 *   node scripts/seed-dashboard.mjs --purge
 *
 * Prérequis : le même que `test-webhook.mjs` — NETLIFY_FORMS_SECRET dans `.env`.
 * Les demandes passent par `/api/forms`, donc par la validation réelle du
 * serveur. Un jeu de données qui contournerait cette validation pourrait
 * contenir des états que le système ne sait pas produire.
 */

import { createHmac, randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'

import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

/* ---------------------------------------------------------------- */
/* Configuration                                                      */
/* ---------------------------------------------------------------- */

const BASE = process.env.SEED_BASE_URL ?? 'http://localhost:3000'

/** Collection Firestore. Doit rester aligné sur `APPOINTMENTS`. */
const APPOINTMENTS = 'rendez-vous'

/** Doit rester aligné sur les identifiants de `lib/site.ts`. */
const LABOS = [
  { id: 'mpila', label: 'Laboratoire Mpila', weight: 0.55 },
  { id: 'flamboyants', label: 'Laboratoire Flamboyants', weight: 0.45 },
]

/** Aligné sur `services` de `lib/site.ts`. Les poids suivent l'activité
 *  attendue d'un laboratoire : la biochimie et l'hématologie dominent. */
const SERVICES = [
  { title: 'Hématologie', weight: 0.24 },
  { title: 'Biochimie & Biologie moléculaire', weight: 0.2 },
  { title: 'Immuno-sérologie', weight: 0.17 },
  { title: 'Microbiologie', weight: 0.15 },
  { title: 'Hormonologie', weight: 0.16 },
  { title: 'Toxicologie', weight: 0.08 },
]

const DIALS = [
  { dial: '+242', weight: 0.82 },
  { dial: '+243', weight: 0.18 },
]

/** Prénoms et noms courants à Brazzaville, pour éviter « Patient 1 », « Patient 2 ». */
const FIRST_NAMES = [
  'Jean', 'Marie', 'Paul', 'Sophie', 'Léonie', 'Awa', 'Didier', 'Chantal', 'Prosper', 'Sylvie',
  'Jean-Claude', 'Bénédicte', 'Alain', 'Nadège', 'Firmin', 'Clarisse', 'Rodrigue', 'Esther',
  'Blaise', 'Léontine', 'Hervé', 'Mireille', 'Serge', 'Josiane', 'Célestin', 'Prisca',
  'Ange', 'Rachelle', 'Guy', 'Adèle',
]

const LAST_NAMES = [
  'Mbemba', 'Loemba', 'Ngoma', 'Dioulo', 'Mabiala', 'Nkodia', 'Bouanga', 'Moukala',
  'Okemba', 'Tsoumou', 'Makosso', 'Bikindou', 'Ngombe', 'Samba', 'Itoua', 'Malonga',
  'Batchy', 'Kimbembe', 'Ntsiba', 'Poaty', 'Gouala', 'Ondongo', 'Ellenga', 'Massamba',
]

/** Messages plausibles. Beaucoup de demandes n'en portent pas. */
const MESSAGES = [
  '',
  '',
  '',
  'Prélèvement à jeun, si possible le matin.',
  'Disponible en fin de journée après 17h.',
  'Patient suivi pour diabète, analyse de contrôle.',
  'Bilan demandé par le médecin traitant.',
  'Je viendrai accompagné, merci de prévoir une chaise.',
  'Préférence pour un créneau tôt le matin.',
  'Contrôle de grossesse, ordonnance disponible.',
  'Première visite dans ce laboratoire.',
  'Résultats à transmettre au docteur Nkodia.',
]

const EMAIL_DOMAINS = ['gmail.com', 'yahoo.fr', 'outlook.com', 'grbiosante.com']

/** Tirage pondéré : renvoie l'un des éléments, selon son poids. */
function weighted(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0)
  let ticket = Math.random() * total
  for (const item of items) {
    ticket -= item.weight
    if (ticket <= 0) return item
  }
  return items[items.length - 1]
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

/* ---------------------------------------------------------------- */
/* Lecture minimale du fichier .env                                   */
/* ---------------------------------------------------------------- */

function readEnv() {
  let raw
  try {
    raw = readFileSync(new URL('../.env', import.meta.url), 'utf8')
  } catch {
    console.error('Fichier .env introuvable. Copiez .env.example en .env.')
    process.exit(1)
  }

  const values = {}
  for (const line of raw.split('\n')) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim())
    if (match) values[match[1]] = match[2].replace(/^["']|["']$/g, '')
  }
  return values
}

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`)
  return index !== -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

/* ---------------------------------------------------------------- */
/* Fabrication d'une demande                                          */
/* ---------------------------------------------------------------- */

/** Date ISO décalée de `days` jours (négatif = passé). */
function shiftDays(days) {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/**
 * Créneaux réellement proposés par le formulaire.
 *
 * Générés plutôt que recopiés de `lib/site.ts` : une recopie manuelle avait
 * déjà laissé tomber la moitié des demi-heures. Un créneau hors liste serait
 * rejeté par la validation du serveur, et le script le signalerait — mais
 * autant ne pas produire l'erreur.
 */
const SLOTS = (() => {
  const list = []
  for (let minutes = 0; minutes < 24 * 60; minutes += 30) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, '0')
    const minute = String(minutes % 60).padStart(2, '0')
    list.push(`${hour}:${minute}`)
  }
  return list
})()

/**
 * Heure de rendez-vous vraisemblable.
 *
 * Un laboratoire ouvert 24h/24 reçoit surtout en journée : on tire l'heure dans
 * une distribution qui privilégie 7h–17h, avec une queue la nuit. Une
 * répartition uniforme donnerait autant de rendez-vous à 3h qu'à 9h, et la
 * charge horaire du tableau de bord serait un faux plat sans intérêt.
 */
function plausibleSlot() {
  const roll = Math.random()
  let slot

  if (roll < 0.62) slot = pick(SLOTS.slice(14, 33)) // 07h00 – 16h00, cœur de journée
  else if (roll < 0.85) slot = pick(SLOTS) // amplitude complète
  else slot = pick(SLOTS.slice(0, 12).concat(SLOTS.slice(36))) // nuit : 00h – 05h30, 18h – 23h30

  return slot
}

/** Numéro local congolais : 9 chiffres commençant par 0. */
function localPhone() {
  const prefix = pick(['06', '05', '04'])
  let rest = ''
  for (let index = 0; index < 7; index += 1) rest += randomInt(0, 9)
  return `${prefix}${rest}`
}

function person() {
  const first = pick(FIRST_NAMES)
  const last = pick(LAST_NAMES)
  const name = `${first} ${last}`
  const email = `${first.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')}.${last.toLowerCase().replace(/[^a-z]/g, '')}@${pick(EMAIL_DOMAINS)}`

  return { name, email, phone: localPhone() }
}

/**
 * Répartit les demandes dans le temps.
 *
 * Renvoie deux décalages en jours : `created` (le dépôt, toujours passé) et
 * `slot` (le rendez-vous, qui peut être passé pour les dossiers anciens).
 *
 * Deux tiers des demandes sont déposées sur les quinze derniers jours, pour que
 * la courbe d'activité soit vivante ; le tiers restant remonte à trois mois,
 * pour que la tendance mensuelle et le beignet aient du volume.
 */
function timeline(index, total) {
  const recentCount = Math.round(total * 0.66)

  if (index < recentCount) {
    const created = -randomInt(0, 14)
    return { created, slot: created + randomInt(1, 21) }
  }

  const created = -randomInt(15, 85)
  return { created, slot: created + randomInt(1, 30) }
}

/**
 * Construit la demande.
 *
 * L'état est choisi d'abord, et la chronologie s'y adapte : une demande
 * « Annulée » n'a pas de créneau confirmé, une demande « Notifiée » en a
 * forcément un, et une « Reçue » ne peut pas l'être. Tirer les états
 * indépendamment de la chronologie produirait des combinaisons impossibles.
 *
 * `slot` (le décalage réel du rendez-vous) est conservé à part : la route
 * refuse une date passée, donc on lui enverra une date future, puis on
 * réécrira la vraie date par Firestore. Sans cette précaution, seuls les
 * rendez-vous à venir pourraient être créés, et l'historique resterait vide.
 */
function buildDemande(index, total) {
  const who = person()
  const labo = weighted(LABOS)
  const service = weighted(SERVICES)
  const { dial } = weighted(DIALS)
  const { created, slot } = timeline(index, total)

  const roll = Math.random()
  let status = 'nouvelle'
  let confirmed = null
  let notifiedAt = null

  if (roll < 0.5) {
    // Reçue : le cas le plus courant, c'est ce qui attend un geste.
    status = 'nouvelle'
  } else if (roll < 0.68) {
    // Confirmée mais pas transmise : celle qui doit alerter.
    status = 'confirmee'
    confirmed = { date: shiftDays(slot), time: plausibleSlot() }
    notifiedAt = null
  } else if (roll < 0.94) {
    // Notifiée : dossier clos.
    status = 'confirmee'
    confirmed = { date: shiftDays(slot), time: plausibleSlot() }
    // Prévenu dans les heures qui suivent la confirmation, jamais avant.
    const notified = new Date()
    notified.setUTCDate(notified.getUTCDate() + slot)
    notified.setUTCHours(randomInt(7, 19), randomInt(0, 59), 0, 0)
    notifiedAt = notified.toISOString()
  } else {
    status = 'annulee'
  }

  const stampedAt = new Date()
  stampedAt.setUTCDate(stampedAt.getUTCDate() + created)
  stampedAt.setUTCHours(randomInt(6, 21), randomInt(0, 59), 0, 0)

  const requestedAt = shiftDays(slot)
  const createdAt = stampedAt.toISOString()

  return {
    id: randomUUID(),
    created_at: createdAt,
    data: {
      name: who.name,
      phone: who.phone,
      dial,
      email: who.email,
      service: service.title,
      labo: labo.id,
      // Date envoyée à la route : future, sinon la validation la refuse.
      date: shiftDays(Math.max(slot, 1)),
      time: plausibleSlot(),
      message: pick(MESSAGES),
    },
    /** Champs hors formulaire, écrits directement dans Firestore après coup. */
    _history: {
      createdAt,
      date: requestedAt,
      confirmedDate: confirmed?.date ?? null,
      confirmedTime: confirmed?.time ?? null,
      notifiedAt,
      status,
    },
  }
}

/* ---------------------------------------------------------------- */
/* Envoi                                                              */
/* ---------------------------------------------------------------- */

/** Reproduit l'en-tête de Netlify : JWT dont la charge utile porte le SHA-256. */
function signatureFor(body, secret) {
  const sha256 = createHmac('sha256', secret).update(body, 'utf8').digest('hex')
  const claims = Buffer.from(JSON.stringify({ iss: 'netlify', sha256 })).toString('base64url')
  return `JWT ${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${claims}.seed`
}

/**
 * Envoie la demande à la route, dans l'enveloppe exacte de Netlify.
 *
 * L'enveloppe est construite ici et non dans `buildDemande` : c'est la forme
 * que le webhook reçoit, et `form_name` en fait partie. L'oublier fait
 * répondre « ignoré » sans autre explication, la route filtrant sur ce champ.
 */
async function post(payload, secret) {
  const body = JSON.stringify({
    id: payload.id,
    form_name: 'rendez-vous',
    created_at: payload.created_at,
    data: payload.data,
  })

  const response = await fetch(`${BASE}/api/forms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Webhook-Signature': signatureFor(body, secret) },
    body,
  })

  return { status: response.status, result: await response.json().catch(() => null) }
}

/**
 * Poste une demande, puis rétablit son historique réel.
 *
 * Le webhook crée toujours le document à l'état `nouvelle`, avec la date reçue.
 * Pour obtenir un jeu varié — dépôts étalés sur trois mois, rendez-vous passés,
 * confirmations en attente — il faut réécrire ensuite `createdAt`, `date`,
 * `status`, `confirmedDate`, `confirmedTime` et `notifiedAt`. C'est ce que le
 * système fait normalement au fil de l'eau, par `/api/confirm`.
 *
 * On passe par Firestore directement pour ce rattrapage : rejouer
 * `/api/confirm` exigerait une session d'administration et déclencherait
 * l'ouverture de WhatsApp à chaque demande.
 */
async function seedOne(payload, secret, db) {
  const created = await post(payload, secret)
  if (!created.result?.ok || created.result.ignored) return created

  await db
    .collection(APPOINTMENTS)
    .doc(payload.id)
    .update({
      ...payload._history,
      // Marqueur de démonstration : c'est lui qui autorise la purge ciblée.
      demo: true,
    })

  return created
}

/** Supprime tous les documents marqués `demo: true`, et eux seuls. */
async function purge(db) {
  const marked = await db.collection(APPOINTMENTS).where('demo', '==', true).get()

  if (marked.empty) {
    console.log('Aucune demande de démonstration à supprimer.')
    return
  }

  // Firestore plafonne un lot à 500 écritures.
  const ids = marked.docs.map((doc) => doc.id)
  for (let start = 0; start < ids.length; start += 400) {
    const batch = db.batch()
    for (const id of ids.slice(start, start + 400)) {
      batch.delete(db.collection(APPOINTMENTS).doc(id))
    }
    await batch.commit()
  }

  console.log(`✓ ${ids.length} demande(s) de démonstration supprimée(s).`)
  console.log('  Les demandes réelles n’ont pas été touchées.')
}

/* ---------------------------------------------------------------- */

/** Ouvre une connexion Firestore à partir des identifiants du `.env`. */
function connect(env) {
  const projectId = env.FIREBASE_PROJECT_ID
  const clientEmail = env.FIREBASE_CLIENT_EMAIL
  const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Identifiants Firebase incomplets dans .env.')
    process.exit(1)
  }

  const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
  return getFirestore(app)
}

async function main() {
  const env = readEnv()
  const secret = env.NETLIFY_FORMS_SECRET

  if (!secret) {
    console.error('NETLIFY_FORMS_SECRET absent de .env : impossible de signer.')
    process.exit(1)
  }

  const db = connect(env)

  if (process.argv.includes('--purge')) {
    await purge(db)
    return
  }

  const total = Number(option('nombre', '36'))
  if (!Number.isFinite(total) || total < 1) {
    console.error('--nombre attend un entier positif.')
    process.exit(1)
  }

  console.log(`→ ${total} demandes vers ${BASE}/api/forms\n`)

  let stored = 0
  let rejected = 0
  const counts = {}

  for (let index = 0; index < total; index += 1) {
    const payload = buildDemande(index, total)
    const response = await seedOne(payload, secret, db)

    if (response.result?.ok && !response.result.ignored) {
      stored += 1
      const key =
        payload._history.status === 'confirmee'
          ? payload._history.notifiedAt
            ? 'notifiée'
            : 'à notifier'
          : payload._history.status
      counts[key] = (counts[key] ?? 0) + 1
      process.stdout.write('.')
    } else {
      rejected += 1
      process.stdout.write('x')
      if (rejected <= 3) {
        console.error(`\n  rejeté : ${JSON.stringify(response.result)}`)
      }
    }
  }

  console.log('\n')
  console.log(`✓ ${stored} enregistrée(s)${rejected ? `, ${rejected} rejetée(s)` : ''}`)
  for (const [key, value] of Object.entries(counts)) {
    console.log(`   ${key.padEnd(12)} ${value}`)
  }
  console.log('\nOuvrez http://localhost:3000/admin')
  console.log('Pour tout retirer : node scripts/seed-dashboard.mjs --purge')
}

main().catch((error) => {
  console.error('\nÉchec :', error instanceof Error ? error.message : error)
  process.exit(1)
})
