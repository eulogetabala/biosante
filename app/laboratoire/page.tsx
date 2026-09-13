import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Building2, Clock3, Dna, FlaskConical, Microscope, Quote, ShieldCheck, Users } from 'lucide-react'

import { AddressSelect } from '@/components/sections/AddressSelect'
import { PageHero } from '@/components/sections/PageHero'

export const metadata: Metadata = {
  title: 'Le laboratoire',
  description:
    'Notre plateau technique, nos engagements et notre exigence de qualité au service des patients de Brazzaville.',
}

const heroImage =
  'https://images.unsplash.com/photo-1582719471425-ab68645ba31d?auto=format&fit=crop&w=2000&q=88'
const labImage =
  'https://images.unsplash.com/photo-1583911860205-72f8ac8ddcbe?auto=format&fit=crop&w=1400&q=88'
const benchImage =
  'https://images.unsplash.com/photo-1583911860345-9ae84483d7af?auto=format&fit=crop&w=800&q=86'
const sampleImage =
  'https://images.unsplash.com/photo-1650295894392-7fea9aa5a5a1?auto=format&fit=crop&w=800&q=86'

const values = [
  {
    icon: Microscope,
    title: 'Un plateau technique complet',
    text: 'Automates d’hématologie et de biochimie, microscopie, biologie moléculaire : nos analyses courantes et spécialisées sont réalisées sur place, à Brazzaville.',
    stat: '6 pôles',
    image: benchImage,
    imageAlt: 'Automates et postes d’analyse du plateau technique',
  },
  {
    icon: Clock3,
    title: 'Des délais maîtrisés',
    text: 'Résultats communiqués dans les délais indiqués au prélèvement, avec un circuit prioritaire pour les situations qui ne peuvent pas attendre.',
    stat: 'Circuit prioritaire',
    image: sampleImage,
    imageAlt: 'Échantillons en cours de traitement au laboratoire',
  },
  {
    icon: ShieldCheck,
    title: 'Qualité et confidentialité',
    text: 'Contrôles internes et externes réguliers, traçabilité des échantillons et discrétion absolue sur vos données de santé.',
    stat: 'Traçabilité totale',
    image: labImage,
    imageAlt: 'Contrôle qualité des analyses au laboratoire',
  },
]

const timeline = [
  {
    icon: Users,
    title: 'L’accueil et le prélèvement',
    text: 'Votre ordonnance est vérifiée, vos questions posées, le prélèvement réalisé par un technicien diplômé. Chaque tube est identifié et horodaté.',
  },
  {
    icon: FlaskConical,
    title: 'L’analyse au plateau technique',
    text: 'Les échantillons rejoignent le poste adapté : automate, microscopie ou biologie moléculaire. Les contrôles de qualité encadrent chaque série.',
  },
  {
    icon: Dna,
    title: 'La validation biologique',
    text: 'Un biologiste confronte les résultats à votre contexte, vérifie les valeurs critiques, puis valide le compte rendu avant sa remise.',
  },
  {
    icon: Building2,
    title: 'La remise des résultats',
    text: 'Le compte rendu vous est transmis de façon confidentielle, dans le délai annoncé, avec les explications utiles à votre médecin.',
  },
]

const stats = [
  { value: '6', label: 'pôles d’expertise biologique' },
  { value: '2', label: 'laboratoires à Brazzaville' },
  { value: '24/7', label: 'ouverture continue, jours fériés compris' },
  { value: '100%', label: 'échantillons tracés et horodatés' },
]

