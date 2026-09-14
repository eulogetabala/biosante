/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  /**
   * `firebase-admin` est laissé hors du bundle serveur.
   *
   * Diagnostic : `/admin/login` répondait 500 en production, alors que cette
   * page n'appelle Firebase par aucun chemin lorsqu'aucun cookie n'est présent —
   * `currentAdmin()` renvoie `null` aussitôt. L'échec était donc au chargement du
   * module, pas dans la logique : `lib/auth.ts` importe `firebase-admin`, et ce
   * paquet ne survit pas à l'embarquement dans une fonction serverless.
   *
   * En local, l'illusion est parfaite : un seul processus Node, tout
   * `node_modules` disponible, aucune erreur. Sous Netlify, chaque route est une
   * fonction isolée et le SDK embarqué casse à l'initialisation.
   *
   * Déclarer le paquet ici le fait résoudre depuis `node_modules` à l'exécution
   * au lieu d'être figé dans le bundle.
   */
  serverExternalPackages: ['firebase-admin'],
}

export default nextConfig
