import 'server-only'

import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

/**
 * Accès Firebase côté serveur uniquement.
 *
 * `firebase-admin` ne doit jamais atteindre le navigateur : il détient une clé
 * privée capable de contourner toutes les règles de sécurité Firestore. Le
 * paquet `server-only` fait échouer la compilation si un composant client
 * l'importe, même indirectement.
 */

/** Collections Firestore. */
export const APPOINTMENTS = 'rendez-vous'
/** Un document par administrateur, nommé d'après son UID Firebase Auth. */
export const ADMINS = 'admins'

type Credentials = {
  projectId: string
  clientEmail: string
  privateKey: string
}

function readCredentials(): Credentials {
  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL

  // Netlify conserve les secrets multilignes en échappant les retours à la
  // ligne. Sans cette conversion, `cert()` rejette la clé avec une erreur
  // d'encodage PEM peu explicite.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin : configuration incomplète. Renseignez FIREBASE_PROJECT_ID, ' +
        'FIREBASE_CLIENT_EMAIL et FIREBASE_PRIVATE_KEY.',
    )
  }

  return { projectId, clientEmail, privateKey }
}

type Services = { db: Firestore; auth: Auth }

let cached: Services | null = null

/**
 * Cache partagé au niveau du processus.
 *
 * Une variable de module ne suffit pas : le serveur de développement recharge
 * les modules à chaud, ce qui remet `cached` à `null`, alors que le registre
 * d'applications de `firebase-admin` — lui — survit. On se retrouve alors à
 * rappeler `settings()` sur une instance Firestore déjà configurée, ce qui lève
 * « Firestore has already been initialized ». L'erreur est d'autant plus
 * trompeuse qu'elle survient au moment de vérifier une session : toutes les
 * pages protégées redirigent vers la connexion, comme si le mot de passe était
 * faux.
 *
 * En accrochant le cache à `globalThis`, il résiste aux rechargements.
 */
const globalStore = globalThis as unknown as { __biosanteFirebase?: Services }

/**
 * Le SDK est initialisé à la première utilisation, puis réutilisé.
 *
 * L'initialisation paresseuse évite deux écueils : un import qui lèverait une
 * exception pendant le build (où les secrets peuvent manquer), et une seconde
 * initialisation lors des rechargements à chaud du serveur de développement.
 */
function services(): Services {
  // Le cache du processus prime : il est le seul à survivre aux rechargements.
  const existing = globalStore.__biosanteFirebase
  if (existing) {
    cached = existing
    return existing
  }

  if (!cached) {
    const app = getApps()[0] ?? initializeApp({ credential: cert(readCredentials()) })
    const db = getFirestore(app)

    // `settings()` n'est autorisé qu'une seule fois, et seulement avant tout
    // autre appel sur cette instance. Si une instance précédente a déjà posé le
    // réglage, il reste en vigueur : on ignore l'erreur plutôt que de faire
    // échouer la vérification de session.
    try {
      // Sans ce réglage, Firestore refuse tout document contenant `undefined`.
      db.settings({ ignoreUndefinedProperties: true })
    } catch {
      // Déjà configuré : rien à faire.
    }

    cached = { db, auth: getAuth(app) }
    globalStore.__biosanteFirebase = cached
  }

  return cached
}

export function db(): Firestore {
  return services().db
}

export function auth(): Auth {
  return services().auth
}
