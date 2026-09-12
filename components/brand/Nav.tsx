'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Phone } from 'lucide-react'

import { Logo } from '@/components/brand/Logo'
import { cn } from '@/lib/utils'
import { labos, navLinks, site } from '@/lib/site'

export function Nav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
        <Link href="/" aria-label={site.name} className="shrink-0">
          <Logo className="h-12" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const active =
              link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'nav-link rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[.14em] transition-colors',
                  active ? 'text-leaf' : 'text-muted-foreground hover:text-primary',
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={`tel:${labos[0].tel}`}
            className="hidden items-center gap-2 text-sm font-bold text-primary xl:flex"
          >
            <Phone size={15} />
            {labos[0].phone}
          </a>
          <Link
            href="/contact"
            className="hidden items-center gap-2 rounded-full bg-primary px-5 py-3 text-[11px] font-bold uppercase tracking-[.12em] text-primary-foreground transition-colors hover:bg-leaf sm:inline-flex"
          >
            <CalendarDays size={14} />
            Rendez-vous
          </Link>
          <button
            type="button"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex size-10 items-center justify-center rounded-full border border-border lg:hidden"
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-white px-5 pb-6 pt-2 lg:hidden">
          <nav className="flex flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-border/60 py-4 text-lg font-semibold"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 flex flex-col gap-3">
            {labos.map((labo) => (
              <a
                key={labo.id}
                href={`tel:${labo.tel}`}
                className="flex items-center gap-3 text-sm font-semibold text-primary"
              >
                <Phone size={15} className="text-accent" />
                {labo.short} · {labo.phone}
              </a>
            ))}
          </div>
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="mt-6 flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-4 text-[11px] font-bold uppercase tracking-[.12em] text-primary-foreground"
          >
            <CalendarDays size={14} />
            Prendre rendez-vous
          </Link>
        </div>
      )}
    </header>
  )
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-3.5 w-5">
      <span
        className={cn(
          'absolute left-0 h-0.5 w-5 bg-foreground transition-all duration-300',
          open ? 'top-1.5 rotate-45' : 'top-0',
        )}
      />
      <span
        className={cn(
          'absolute left-0 top-1.5 h-0.5 w-5 bg-foreground transition-all duration-200',
          open && 'opacity-0',
        )}
      />
      <span
        className={cn(
          'absolute left-0 h-0.5 w-5 bg-foreground transition-all duration-300',
          open ? 'top-1.5 -rotate-45' : 'top-3',
        )}
      />
    </span>
  )
}
