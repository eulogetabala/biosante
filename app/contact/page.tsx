import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, Clock3, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'

import { AppointmentCard } from '@/components/sections/AppointmentCard'
import { FocusMapButton } from '@/components/sections/FocusMapButton'
import { LabMap } from '@/components/sections/LabMap'
import { PageHero } from '@/components/sections/PageHero'
import { labos, site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Contact & rendez-vous',
  description:
    'Prenez rendez-vous avec Groupe Bio Santé Diagnostic à Brazzaville ou contactez directement nos deux laboratoires.',
}

const heroImage =
  'https://images.unsplash.com/photo-1631558554184-319c88f4f8a4?auto=format&fit=crop&w=2000&q=88'

const before = [
  {
    title: 'Votre ordonnance',
    text: 'Apportez la prescription de votre médecin. Pour un bilan de contrôle, demandez conseil à l’accueil.',
  },
  {
    title: 'Être à jeun',
    text: 'Certaines analyses imposent un jeûne de 8 à 12 heures. Nous vous le confirmons à la prise de rendez-vous.',
  },
  {
    title: 'Vos résultats',
    text: 'Ils vous sont remis de façon confidentielle, dans le délai annoncé au moment du prélèvement.',
  },
]

export default function ContactPage() {
  return (
    <main className="bg-background">
      <PageHero
        eyebrow="Contact & rendez-vous"
        title="Parlons de votre santé."
        text="Une question sur une analyse, un délai, une préparation ou un prélèvement à domicile ? Notre équipe vous répond du lundi au samedi."
        image={heroImage}
        imageAlt="Accueil du laboratoire d’analyses médicales"
        tags={['Lun → Sam', '07h30 – 18h00', 'Réponse rapide']}
        cta={{ href: '#rendez-vous', label: 'Réserver un créneau' }}
      />

      {/* Coordonnées */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">01 / Nos coordonnées</p>
            <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-[1.02] tracking-[-.05em] sm:text-5xl">
              Deux laboratoires, une même exigence.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-muted-foreground">
            Choisissez le site le plus proche : les analyses et les délais sont identiques sur les
            deux.
          </p>
        </div>

        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {labos.map((labo) => (
            <article
              key={labo.id}
              className="address-card flex flex-col overflow-hidden rounded-[1.9rem] border border-border bg-white"
            >
              <div className="address-photo relative h-44">
                <span className="address-sheen" aria-hidden="true" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={labo.image} alt={labo.name} className="size-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[color-mix(in_oklab,var(--deep)_88%,transparent)] via-transparent to-transparent" />
                <span className="absolute left-5 top-5 rounded-full bg-white/92 px-3 py-1.5 font-mono text-[11px] font-bold text-primary backdrop-blur">
                  {labo.number}
                </span>
                <h3 className="absolute bottom-4 left-5 right-5 text-lg font-semibold leading-tight tracking-[-.03em] text-white">
                  {labo.name}
                </h3>
              </div>

              <div className="flex flex-1 flex-col p-7">
                <dl className="flex-1 space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="mt-0.5 shrink-0 text-leaf" />
                    <dd className="text-muted-foreground">
                      <span className="font-semibold text-foreground">{labo.address}</span>
                      <br />
                      {labo.landmark}
                    </dd>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock3 size={16} className="mt-0.5 shrink-0 text-leaf" />
                    <dd className="text-muted-foreground">
                      <span className="font-semibold text-foreground">{labo.hours}</span>
                      <br />
                      {labo.hoursNote}
                    </dd>
                  </div>
                </dl>

                <div className="mt-7 flex flex-wrap gap-2.5">
                  <a
                    href={`tel:${labo.tel}`}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-[11px] font-bold uppercase tracking-[.12em] text-primary-foreground transition-colors hover:bg-leaf"
                  >
                    <Phone size={14} /> Appeler
                  </a>
                  <a
                    href={`https://wa.me/${labo.tel.replace('+', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3.5 text-[11px] font-bold uppercase tracking-[.12em] text-primary transition-colors hover:border-leaf hover:text-leaf"
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                  <FocusMapButton id={labo.id} />
                </div>
              </div>
            </article>
          ))}

          <article className="brand flex flex-col rounded-[1.9rem] p-8">
            <span className="brand-glow -right-16 -top-20 size-64 bg-brand-light/40" />
            <div className="relative flex h-full flex-col">
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-white/55">
                Par écrit
              </p>
              <h3 className="mt-5 text-2xl font-semibold leading-tight tracking-[-.04em]">
                Nous écrire
              </h3>
              <p className="mt-5 flex-1 text-sm leading-7 text-white/72">
                Pour transmettre une ordonnance, demander un devis ou une information sur un examen
                particulier. Nous répondons sous 24 h ouvrées.
              </p>
              <a
                href={`mailto:${site.email}`}
                className="mt-8 inline-flex items-center gap-2 self-start rounded-full bg-leaf px-5 py-3.5 text-[11px] font-bold uppercase tracking-[.12em] text-leaf-foreground transition-transform duration-300 hover:-translate-y-0.5"
              >
                <Mail size={14} /> Écrire un message
              </a>
              <p className="mt-4 break-all text-xs text-white/55">{site.email}</p>
            </div>
          </article>
        </div>
      </section>

      {/* Formulaire */}
      <AppointmentCard />

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="rounded-[2rem] border border-border bg-white p-10 sm:p-14">
          <p className="eyebrow">02 / Bon à savoir</p>
          <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-[1.05] tracking-[-.05em] sm:text-4xl">
            Avant de venir au laboratoire.
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {before.map((item) => (
              <div key={item.title}>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap gap-2.5 border-t border-border pt-10">
            <Link
              href="/laboratoire"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3.5 text-[11px] font-bold uppercase tracking-[.12em] text-primary transition-colors hover:border-leaf hover:text-leaf"
            >
              Découvrir le laboratoire
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3.5 text-[11px] font-bold uppercase tracking-[.12em] text-primary transition-colors hover:border-leaf hover:text-leaf"
            >
              Voir nos examens
            </Link>
          </div>
        </div>
      </section>

      {/* Carte — en fin de page */}
      <section className="border-t border-border bg-muted px-5 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow">03 / Nous trouver</p>
              <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-[1.02] tracking-[-.05em] sm:text-5xl">
                Sur la carte, à Brazzaville.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-muted-foreground">
              Les deux sites sont accessibles en voiture et en transport en commun. Ouvrez
              l’itinéraire pour un guidage pas à pas.
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-[1.6fr_.9fr]">
            <LabMap />

            <div className="grid gap-4">
              {labos.map((labo) => (
                <a
                  key={labo.id}
                  href={labo.maps}
                  target="_blank"
                  rel="noreferrer"
                  className="panel-card group flex flex-col justify-between rounded-[1.9rem] border border-border bg-white p-7"
                >
                  <div>
                    <span className="rounded-full bg-brand/10 px-3 py-1.5 font-mono text-[11px] font-bold text-brand">
                      {labo.number}
                    </span>
                    <h3 className="mt-5 text-xl font-semibold leading-tight tracking-[-.04em]">
                      {labo.short}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {labo.address}
                      <br />
                      {labo.landmark}
                    </p>
                  </div>
                  <span className="mt-8 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-primary transition-colors group-hover:text-leaf">
                    Ouvrir l’itinéraire <ArrowUpRight size={15} />
                  </span>
                </a>
              ))}

              <div className="rounded-[1.9rem] border border-border bg-white p-7">
                <Clock3 className="text-brand" size={20} />
                <p className="mt-5 text-sm leading-7 text-muted-foreground">
                  Nos deux sites sont ouverts du <span className="font-semibold text-foreground">
                  lundi au samedi de 07h30 à 18h00</span>. Le dimanche, les urgences sont assurées
                  sur appel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
