'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Bell, CalendarDays, Search, X } from 'lucide-react'

import { site } from '@/lib/site'

/**
 * Coquille de l'espace d'administration : menu latéral fixe et zone de contenu.
 *
 * Composant client uniquement pour une raison : `usePathname` permet de savoir
 * quelle vue est ouverte. Le déduire d'une propriété transmise par chaque page
 * marcherait aussi, mais demanderait de penser à la mettre à jour à chaque
 * nouvelle page — un oubli laisserait un menu muet, sans erreur visible.
 *
 * Deux dispositions, une seule structure. À partir de 1024 px, un menu latéral
 * ancré à gauche. En dessous, une barre compacte à onglets défilants : un menu
 * replié derrière un bouton imposerait un geste de plus à chaque changement de
 * vue, sur l'appareil où l'écran est le plus rare.
 *
 * La navigation est décrite une seule fois puis rendue dans les deux
 * dispositions, qui ne peuvent donc pas diverger.
 */

export type AdminLink = {
  href: string
  label: string
  /** Valeur affichée à droite ; `alert` la teinte pour signaler une action due. */
  count?: number
  tone?: 'neutral' | 'alert'
  icon: React.ReactNode
}

const icons = {
  overview: (
    <>
      <rect x="3" y="3" width="7.5" height="9.5" rx="1.6" />
      <rect x="13.5" y="3" width="7.5" height="5.5" rx="1.6" />
      <rect x="13.5" y="12" width="7.5" height="9" rx="1.6" />
      <rect x="3" y="16" width="7.5" height="5" rx="1.6" />
    </>
  ),
  requests: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="17" rx="2.6" />
      <path d="M3 10h18M8 2.5v4M16 2.5v4" />
    </>
  ),
  patients: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
    </>
  ),
  labs: <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
} as const

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

function initials(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'AD'
  )
}

/**
 * Logo du site, sans le cadre blanc de `Logo`.
 *
 * Le composant partagé s'entoure d'une pastille blanche, pensée pour un fond
 * clair. Ici le fond est bleu nuit : la pastille du menu fait déjà ce travail,
 * et l'imbriquer donnerait une bordure blanche en double.
 */
function BrandMark({ className }: { className: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-white p-1 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={site.logo} alt={site.name} className="h-full w-auto object-contain" />
    </span>
  )
}

export function AdminShell({
  admin,
  links,
  children,
}: {
  admin: { name: string; email: string }
  links: AdminLink[]
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Correspondance exacte d'abord, puis par préfixe : `/admin/demandes/123`
  // doit garder « Demandes » allumé sans qu'il faille le déclarer.
  function isActive(href: string): boolean {
    if (pathname === href) return true
    return href !== '/admin' && pathname.startsWith(`${href}/`)
  }

  const config: AdminLink = {
    href: '/admin/laboratoires',
    label: 'Laboratoires',
    icon: icons.labs,
  }

  // Les alertes se déduisent des compteurs du menu : une demandée marquée
  // « alert » est une action due. Pas de second calcul à tenir en cohérence.
  const alerts = links
    .filter((link) => link.tone === 'alert')
    .reduce((sum, link) => sum + (link.count ?? 0), 0)

  return (
    <div className="ad">
      {/* --- Menu latéral (grands écrans) --- */}
      <aside className="ad__side">
        <div className="ad__brand">
          <BrandMark className="h-9 w-9" />
          <span className="ad__brand-txt">
            <b>GR Biosante</b>
            <span>Administration</span>
          </span>
        </div>

        <nav className="ad__nav">
          <p className="ad__nav-label">Gestion</p>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(link.href) ? 'ad__link ad__link--on' : 'ad__link'}
              aria-current={isActive(link.href) ? 'page' : undefined}
            >
              <Icon>{link.icon}</Icon>
              {link.label}
              {typeof link.count === 'number' && link.count > 0 ? (
                <span className={link.tone === 'alert' ? 'ad__count ad__count--alert' : 'ad__count'}>
                  {link.count}
                </span>
              ) : null}
            </Link>
          ))}

          <hr />
          <p className="ad__nav-label">Configuration</p>
          <Link
            href={config.href}
            className={isActive(config.href) ? 'ad__link ad__link--on' : 'ad__link'}
            aria-current={isActive(config.href) ? 'page' : undefined}
          >
            <Icon>{config.icon}</Icon>
            {config.label}
          </Link>
        </nav>

        <div className="ad__foot">
          <div className="ad__who">
            <span className="ad__who-ava">{initials(admin.name)}</span>
            <span className="ad__who-txt">
              <b>{admin.name}</b>
              <span>{admin.email || site.email}</span>
            </span>
          </div>
          <form action="/api/session" method="post">
            <input type="hidden" name="action" value="logout" />
            <button type="submit" className="ad__out">
              <Icon>{icons.logout}</Icon>
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      <div className="ad__col">
        {/* --- Barre compacte (petits écrans, avant 1024 px) --- */}
        <div className="ad__bar">
          <BrandMark className="h-7 w-7" />
          <span className="ad__bar-ava">{initials(admin.name)}</span>
        </div>
        <nav className="ad__bar-tabs">
          {[...links, config].map((link) => (
            <Link key={link.href} href={link.href} data-on={isActive(link.href)} aria-current={isActive(link.href) ? 'page' : undefined}>
              {link.label}
              {typeof link.count === 'number' && link.count > 0 ? ` (${link.count})` : ''}
            </Link>
          ))}
        </nav>

        {/* `Topbar` lit `?q=` avec `useSearchParams`. Sans cette limite, Next
            remonte le composant jusqu'à la racine et régénère tout l'arbre à
            l'hydratation — la coquille entière était reconstruite côté client,
            ce qui produisait un avertissement de désaccord d'hydratation à
            chaque chargement. */}
        <Suspense fallback={null}>
          <Topbar admin={admin} alerts={alerts} />
        </Suspense>

        <Suspense fallback={<ShellPlaceholder />}>
          <main className="ad__main">{children}</main>
        </Suspense>
      </div>
    </div>
  )
}

