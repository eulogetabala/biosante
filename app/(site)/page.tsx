'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Home,
  MapPin,
  Microscope,
  Phone,
  TestTube2,
  Zap,
} from 'lucide-react'

import { AppointmentCard } from '@/components/sections/AppointmentCard'
import { AddressSelect } from '@/components/sections/AddressSelect'
import { labos, services, site } from '@/lib/site'

const heroImage =
  'https://images.unsplash.com/photo-1579154204845-5d7f8d4dc785?auto=format&fit=crop&w=2200&q=90'
const labImage =
  'https://images.unsplash.com/photo-1583911860205-72f8ac8ddcbe?auto=format&fit=crop&w=1200&q=90'
const scientistImage =
  'https://images.unsplash.com/photo-1582719366767-dbbb6c6bf4aa?auto=format&fit=crop&w=1200&q=90'
const microscopeImage =
  'https://images.unsplash.com/photo-1582719471137-c3967ffb1c42?auto=format&fit=crop&w=1200&q=90'

const features = [
  ['Analyses spécialisées', 'Une lecture fine de votre santé, du prélèvement au compte rendu.'],
  ['Réponse rapide', 'Des délais maîtrisés et une communication claire des résultats.'],
  ['À votre porte', 'Prélèvements à domicile sur rendez-vous, pour votre confort.'],
]

const faqs = [
  [
    'Dois-je être à jeun ?',
    'Certaines analyses nécessitent d’être à jeun. Notre équipe vous précisera les conditions lors de votre rendez-vous.',
  ],
  [
    'Proposez-vous les prélèvements à domicile ?',
    'Oui, sur rendez-vous, pour les personnes âgées, à mobilité réduite ou pour votre confort.',
  ],
  [
    'Quand recevrai-je mes résultats ?',
    'Le délai dépend de la nature de l’analyse. Il vous sera indiqué au moment du prélèvement.',
  ],
  [
    'Faut-il une ordonnance ?',
    'Une prescription médicale est recommandée. Pour certains bilans de contrôle, l’équipe vous oriente sur place.',
  ],
]

