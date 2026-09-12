import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70svh] max-w-3xl flex-col items-center justify-center px-5 py-24 text-center">
      <p className="eyebrow">Erreur 404</p>
      <h1 className="mt-6 text-4xl font-semibold leading-[1.02] tracking-[-.06em] sm:text-6xl">
        Cette page n&apos;existe pas.
      </h1>
      <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">
        Le lien est peut-être obsolète. Revenez à l&apos;accueil ou consultez directement nos
        examens et nos adresses.
      </p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-[11px] font-bold uppercase tracking-[.13em] text-primary-foreground transition-colors hover:bg-leaf"
        >
          Retour à l&apos;accueil <ArrowRight size={15} />
        </Link>
        <Link
          href="/services"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-4 text-[11px] font-bold uppercase tracking-[.13em] text-primary transition-colors hover:border-leaf hover:text-leaf"
        >
          Voir nos services
        </Link>
      </div>
    </main>
  )
}