/**
 * Attente pendant que la vue hydratée se met en place.
 *
 * Volontairement sobre : de simples barres, sans texte. Un libellé « Chargement »
 * apparaîtrait puis disparaîtrait sur chaque navigation, ce qui se remarque plus
 * qu'une silhouette discrète.
 */
function ShellPlaceholder() {
  return (
    <div className="ad-skeleton" aria-hidden="true">
      <span style={{ width: '11rem', height: '1.4rem' }} />
      <span style={{ width: '22rem', height: '.75rem' }} />
      <div className="ad-skeleton__card">
        <span style={{ width: '100%', height: '.9rem' }} />
        <span style={{ width: '70%', height: '.9rem' }} />
        <span style={{ width: '85%', height: '.9rem' }} />
      </div>
    </div>
  )
}

/**
 * Barre supérieure : recherche, alertes, date et heure.
 *
 * La recherche écrit dans l'URL (`?q=`) plutôt que dans un état local. C'est ce
 * qui lui permet d'être globale : depuis le calendrier, valider la recherche
 * ouvre le board avec le filtre déjà posé. Et sur le board, où le champ est
 * pertinent, la frappe met à jour l'URL sans recharger — le filtre vivant dans
 * l'URL, un rechargement ou un lien partagé le conserve.
 */
function Topbar({ admin, alerts }: { admin: { name: string; email: string }; alerts: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [value, setValue] = useState('')
  // Vide au premier rendu, puis rempli au montage : la date et l'heure du
  // serveur seraient périmées à l'arrivée, et les figer dans le HTML rendrait
  // l'hydratation instable.
  const [clock, setClock] = useState({ day: '', time: '' })

  const onBoard = pathname === '/admin/demandes'
  const fromUrl = params.get('q') ?? ''

  // Le champ suit l'URL : un retour arrière réaffiche la recherche précédente.
  useEffect(() => {
    setValue(fromUrl)
  }, [fromUrl])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock({ day: DAY.format(now), time: CLOCK.format(now) })
    }
    tick()
    const timer = window.setInterval(tick, 20_000)
    return () => window.clearInterval(timer)
  }, [])

  // Sur le board, la frappe filtre en direct : on remplace l'entrée d'historique
  // pour ne pas empiler une étape par caractère. Ailleurs, la validation
  // navigue — un `push`, pour que le retour ramène à la page quittée.
  useEffect(() => {
    if (!onBoard || value === fromUrl) return
    const timer = window.setTimeout(() => commit(value), 260)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, onBoard])

  function commit(next: string) {
    const search = next.trim()
    const target = search ? `/admin/demandes?q=${encodeURIComponent(search)}` : '/admin/demandes'
    if (onBoard) router.replace(target, { scroll: false })
    else router.push(target)
  }

  return (
    <div className="ad-top">
      <form
        className="ad-top__search"
        onSubmit={(event) => {
          event.preventDefault()
          commit(value)
        }}
      >
        <Search />
        <input
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Rechercher un patient, une demande, un service…"
          aria-label="Rechercher"
        />
        {value ? (
          <button
            type="button"
            className="ad-top__clear"
            onClick={() => {
              setValue('')
              if (onBoard) commit('')
            }}
            aria-label="Effacer la recherche"
          >
            <X />
          </button>
        ) : null}
      </form>

      <div className="ad-top__right">
        <Link href="/admin/demandes" className="ad-top__icon" aria-label="Rendez-vous à traiter">
          <Bell />
          {alerts > 0 ? <span className="ad-top__dot">{alerts > 99 ? '99+' : alerts}</span> : null}
        </Link>

        <span className="ad-top__when">
          <b>{clock.day}</b>
          <span>{clock.time}</span>
        </span>

        <span className="ad-top__user">
          <span className="ad-top__ava">{initials(admin.name)}</span>
          <span>
            <b>{admin.name.split(' ')[0]}</b>
            <span>Administrateur</span>
          </span>
        </span>
      </div>
    </div>
  )
}

/** Même fuseau que le laboratoire, pour que l'horloge de la console soit la sienne. */
const DAY = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'Africa/Brazzaville',
})

const CLOCK = new Intl.DateTimeFormat('fr-FR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Africa/Brazzaville',
})

export { icons as adminIcons }
