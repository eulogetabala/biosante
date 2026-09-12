import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

type PageHeroProps = {
  eyebrow: string
  title: React.ReactNode
  text: string
  image: string
  imageAlt: string
  /** Petites étiquettes affichées sous le texte. */
  tags?: string[]
  cta?: { href: string; label: string }
}

/**
 * Hero compact pour les pages internes : image de fond, voile bleu,
 * hauteur réduite pour laisser la place au contenu.
 */
export function PageHero({ eyebrow, title, text, image, imageAlt, tags, cta }: PageHeroProps) {
  return (
    <section className="page-hero relative isolate overflow-hidden bg-deep text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt={imageAlt} className="page-hero-image absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(9,29,52,.97)_0%,rgba(11,38,68,.86)_42%,rgba(13,52,85,.42)_100%)]" />
      <div className="page-hero-grain absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto flex max-w-7xl flex-col justify-end px-5 pb-14 pt-16 lg:px-8 lg:pb-20 lg:pt-24">
        <p className="page-hero-item text-[11px] font-bold uppercase tracking-[.22em] text-leaf">
          {eyebrow}
        </p>
        <h1 className="page-hero-item mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[.98] tracking-[-.06em] sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="page-hero-item mt-6 max-w-2xl text-sm leading-8 text-white/72 sm:text-base">
          {text}
        </p>

        {(tags || cta) && (
          <div className="page-hero-item mt-9 flex flex-wrap items-center gap-2.5">
            {tags?.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/22 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[.14em] text-white/85 backdrop-blur"
              >
                {tag}
              </span>
            ))}
            {cta && (
              <Link
                href={cta.href}
                className="inline-flex items-center gap-2 rounded-full bg-leaf px-5 py-2.5 text-[10px] font-bold uppercase tracking-[.14em] text-leaf-foreground transition-transform duration-300 hover:-translate-y-0.5"
              >
                {cta.label} <ArrowRight size={14} />
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