export default function Page() {
  const [activeFaq, setActiveFaq] = useState(0)

  return (
    <main className="min-h-screen overflow-hidden bg-background">
      {/* HERO */}
      <section className="hero-reveal relative flex min-h-[86svh] items-end overflow-hidden bg-primary pt-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage}
          alt="Technicienne préparant une analyse en laboratoire"
          className="hero-image absolute inset-0 size-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(13,52,85,.98)_0%,rgba(13,52,85,.7)_45%,rgba(13,52,85,.08)_100%)]" />
        <div className="dna-line absolute right-[12%] top-[18%] hidden h-64 w-20 rotate-12 border-x-2 border-accent/50 lg:block" />

        <div className="relative mx-auto w-full max-w-7xl px-6 pb-12 text-primary-foreground lg:px-8 lg:pb-16">
          <div className="mb-24 flex items-center justify-between text-[10px] uppercase tracking-[.24em] text-primary-foreground/65">
            <span>Laboratoire d&apos;analyses médicales</span>
            <span className="hidden sm:block">{site.city}</span>
          </div>
          <div className="max-w-5xl">
            <p className="reveal-item mb-5 text-xs font-bold uppercase tracking-[.24em] text-accent">
              {site.tagline}
            </p>
            <h1 className="reveal-item text-balance text-5xl font-semibold leading-[.92] tracking-[-.07em] sm:text-7xl lg:text-[7.4rem]">
              La science qui veille sur vous.
            </h1>
            <p className="reveal-item mt-8 max-w-xl text-pretty text-base leading-7 text-primary-foreground/75 sm:text-lg">
              Des analyses fiables, une équipe humaine et une réponse claire pour éclairer chaque
              décision de santé.
            </p>
            <div className="reveal-item mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-accent px-6 py-4 text-xs font-bold uppercase tracking-[.12em] text-accent-foreground"
              >
                Réserver un créneau <ArrowRight size={16} />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/35 px-6 py-4 text-xs font-bold uppercase tracking-[.12em] text-white"
              >
                Découvrir nos pôles
              </Link>
            </div>
          </div>
          <div className="mt-20 grid max-w-3xl grid-cols-3 gap-4 border-t border-white/20 pt-6 text-xs text-primary-foreground/75">
            <div>
              <strong className="block text-2xl text-white">6</strong> pôles d&apos;expertise
            </div>
            <div>
              <strong className="block text-2xl text-white">2</strong> laboratoires à Brazzaville
            </div>
            <div>
              <strong className="block text-2xl text-white">À domicile</strong> sur rendez-vous
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 right-8 hidden items-center gap-3 text-[10px] uppercase tracking-[.18em] text-white/70 lg:flex">
          <span className="flex size-10 items-center justify-center rounded-full border border-white/30">
            <ArrowDownRight size={17} />
          </span>
          Faire défiler
        </div>
      </section>

      {/* LABORATOIRE */}
      <section id="laboratoire" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-36">
        <div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <p className="eyebrow">01 / Le laboratoire</p>
            <h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.02] tracking-[-.06em] sm:text-6xl">
              L&apos;invisible devient lisible.
            </h2>
            <p className="mt-6 max-w-md text-lg leading-8 text-muted-foreground">
              Notre plateau technique associe le geste précis, la technologie et l&apos;attention
              humaine pour donner du sens à chaque prélèvement.
            </p>
            <Link
              href="/laboratoire"
              className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-primary"
            >
              En savoir plus <ArrowRight size={15} />
            </Link>
          </div>
          <div className="relative grid grid-cols-2 gap-4">
            <div className="image-reveal group mt-10 overflow-hidden rounded-[2rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={labImage}
                alt="Poste de travail d'analyse au laboratoire"
                className="h-80 w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
              />
            </div>
            <div className="image-reveal group overflow-hidden rounded-[2rem] bg-brand p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={microscopeImage}
                alt="Microscope d'analyse"
                className="h-52 w-full rounded-[1.3rem] object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
              />
              <div className="mt-6 flex items-end justify-between text-white">
                <span className="text-sm font-semibold">Plateau technique</span>
                <Microscope size={27} />
              </div>
            </div>
            <div className="absolute -bottom-7 left-[42%] flex size-20 items-center justify-center rounded-full border-4 border-white bg-primary text-primary-foreground shadow-xl">
              <Microscope size={26} className="text-accent" />
            </div>
          </div>
        </div>

        <div className="relative mt-24 overflow-hidden rounded-[2.4rem] border border-border bg-muted px-5 py-14 sm:px-8 lg:px-14 lg:py-20">
          <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-accent/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -right-20 size-80 rounded-full bg-brand/10 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
            <div>
              <p className="eyebrow">Trois engagements</p>
              <h3 className="mt-5 max-w-md text-3xl font-semibold leading-[1.05] tracking-[-.05em] sm:text-4xl">
                Une biologie qui vous simplifie la vie.
              </h3>
              <p className="mt-5 max-w-sm text-sm leading-7 text-muted-foreground">
                Du prélèvement au résultat, chaque détail est pensé pour vous laisser l&apos;esprit
                tranquille.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {features.map(([title, text], i) => (
                <article
                  key={title}
                  className="feature-card group relative overflow-hidden rounded-[1.6rem] border border-border bg-white p-6"
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <span className="feature-glow" aria-hidden="true" />
                  <div className="relative">
                    <span className="feature-icon flex size-12 items-center justify-center rounded-2xl bg-muted text-primary transition-all duration-500 group-hover:bg-leaf group-hover:text-white">
                      <FeatureIcon name={title} />
                    </span>
                    <h4 className="mt-7 text-lg font-semibold leading-tight tracking-[-.03em]">
                      {title}
                    </h4>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* EXPERTISES */}
      <section id="services" className="relative overflow-hidden py-24 lg:py-32">
        <div className="pointer-events-none absolute -left-40 top-10 size-[26rem] rounded-full bg-brand/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 bottom-0 size-[22rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">02 / Nos expertises</p>
              <h2 className="mt-5 max-w-2xl text-4xl font-semibold leading-[.98] tracking-[-.06em] sm:text-7xl">
                Six regards sur votre santé.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-muted-foreground">
              Un même niveau d&apos;exigence pour les analyses courantes et les explorations
              spécialisées.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <Link
                key={service.title}
                href="/services"
                className="exp-card group"
                style={{ animationDelay: `${(i % 3) * 110}ms` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={service.image} alt={service.title} />
                <span className="exp-scrim" aria-hidden="true" />
                <span className="exp-num">{service.number}</span>
                <span className="exp-top">
                  <span className="exp-go">
                    <ArrowRight size={17} />
                  </span>
                </span>
                <span className="exp-body">
                  <span className="exp-title font-display">{service.title}</span>
                  <span className="exp-text">{service.text}</span>
                  <span className="exp-meta">
                    <span className="size-1.5 rounded-full bg-accent" />
                    {service.meta}
                  </span>
                </span>
              </Link>
            ))}
          </div>

          {/* Bloc bleu signature — prélèvements à domicile */}
          <div className="brand mt-4 grid gap-8 rounded-[2rem] p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
            <span className="brand-glow -left-16 -top-20 size-64 bg-brand-light/40" />
            <div className="relative">
              <p className="eyebrow text-white/55">Service dédié</p>
              <h3 className="mt-5 max-w-sm text-3xl font-semibold leading-tight tracking-[-.05em] sm:text-4xl">
                Prélèvements à domicile
              </h3>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/70">
                Le laboratoire vient à vous, dans un cadre confortable et confidentiel. Vous
                choisissez le créneau, nous nous occupons du reste.
              </p>
              <Link
                href="/contact"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-xs font-bold uppercase tracking-[.14em] text-accent-foreground"
              >
                Organiser mon passage <ArrowRight size={15} />
              </Link>
            </div>
            <div className="relative hidden lg:block">
              <div className="float-slow ml-auto w-fit rounded-[1.6rem] bg-white/10 p-3 backdrop-blur-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={services[4].image}
                  alt="Prélèvement à domicile"
                  className="h-52 w-72 rounded-[1.2rem] object-cover"
                />
              </div>
              <div className="absolute -left-2 bottom-0 w-fit rounded-[1.4rem] bg-white/10 p-3 backdrop-blur-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={services[2].image}
                  alt="Analyse en laboratoire"
                  className="h-32 w-44 rounded-[1rem] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ADRESSES */}
      <section id="adresses" className="relative py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <AddressSelect />
        </div>
      </section>

      {/* PARCOURS */}
      <section id="parcours" className="mx-auto max-w-7xl px-5 pb-24 lg:px-8 lg:pb-36">
        <div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-32">
            <p className="eyebrow">04 / Votre parcours</p>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-.06em] sm:text-6xl">
              Du premier clic au résultat.
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-7 text-muted-foreground">
              Chaque étape est pensée pour vous faire gagner du temps et garder l&apos;esprit
              tranquille.
            </p>
            <div className="mt-10 overflow-hidden rounded-[1.8rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={scientistImage}
                alt="Scientifique préparant une analyse"
                className="h-56 w-full object-cover"
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="journey-step">
              <span>01</span>
              <div>
                <h3>Vous prenez rendez-vous</h3>
                <p>En ligne ou par téléphone, choisissez le créneau et le type de prélèvement.</p>
              </div>
              <CalendarDays />
            </div>
            <div className="journey-step">
              <span>02</span>
              <div>
                <h3>Nous vous accueillons</h3>
                <p>
                  Notre équipe vous guide et vous informe sur les conditions de votre analyse.
                </p>
              </div>
              <Microscope />
            </div>
            <div className="journey-step">
              <span>03</span>
              <div>
                <h3>Vous recevez l&apos;essentiel</h3>
                <p>
                  Vos résultats sont communiqués de façon confidentielle, avec une information
                  claire.
                </p>
              </div>
              <CheckCircle2 />
            </div>
          </div>
        </div>
      </section>

      {/* RENDEZ-VOUS */}
      <AppointmentCard />

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-5 py-24 lg:py-36">
        <div className="text-center">
          <p className="eyebrow">05 / Questions fréquentes</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-.06em] sm:text-6xl">
            On vous explique tout.
          </h2>
        </div>
        <div className="mt-12 divide-y divide-border border-y border-border">
          {faqs.map(([question, answer], index) => (
            <div key={question} className="py-6">
              <button
                className="flex w-full items-center justify-between gap-6 text-left text-lg font-semibold"
                onClick={() => setActiveFaq(activeFaq === index ? -1 : index)}
              >
                {question}
                <ChevronDown
                  className={
                    activeFaq === index
                      ? 'rotate-180 text-accent transition-transform'
                      : 'text-muted-foreground transition-transform'
                  }
                  size={20}
                />
              </button>
              {activeFaq === index && (
                <p className="max-w-2xl pt-4 text-sm leading-7 text-muted-foreground">{answer}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

function FeatureIcon({ name }: { name: string }) {
  if (name === 'Analyses spécialisées') return <TestTube2 size={22} />
  if (name === 'Réponse rapide') return <Zap size={22} />
  return <Home size={22} />
}
