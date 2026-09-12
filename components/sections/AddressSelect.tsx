import { ArrowUpRight, CalendarDays, Clock3, Compass, MapPin, Phone } from 'lucide-react'

import { labos } from '@/lib/site'

type Props = {
  /** Affiche l'en-tête de section (eyebrow + titre) */
  header?: boolean
  eyebrow?: string
}

/**
 * Section « Nos adresses » — disposition éditoriale alternée :
 * une grande image d'un côté, les informations de l'autre,
 * puis inversion pour le second laboratoire.
 */
export function AddressSelect({ header = true, eyebrow = '03 / Nos adresses' }: Props) {
  return (
    <div className="relative">
      {header && (
        <div className="mb-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="mt-5 max-w-2xl text-4xl font-semibold leading-[.98] tracking-[-.06em] sm:text-6xl">
              Deux portes d&apos;entrée vers votre santé.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-muted-foreground">
            Mpila et Cité Flamboyants partagent le même plateau technique, les mêmes délais et la
            même équipe. Choisissez simplement le site le plus proche.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {labos.map((labo, i) => {
          const flip = i % 2 === 1
          return (
            <article
              key={labo.id}
              className="address-row group relative overflow-hidden rounded-[2.2rem] border border-border bg-white"
            >
              <div className="grid lg:grid-cols-2">
                <div
                  className={`relative min-h-[18rem] lg:min-h-[26rem] ${
                    flip ? 'lg:order-2' : ''
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={labo.image}
                    alt={labo.name}
                    className="absolute inset-0 size-full object-cover transition-transform duration-[1000ms] ease-out group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[color-mix(in_oklab,var(--deep)_70%,transparent)] via-transparent to-transparent lg:from-[color-mix(in_oklab,var(--deep)_45%,transparent)]" />
                  <span className="absolute left-6 top-6 rounded-full bg-white/90 px-3.5 py-1.5 font-mono text-[11px] font-semibold text-primary backdrop-blur">
                    {labo.number}
                  </span>
                </div>

                <div className="flex flex-col justify-center gap-7 p-8 sm:p-12">
                  <div>
                    <p className="eyebrow">{labo.short}</p>
                    <h3 className="mt-4 text-3xl font-semibold leading-tight tracking-[-.05em] sm:text-4xl">
                      {labo.name}
                    </h3>
                  </div>

                  <dl className="space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                      <MapPin size={17} className="mt-0.5 shrink-0 text-brand" />
                      <div>
                        <dt className="sr-only">Adresse</dt>
                        <dd className="font-semibold text-foreground">{labo.address}</dd>
                        <dd className="mt-0.5 text-muted-foreground">{labo.landmark}</dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Compass size={17} className="mt-0.5 shrink-0 text-brand" />
                      <div>
                        <dt className="sr-only">Accès</dt>
                        <dd className="text-muted-foreground">
                          Accueil sans rendez-vous · parking à proximité
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock3 size={17} className="mt-0.5 shrink-0 text-brand" />
                      <div>
                        <dt className="sr-only">Horaires</dt>
                        <dd className="font-semibold text-foreground">{labo.hours}</dd>
                        <dd className="mt-0.5 text-muted-foreground">{labo.hoursNote}</dd>
                      </div>
                    </div>
                  </dl>

                  <div className="flex flex-wrap gap-2.5">
                    <a
                      href={`tel:${labo.tel}`}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 text-[11px] font-bold uppercase tracking-[.12em] text-primary-foreground transition-colors hover:bg-leaf"
                    >
                      <Phone size={14} />
                      {labo.phone}
                    </a>
                    <a
                      href={labo.maps}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3.5 text-[11px] font-bold uppercase tracking-[.12em] text-primary transition-colors hover:border-leaf hover:text-leaf"
                    >
                      <MapPin size={14} />
                      Itinéraire
                      <ArrowUpRight size={13} />
                    </a>
                    <a
                      href="/contact"
                      className="inline-flex items-center gap-2 rounded-full px-4 py-3.5 text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground transition-colors hover:text-leaf"
                    >
                      <CalendarDays size={14} />
                      Rendez-vous
                    </a>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
