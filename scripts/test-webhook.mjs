/**
 * Simule une soumission de formulaire Netlify, en local.
 *
 * À quoi ça sert : en développement, le formulaire poste vers `/__forms.html`,
 * un fichier que seul le CDN de Netlify sait traiter. Impossible donc de tester
 * la chaîne complète en local depuis le navigateur. Ce script rejoue exactement
 * ce que Netlify enverrait à `/api/forms` — corps signé compris — ce qui permet
 * de vérifier de bout en bout : webhook → Firestore → tableau de bord.
 *
 * Usage :
 *   npm run dev                       (dans un autre terminal)
 *   node scripts/test-webhook.mjs
 *   node scripts/test-webhook.mjs --labo flamboyants --nom "Awa Mbemba"
 *   node scripts/test-webhook.mjs --id abc123   (relivraison : rien de neuf attendu)
 *
 * Le script lit NETLIFY_FORMS_SECRET dans `.env` : la signature doit être
 * calculée avec le même secret que celui vérifié par la route.
 */

import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000'

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
    if (match) values[match[1]] = match[2]
  }
  return values
}

/* ---------------------------------------------------------------- */
/* Options de ligne de commande                                       */
/* ---------------------------------------------------------------- */

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`)
  return index !== -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

/** Date dans N jours, au format AAAA-MM-JJ. */
function futureDate(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

const env = readEnv()
const secret = env.NETLIFY_FORMS_SECRET

if (!secret) {
  console.error('NETLIFY_FORMS_SECRET absent de .env : impossible de signer.')
  process.exit(1)
}

/*
 * L'`id` est tiré au hasard à chaque appel, comme le ferait une nouvelle
 * soumission. Pour éprouver la protection contre les relivraisons, passez
 * `--id` avec une valeur fixe : deux exécutions successives portant le même
 * `id` ne doivent produire qu'un seul document.
 */
const payload = {
  id: option('id', randomUUID()),
  form_name: 'rendez-vous',
  number: Math.floor(Math.random() * 1000),
  created_at: new Date().toISOString(),
  data: {
    name: option('nom', 'Patient de test'),
    phone: option('tel', '067657878'),
    dial: option('indicatif', '+242'),
    email: option('email', 'patient.test@example.com'),
    service: option('service', 'Hématologie'),
    labo: option('labo', 'mpila'),
    date: option('date', futureDate(7)),
    time: option('heure', '08:30'),
    message: option('message', 'Demande créée par scripts/test-webhook.mjs'),
  },
}

const body = JSON.stringify(payload)

/**
 * Reproduit l'en-tête de Netlify : un JWT dont la charge utile porte
 * l'empreinte SHA-256 du corps, calculée avec le secret partagé.
 * C'est exactement ce que vérifie app/api/forms/route.ts.
 */
const sha256 = createHmac('sha256', secret).update(body, 'utf8').digest('hex')
const claims = Buffer.from(JSON.stringify({ iss: 'netlify', sha256 })).toString('base64url')
const signature = `JWT ${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${claims}.local`

console.log(`→ POST ${BASE}/api/forms`)
console.log(`  ${payload.data.name} · ${payload.data.labo} · ${payload.data.date} ${payload.data.time}`)
console.log(`  id=${payload.id}`)

const response = await fetch(`${BASE}/api/forms`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Webhook-Signature': signature },
  body,
})

const result = await response.json().catch(() => null)

console.log(`\n← ${response.status} ${JSON.stringify(result)}`)

if (response.ok && result?.ok && !result.ignored) {
  console.log('\n✓ Demande enregistrée. Ouvrez /admin pour la voir apparaître.')
} else if (result?.ignored) {
  console.log('\n⚠ Demande ignorée : vérifiez le nom du laboratoire et les champs.')
} else {
  console.log('\n✗ Échec. Consultez le terminal du serveur pour le détail.')
}