export default function LaboratoirePage() {
  return (
    <main className="bg-background">
      <PageHero
        eyebrow="Le laboratoire"
        title="L’invisible devient lisible."
        text="Depuis Brazzaville, notre équipe de biologistes et de techniciens transforme un prélèvement en information utile pour votre médecin — et compréhensible pour vous."
        image={heroImage}
        imageAlt="Plateau technique du laboratoire de biologie médicale"
        tags={['Biologistes diplômés', 'Contrôle qualité', 'Deux sites']}
        cta={{ href: '/contact', label: 'Prendre rendez-vous' }}
      />

      {/* Engagements */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">01 / Nos engagements</p>
            <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-[1.02] tracking-[-.05em] sm:text-5xl">
              Trois promesses tenues à chaque prélèvement.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-muted-foreground">
            Elles ne relèvent pas du discours : elles décrivent la manière dont chaque échantillon
            est traité, du premier contact à la remise du compte rendu.
          </p>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {values.map((v) => (
            <article
              key={v.title}
              className="value-card group relative flex min-h-[26rem] flex-col justify-end overflow-hidden rounded-[1.9rem] border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={v.image}
                alt={v.imageAlt}
                className="absolute inset-0 size-full object-cover"
              />
              <span className="value-scrim" aria-hidden="true" />

              <span className="absolute left-6 top-6 z-10 flex size-12 items-center justify-center rounded-2xl border border-white/25 bg-white/12 text-white backdrop-blur-md transition-colors duration-500 group-hover:bg-leaf group-hover:text-leaf-foreground">
                <v.icon size={21} />
              </span>
              <span className="absolute right-6 top-6 z-10 rounded-full border border-white/25 bg-white/12 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-white backdrop-blur-md">
                {v.stat}
              </span>

              <div className="relative z-10 p-7">
                <h3 className="text-2xl font-semibold leading-tight tracking-[-.04em] text-white">
                  {v.title}
                </h3>
                <p className="value-text text-sm leading-7 text-white/78">{v.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Chiffres — panneau visuel */}
      <section className="relative px-5 py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[2.2rem] border border-border bg-white">
            <div className="grid lg:grid-cols-[.95fr_1.05fr]">
              {/* Image */}
              <div className="relative min-h-64 overflow-hidden lg:min-h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={labImage}
                  alt="Poste d’analyse du plateau technique"
                  className="absolute inset-0 size-full object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(9,29,52,.72)_0%,rgba(13,52,85,.35)_60%,transparent_100%)]" />
                <div className="relative flex h-full flex-col justify-between p-8 lg:p-10">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-white backdrop-blur">
                    <span className="size-1.5 rounded-full bg-leaf" />
                    En chiffres
                  </span>
                  <div className="mt-16">
                    <p className="max-w-xs text-xl font-semibold leading-tight tracking-[-.04em] text-white sm:text-2xl">
                      Le laboratoire en quelques repères concrets.
                    </p>
                  </div>
                </div>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-2">
                {stats.map((s, i) => (
                  <div
                    key={s.label}
                    className={`stat-tile group relative p-7 transition-colors duration-500 hover:bg-muted lg:p-9 ${
                      i % 2 === 0 ? 'border-r border-border' : ''
                    } ${i < stats.length - 2 ? 'border-b border-border' : ''}`}
                  >
                    <span className="font-mono text-[10px] font-bold tracking-[.18em] text-leaf">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <strong className="mt-4 block text-4xl font-semibold tracking-[-.05em] text-primary lg:text-5xl">
                      {s.value}
                    </strong>
                    <span className="mt-3 block text-sm leading-6 text-muted-foreground">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Parcours d'un échantillon */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div className="lg:sticky lg:top-32">
            <p className="eyebrow">02 / Le parcours d’un échantillon</p>
            <h2 className="mt-5 text-3xl font-semibold leading-[1.02] tracking-[-.05em] sm:text-5xl">
              Quatre étapes, aucun raccourci.
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-muted-foreground">
              Derrière chaque résultat, un protocole strict. Le découvrir, c’est comprendre pourquoi
              un délai est parfois nécessaire — et pourquoi il est fiable.
            </p>

            <div className="brand mt-10 overflow-hidden rounded-[1.9rem]">
              <span className="brand-glow -left-12 -top-16 size-56 bg-brand-light/35" />
              <div className="relative p-7">
                <Quote className="text-accent" size={22} />
                <p className="mt-5 text-sm leading-7 text-white/80">
                  « Un résultat n’est utile que s’il est compris. Nous prenons le temps de vous
                  expliquer ce que votre analyse raconte. »
                </p>
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-white/55">
                  L’équipe Bio Santé Diagnostic
                </p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sampleImage}
                alt="Échantillons du laboratoire"
                className="h-40 w-full object-cover"
              />
            </div>
          </div>

          <div className="timeline space-y-3">
            {timeline.map((step, i) => (
              <div
                key={step.title}
                className="timeline-step flex items-start gap-5 rounded-[1.7rem] border border-border bg-white p-6 transition-colors duration-500 hover:border-leaf/45 sm:p-7"
              >
                <span className="timeline-dot shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <step.icon size={18} className="shrink-0 text-brand" />
                    <h3 className="text-lg font-semibold leading-tight tracking-[-.03em]">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Adresses */}
      <section className="relative border-t border-border bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <AddressSelect eyebrow="Nos sites" />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="brand flex flex-col gap-8 rounded-[2rem] p-10 sm:flex-row sm:items-center sm:justify-between sm:p-14">
          <span className="brand-glow -left-10 -top-16 size-64 bg-brand-light/40" />
          <div className="relative">
            <Microscope className="text-accent" size={24} />
            <h2 className="mt-5 max-w-md text-3xl font-semibold leading-tight tracking-[-.05em] sm:text-4xl">
              Une question sur une analyse ?
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
              Notre équipe vous explique la préparation, le délai et la lecture de vos résultats.
            </p>
          </div>
          <div className="relative flex shrink-0 flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-leaf px-6 py-4 text-xs font-bold uppercase tracking-[.14em] text-leaf-foreground transition-transform duration-300 hover:-translate-y-0.5"
            >
              Nous contacter <ArrowRight size={15} />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-4 text-xs font-bold uppercase tracking-[.14em] text-white transition-colors hover:bg-white/10"
            >
              Voir nos services
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
