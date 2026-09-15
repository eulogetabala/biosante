/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  /**
   * Ne pas empaqueter ces paquets dans la Function Netlify.
   *
   * `firebase-admin` et son client gRPC ne sont pas de simples fichiers
   * JavaScript : ils lisent `protos.json` sur le disque au moment de créer un
   * client Firestore. Or Next.js, à la compilation, fond toutes les
   * dépendances dans un seul fichier — et les fichiers `.json` lus par chemin
   * relatif disparaissent alors du paquet. La Function échoue au premier appel,
   * avec un message qui parle de `protos.json` introuvable, très loin de la
   * cause réelle.
   *
   * Les déclarer ici force Next.js à les laisser dans `node_modules` et à les
   * résoudre à l'exécution : les fichiers annexes restent à leur place.
   *
   * `@grpc/grpc-js` est listé séparément car c'est lui qui porte `protos.json` :
   * externaliser le parent ne suffit pas si l'enfant reste empaqueté.
   */
  serverExternalPackages: ['firebase-admin', '@grpc/grpc-js'],
}

export default nextConfig
