/**
 * Sonde de diagnostic — TEMPORAIRE.
 *
 * Cette route n'importe rien : ni Firebase, ni la session, ni aucun module
 * maison. C'est tout son intérêt. Si elle répond, le runtime serverless de
 * Netlify fonctionne et la panne vient de notre chaîne d'imports ; si elle
 * échoue aussi, la panne est dans l'adaptateur Next.js lui-même et aucune
 * correction de notre code n'y changera rien.
 *
 * À supprimer dès le diagnostic terminé.
 */

// Sans cela, Next pourrait pré-rendre la route au build : elle répondrait
// alors depuis le cache statique même si la Function est cassée, et la sonde
// ne prouverait plus rien.
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  return Response.json({
    ok: true,
    // Heure de l'exécution réelle : prouve que le code a bien tourné.
    now: new Date().toISOString(),
    node: process.version,
    // Reflète un en-tête quelconque pour forcer un vrai rendu par requête.
    ua: request.headers.get('user-agent')?.slice(0, 40) ?? null,
  })
}
