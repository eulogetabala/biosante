import Link from 'next/link'
import { ArrowRight, FlaskConical } from 'lucide-react'

import { examGroups } from '@/lib/site'

const bandImage =
  'https://images.unsplash.com/photo-1562789233-495f52b583dd?auto=format&fit=crop&w=2400&q=88'

/** Nombre total d'analyses, pour les repères. */
const totalExams = examGroups.reduce((sum, group) => sum + group.items.length, 0)

type ParallaxBandProps = {
  eyebrow?: string
  title: string
  text: string
  cta?: { href: string; label: string }
}

/**
 * Bandeau parallaxe : image de fond animée, voile bleu dégradé,
 * contenu et repères révélés en cascade.
 */
export function ParallaxBand({ eyebrow = 'Nos examens', title, text, cta }: ParallaxBandProps) {
  return (
    <section className="parallax-band flex min-h-[30rem] items-center px-5 py-20 lg:min-h-[34rem] lg:px-8 lg:py-24">
      {/* Image parallaxe */}
      <div className="parallax-layer" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bandImage} alt="" />
      </div>

      {/* Voile bleu */}
      <div className="parallax-scrim" aria-hidden="true" />
      <div className="parallax-grain" aria-hidden="true" />
      <span className="parallax-orb -left-24 top-10 size-80 bg-brand-light/30" aria-hidden="true" />
      <span className="parallax-orb -right-20 bottom-0 size-96 bg-leaf/20" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-7xl">
        <div className="max-w-2xl">
          <p className="parallax-item flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[.22em] text-leaf">
            <FlaskConical size={15} />
            {eyebrow}
          </p>
          <h2 className="parallax-item mt-6 text-balance text-4xl font-semibold leading-[.98] tracking-[-.06em] text-white sm:text-5xl lg:text-6xl">
            {title}
          </h2>
          <p className="parallax-item mt-6 max-w-xl text-sm leading-8 text-white/75 sm:text-base">
            {text}
          </p>

          {cta && (
            <Link
              href={cta.href}
              className="parallax-item mt-9 inline-flex items-center gap-2.5 rounded-full bg-leaf px-6 py-4 text-[11px] font-bold uppercase tracking-[.14em] text-leaf-foreground transition-transform duration-300 hover:-translate-y-0.5"
            >
              {cta.label} <ArrowRight size={15} />
            </Link>
          )}
        </div>

        {/* Repères */}
        <div className="parallax-item mt-14 grid max-w-2xl grid-cols-3 gap-4 border-t border-white/20 pt-7">
          <div>
            <strong className="block text-2xl font-semibold tracking-[-.04em] text-white sm:text-3xl">
              {examGroups.length}
            </strong>
            <span className="mt-1.5 block text-xs text-white/60">familles d’examens</span>
          </div>
          <div>
            <strong className="block text-2xl font-semibold tracking-[-.04em] text-white sm:text-3xl">
              {totalExams}
            </strong>
            <span className="mt-1.5 block text-xs text-white/60">analyses courantes</span>
          </div>
          <div>
            <strong className="block text-2xl font-semibold tracking-[-.04em] text-white sm:text-3xl">
              2
            </strong>
            <span className="mt-1.5 block text-xs text-white/60">sites, mêmes délais</span>
          </div>
        </div>
      </div>
    </section>
  )
}
