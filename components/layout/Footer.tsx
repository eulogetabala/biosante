import Link from 'next/link'
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react'

import { labos, navLinks, site } from '@/lib/site'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer id="contact" className="relative overflow-hidden bg-primary text-primary-foreground">
      <div className="pointer-events-none absolute -left-24 top-0 size-80 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 size-80 rounded-full bg-brand/25 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" aria-label={site.name} className="inline-block">
              <span className="inline-flex items-center justify-center rounded-2xl bg-white p-2 ring-1 ring-white/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={site.logo} alt={site.name} className="h-16 w-auto object-contain" />
              </span>
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-7 text-primary-foreground/70">
              {site.tagline}. Une biologie médicale plus claire, plus proche, plus humaine, au
              service des familles de Brazzaville.
            </p>
            <a
              href={`mailto:${site.email}`}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent"
            >
              <Mail size={15} />
              {site.email}
            </a>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary-foreground/50">
              Navigation
            </p>
            <ul className="mt-5 space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-sm text-primary-foreground/80"
                  >
                    {link.label}
                    <ArrowUpRight
                      size={13}
                      className="opacity-0 transition-all duration-300 group-hover:opacity-100"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary-foreground/50">
              Nos laboratoires
            </p>
            <ul className="mt-5 space-y-6">
              {labos.map((labo) => (
                <li key={labo.id}>
                  <p className="text-sm font-semibold">{labo.name}</p>
                  <p className="mt-1.5 flex items-start gap-2 text-xs leading-5 text-primary-foreground/60">
                    <MapPin size={13} className="mt-0.5 shrink-0 text-accent" />
                    {labo.address}
                  </p>
                  <a
                    href={`tel:${labo.tel}`}
                    className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-primary-foreground"
                  >
                    <Phone size={13} className="text-accent" />
                    {labo.phone}
                  </a>
                </li>
              ))}
            </ul>          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-white/15 pt-6 text-[11px] text-primary-foreground/55 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} {site.name}
          </span>
          <span className="flex flex-wrap items-center gap-4">
            <span>Confidentialité</span>
            <span>Mentions légales</span>
            <span className="text-primary-foreground/40">{site.city}</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
