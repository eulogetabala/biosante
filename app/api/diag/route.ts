/**
 * Diagnostic Firebase — TEMPORAIRE.
 *
 * Netlify ne renvoie jamais la pile d'appels d'une Function au navigateur :
 * l'erreur n'existe que dans les logs. Cette route la rapatrie dans la réponse
 * HTTP, pour qu'on puisse la lire sans passer par l'interface.
 *
 * Elle n'affiche JAMAIS la valeur d'un secret : seulement sa présence, et le
 * message d'erreur de Firebase. Elle est protégée par un jeton jetable — sans
 * lui, la route répond 404 et se fait oublier.
 *
 * Le jeton est écrit en clair ici, et c'est volontaire : il ne protège rien
 * d'autre que cette sonde, ne donne accès à aucune donnée, et n'a de valeur que
 * le temps du diagnostic. Un secret partagé serait plus lourd sans être plus
 * sûr — et il ne faut surtout pas réutiliser un secret réel.
 *
 * À supprimer dès le diagnostic terminé.
 */

export const dynamic = 'force-dynamic'

/** Jeton de diagnostic, à usage unique et sans portée. */
const JETON = 'diag-7f3a91c2e5b8'

export async function GET(request: Request) {
  const provided = new URL(request.url).searchParams.get('k')
  if (provided !== JETON) {
    return new Response('Not found', { status: 404 })
  }

  // 1. Les variables attendues sont-elles présentes ? (jamais leur valeur)
  const env = {
    FIREBASE_PROJECT_ID: Boolean(process.env.FIREBASE_PROJECT_ID),
    FIREBASE_CLIENT_EMAIL: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
    FIREBASE_PRIVATE_KEY: Boolean(process.env.FIREBASE_PRIVATE_KEY),
    ADMIN_SESSION_SECRET: Boolean(process.env.ADMIN_SESSION_SECRET),
    NETLIFY_FORMS_SECRET: Boolean(process.env.NETLIFY_FORMS_SECRET),
    NEXT_PUBLIC_FIREBASE_API_KEY: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  }

  // 2. La clé privée a-t-elle la bonne forme ? (sans jamais la divulguer)
  const raw = process.env.FIREBASE_PRIVATE_KEY
  const key = raw?.replace(/\\n/g, '\n')
  const keyShape = key
    ? {
        beginsCorrectly: key.startsWith('-----BEGIN PRIVATE KEY-----'),
        endsCorrectly: key.trimEnd().endsWith('-----END PRIVATE KEY-----'),
        // Une longueur plausible pour une clé RSA 2048 en base64.
        length: key.length,
        // Des guillemets en début de valeur cassent l'en-tête PEM.
        hasStrayQuotes: key.trimStart().startsWith('"'),
      }
    : null

  // 3. Le chargement de la chaîne d'imports puis un vrai appel Firestore.
  let load = 'non tenté'
  let firestore = 'non tenté'
  try {
    const mod = await import('@/lib/firebase-admin')
    load = 'module chargé'
    try {
      const snap = await mod.db().collection('rendez-vous').limit(1).get()
      firestore = `ok (${snap.size} document(s) lus)`
    } catch (error) {
      firestore = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    }
  } catch (error) {
    load = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  }

  return Response.json({ env, keyShape, load, firestore })
}
