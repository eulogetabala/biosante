import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ClipboardCheck, Clock3, Droplets, Info, Phone, ShieldCheck } from 'lucide-react'

import { PageHero } from '@/components/sections/PageHero'
import { ParallaxBand } from '@/components/sections/ParallaxBand'
import { labos, services } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Nos services',
  description:
    'Nos pôles d’expertise et la liste de nos examens : hématologie, biochimie, immuno-sérologie, microbiologie, hormonologie et toxicologie.',
}

const heroImage =
  'https://images.unsplash.com/photo-1579165466949-3180a3d056d5?auto=format&fit=crop&w=2000&q=88'

const prep = [
  {
    title: 'Votre ordonnance',
    text: 'Présentez-vous avec la prescription de votre médecin et, si possible, une pièce d’identité.',
    icon: ClipboardCheck,
  },
  {
    title: 'Le jeûne',
    text: 'Respectez le jeûne lorsque l’analyse l’exige : comptez 8 à 12 heures sans manger.',
    icon: Clock3,
  },
  {
    title: 'L’hydratation',
    text: 'Buvez de l’eau avant le prélèvement : cela facilite la prise de sang et le confort du geste.',
    icon: Droplets,
  },
  {
    title: 'Vos traitements',
    text: 'Signalez tout traitement en cours à l’équipe de prélèvement, certains peuvent influencer les résultats.',
    icon: ShieldCheck,
  },
]

const trust = [
  { icon: ClipboardCheck, text: 'Prélèvement par des techniciens diplômés' },
  { icon: Droplets, text: 'Résultats transmis de façon confidentielle' },
  { icon: Clock3, text: 'Délais annoncés au prélèvement' },
]

export default function ServicesPage() {
  return (
    <main className="bg-background">
      <PageHero
        eyebrow="Nos services"
        title="Nos examens, par pôle d’expertise."
        text="La liste ci-dessous regroupe nos analyses les plus demandées. Pour un examen spécifique qui n’apparaît pas, contactez le laboratoire : la plupart des bilans peuvent être organisés sur demande."
        image={heroImage}
        imageAlt="Analyses réalisées au laboratoire"
        tags={['6 pôles', 'Analyses spécialisées', 'Sur place à Brazzaville']}
        cta={{ href: '/contact', label: 'Poser ma question' }}
      />

      {/* Pôles */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">01 / Nos pôles</p>
            <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-[1.02] tracking-[-.05em] sm:text-5xl">
              Six regards sur votre santé.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-muted-foreground">
            Un même niveau d’exigence pour les analyses courantes et les explorations spécialisées.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Link key={s.title} href="/contact" className="exp-card group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.image} alt={s.title} />
              <span className="exp-scrim" aria-hidden="true" />
              <span className="exp-num">{s.number}</span>
              <span className="exp-top">
                <span className="exp-go">
                  <ArrowRight size={17} />
                </span>
              </span>
              <span className="exp-body">
                <span className="exp-title font-display">{s.title}</span>
                <span className="exp-text">{s.text}</span>
                <span className="exp-meta">
                  <span className="size-1.5 rounded-full bg-accent" />
                  {s.meta}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Bandeau parallaxe — examens */}
      <ParallaxBand
        eyebrow="Nos examens"
        title="Ce que nous réalisons au quotidien."
        text="Six familles d’analyses, réalisées sur place à Mpila et à la Cité Flamboyants. Pour un examen qui n’apparaît pas dans cette liste, contactez le laboratoire : la plupart des bilans peuvent être organisés sur demande."
        cta={{ href: '/contact', label: 'Demander un examen' }}
      />

      {/* Préparation */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
          <div className="lg:sticky lg:top-32">
            <p className="eyebrow">02 / Bien se préparer</p>
            <h2 className="mt-5 max-w-lg text-3xl font-semibold leading-[1.05] tracking-[-.05em] sm:text-5xl">
              Quatre réflexes avant votre prélèvement.
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">
              Une analyse fiable commence avant le laboratoire. Ces quelques règles améliorent la
              qualité de vos résultats.
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {labos.map((labo, i) => (
                <a
                  key={labo.id}
                  href={`tel:${labo.tel}`}
                  className={
                    i === 0
                      ? 'inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-[11px] font-bold uppercase tracking-[.12em] text-primary-foreground transition-colors hover:bg-leaf'
                      : 'inline-flex items-center gap-2 rounded-full border border-border px-5 py-3.5 text-[11px] font-bold uppercase tracking-[.12em] text-primary transition-colors hover:border-leaf hover:text-leaf'
                  }
                >
                  <Phone size={14} /> {labo.short} · {labo.phone}
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {prep.map((item, i) => (
              <div
                key={item.title}
                className="commit-card rounded-[1.6rem] border border-border bg-white p-6"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span className="commit-sheen" aria-hidden="true" />
                <div className="relative">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-muted text-brand">
                    <item.icon size={19} />
                  </span>
                  <h3 className="mt-6 text-base font-semibold tracking-[-.02em]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
                </div>
              </div>
            ))}

            <div className="brand rounded-[1.6rem] p-7 sm:col-span-2">
              <span className="brand-glow -right-12 -top-16 size-56 bg-brand-light/35" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <Info className="mt-0.5 shrink-0 text-accent" size={22} />
                  <div>
                    <h3 className="text-lg font-semibold tracking-[-.03em]">
                      Un examen absent de la liste ?
                    </h3>
                    <p className="mt-2 max-w-lg text-sm leading-7 text-white/72">
                      Envoyez-nous votre ordonnance : nous confirmons la faisabilité, le délai et la
                      préparation nécessaire.
                    </p>
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-leaf px-6 py-4 text-xs font-bold uppercase tracking-[.13em] text-leaf-foreground transition-transform duration-300 hover:-translate-y-0.5"
                >
                  Poser ma question <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bandeau confiance */}
      <section className="border-t border-border bg-white px-5 py-14 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm text-muted-foreground">
          {trust.map((t) => (
            <span key={t.text} className="flex items-center gap-2">
              <t.icon size={16} className="text-leaf" /> {t.text}
            </span>
          ))}
        </div>
      </section>
    </main>
  )
}
