'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  FlaskConical,
  Inbox,
  Quote,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'

import {
  effectiveSlot,
  formatDayShort,
  formatDayWithWeekday,
  formatTime,
  lifecycleOf,
  summarize,
  type Appointment,
} from '@/lib/appointments'

import { ActivityChart, Donut, HourBuckets } from './charts'
import { useAppointments } from './fetch'
import { AdminShell, adminIcons, type AdminLink } from './shell'

/**
 * Vue d'ensemble.
 *
 * Répond à une seule question : que faut-il faire maintenant ? Les chiffres
 * du mois et la répartition par type d'analyse donnent le contexte ; les deux
 * files d'action — demandes à instruire, confirmations pas encore transmises —
 * donnent le travail.
 *
 * Les actions ne sont pas proposées ici : confirmer un créneau demande le
 * sélecteur de date, qui vit dans le tiroir de traitement du board. Dupliquer
 * ce formulaire à deux endroits garantirait qu'ils divergent.
 */

/** Tranches de la journée, découpées selon l'usage réel du laboratoire. */
const BUCKETS = [
  { label: 'Nuit', from: 0, to: 6 },
  { label: 'Matin', from: 6, to: 12 },
  { label: 'Après-midi', from: 12, to: 18 },
  { label: 'Soir', from: 18, to: 24 },
]

/** Répartition des rendez-vous confirmés par tranche horaire. */
function hourBuckets(appointments: Appointment[]) {
  const counts = BUCKETS.map((bucket) => ({ label: bucket.label, count: 0 }))

  for (const row of appointments) {
    const stage = lifecycleOf(row)
    if (stage !== 'notifiee') continue

    const hour = Number(effectiveSlot(row).time.slice(0, 2))
    if (Number.isNaN(hour)) continue

    const index = BUCKETS.findIndex((bucket) => hour >= bucket.from && hour < bucket.to)
    if (index >= 0) counts[index].count += 1
  }

  return counts
}

function initialsOf(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '—'
  )
}

/**
 * Étiquette d'état, alignée sur le cycle de vie réel.
 *
/**
 * Étiquette d'état, alignée sur le cycle de vie réel.
 *
 * Un seul nom par état, dans toutes les vues : la vue d'ensemble disait
 * « Confirmé » là où la fiche patient disait « Prévenu », et l'on perdait le
 * fil d'une page à l'autre.
 */
function StageChip({ stage }: { stage: ReturnType<typeof lifecycleOf> }) {
  if (stage === 'notifiee') {
    return (
      <span className="ad-chip ad-chip--ok">
        <i />
        Confirmé
      </span>
    )
  }
  if (stage === 'annulee') {
    return (
      <span className="ad-chip ad-chip--off">
        <i />
        Annulé
      </span>
    )
  }
  return (
    <span className="ad-chip ad-chip--new">
      <i />
      À traiter
    </span>
  )
}

export function Console({ admin }: { admin: { name: string; email: string } }) {
  const { appointments, error, loading } = useAppointments()

  const rows = appointments ?? []
  const stats = summarize(rows)
  const buckets = hourBuckets(rows)

  const links: AdminLink[] = [
    { href: '/admin', label: "Vue d'ensemble", icon: adminIcons.overview },
    {
      href: '/admin/demandes',
      label: 'Rendez-vous',
      icon: adminIcons.requests,
      count: stats.recues,
      tone: 'alert',
    },
    { href: '/admin/calendrier', label: 'Calendrier', icon: adminIcons.calendar },
    { href: '/admin/patients', label: 'Patients', icon: adminIcons.patients, count: stats.patients },
  ]

  // Tendance du mois : comparée au mois précédent, jamais à zéro. Un premier
  // mois sans historique affiche « — » plutôt qu'une hausse de 100 % qui ne
  // veut rien dire.
  const trend =
    stats.moisPrecedent === 0
      ? null
      : Math.round(((stats.ceMois - stats.moisPrecedent) / stats.moisPrecedent) * 100)

  // Confirmer engage le rendez-vous et prévient le patient dans le même geste :
  // il ne reste donc plus de confirmation « en retard » à signaler.

  return (
    <AdminShell admin={admin} links={links}>
      <header className="ad__head">
        <div>
          <h1>Vue d&apos;ensemble</h1>
          <p>
            Bonjour {admin.name.split(' ')[0]} — voici l&apos;état du laboratoire aujourd&apos;hui.
          </p>
        </div>

        <Link href="/admin/demandes" className="admin-ghost-btn">
          Traiter les demandes
          <ArrowRight size={14} />
        </Link>
      </header>

      {error ? (
        <p className="admin-alert admin-alert--error">
          <AlertTriangle size={15} />
          {error}
        </p>
      ) : null}

      {loading ? <p className="ad-panel__hint">Chargement des demandes…</p> : null}

      {!loading && rows.length === 0 && !error ? (
        <div className="admin-empty">
          <Inbox size={24} className="mx-auto text-brand" />
          <p className="mt-4 font-semibold">Aucune demande pour l’instant.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Les demandes envoyées depuis le site apparaîtront ici.
          </p>
        </div>
      ) : null}

      {!loading && rows.length > 0 ? (
        <>
          {/* Le seul cas qui mérite d'interrompre : des demandes attendent une
              décision. Une fois confirmées, elles ne demandent plus rien. */}
          {stats.recues > 0 ? (
            <div className="ad-call">
              <span className="ad-call__ic">
                <CalendarClock />
              </span>
              <div>
                <b>
                  {stats.recues} demande{stats.recues > 1 ? 's' : ''} à traiter
                </b>
                <p>
                  Confirmez le créneau demandé, ajustez-le, ou annulez — le message au patient part
                  dans la foulée.
                </p>
              </div>
              <span className="ad-call__act">
                <Link href="/admin/demandes" className="admin-primary-btn">
                  Traiter maintenant
                </Link>
              </span>
            </div>
          ) : null}

          <div className="ad-kpis">
            <Kpi
              href="/admin/patients"
              label="Patients suivis"
              value={stats.patients}
              icon={<Users />}
              tone="blue"
              foot={`${stats.ceMois} demande${stats.ceMois > 1 ? 's' : ''} ce mois`}
              trend={trend}
            />
            <Kpi
              href="/admin/demandes"
              label="Rendez-vous à traiter"
              value={stats.recues}
              icon={<ClipboardList />}
              tone="amber"
              foot="sans créneau confirmé"
            />
            <Kpi
              href="/admin/calendrier"
              label="Rendez-vous du jour"
              value={stats.aujourdhui.length}
              icon={<CalendarDays />}
              tone="leaf"
              foot={
                stats.aujourdhui.length > 0
                  ? 'créneaux confirmés aujourd’hui'
                  : 'aucun créneau aujourd’hui'
              }
            />
            <Kpi
              href="/admin/laboratoires"
              label="Laboratoires"
              value={stats.parLabo.length}
              icon={<FlaskConical />}
              tone="ink"
              foot={
                stats.parLabo
                  .map((labo) => `${labo.count} ${labo.label}`)
                  .join(' · ') || 'aucune demande'
              }
            />
          </div>

          {/* Courbe à gauche, donut au centre, actions à droite : même triptyque
              que le modèle, mais le panneau large occupe deux tiers. */}
          <div className="ad-trio">
            <div className="ad-panel">
              <div className="ad-panel__head">
                <div>
                  <p className="ad-panel__title">Évolution des demandes</p>
                  <p className="ad-panel__hint">
                    Demandes reçues et rendez-vous confirmés, jour par jour.
                  </p>
                </div>
                <div className="ad-cal__legend" style={{ marginTop: 0 }}>
                  <span>
                    <i style={{ background: 'var(--brand)' }} /> Demandes reçues
                  </span>
                  <span>
                    <i style={{ background: 'var(--leaf)' }} /> Rendez-vous confirmés
                  </span>
                </div>
              </div>

              <ActivityChart data={stats.serie} />
            </div>

            <div className="ad-panel">
              <div className="ad-panel__head">
                <div>
                  <p className="ad-panel__title">Types d’analyses</p>
                  <p className="ad-panel__hint">Répartition des demandes par service.</p>
                </div>
              </div>
              <Donut data={stats.parService} centerLabel="demandes" />
            </div>

            <div className="ad-panel">
              <div className="ad-panel__head">
                <div>
                  <p className="ad-panel__title">Charge horaire</p>
                  <p className="ad-panel__hint">Sur les rendez-vous confirmés.</p>
                </div>
              </div>
              <HourBuckets data={buckets} />
            </div>
          </div>

          <div className="ad-split">
            <div className="ad-panel">
              <div className="ad-panel__head">
                <div>
                  <p className="ad-panel__title">Rendez-vous récents</p>
                  <p className="ad-panel__hint">Les dernières arrivées, tous états confondus.</p>
                </div>
                <Link href="/admin/demandes" className="ad-panel__link">
                  Voir toutes les demandes →
                </Link>
              </div>

              <div className="ad-tablewrap">
                <table className="ad-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Type d’analyse</th>
                      <th>Créneau</th>
                      <th>Statut</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {[...rows]
                      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
                      .slice(0, 6)
                      .map((row) => {
                        const stage = lifecycleOf(row)
                        const slot = effectiveSlot(row)
                        const tone =
                          stage === 'notifiee'
                            ? 'ad-ava ad-ava--done'
                            : stage === 'annulee'
                              ? 'ad-ava ad-ava--off'
                              : 'ad-ava'

                        return (
                          <tr key={row.id}>
                            <td>
                              <span className="ad-table__who">
                                <span className={tone}>{initialsOf(row.name)}</span>
                                <span>
                                  <span className="ad-table__name">{row.name}</span>
                                  <span className="ad-table__meta">
                                    {row.dial} {row.phone}
                                  </span>
                                </span>
                              </span>
                            </td>
                            <td>
                              <span className="ad-chip ad-chip--new">{row.service}</span>
                            </td>
                            <td className="ad-table__slot">
                              {formatDayWithWeekday(slot.date)}
                              <br />
                              <span className="ad-table__meta">{formatTime(slot.time)}</span>
                            </td>
                            <td>
                              <StageChip stage={stage} />
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <Link
                                href={`/admin/demandes?q=${encodeURIComponent(row.phone)}`}
                                className="ad-rowgo"
                                aria-label={`Traiter la demande de ${row.name}`}
                              >
                                <ArrowRight />
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="ad-panel">
              <div className="ad-panel__head">
                <div>
                  <p className="ad-panel__title">Prochains rendez-vous</p>
                  <p className="ad-panel__hint">À partir d’aujourd’hui.</p>
                </div>
                <Link href="/admin/calendrier" className="ad-panel__link">
                  Calendrier →
                </Link>
              </div>

              {stats.prochains.length === 0 ? (
                <p className="ad-panel__hint">
                  Aucun rendez-vous confirmé à venir. Confirmez une demande pour en faire
                  apparaître ici.
                </p>
              ) : (
                <div className="ad-coming">
                  {stats.prochains.map((row) => {
                    const slot = effectiveSlot(row)
                    return (
                      <div className="ad-coming__row" key={row.id}>
                        <span>
                          <span className="ad-coming__time">{formatTime(slot.time)}</span>
                          <span className="ad-coming__day">{formatDayShort(slot.date)}</span>
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <span className="ad-coming__name">{row.name}</span>
                          <span className="ad-coming__meta">{row.service}</span>
                        </span>
                        <StageChip stage={lifecycleOf(row)} />
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="ad-quote-banner">
                <Quote />
                <div>
                  <b>La meilleure santé commence par une bonne analyse.</b>
                  <span>GR Biosante</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </AdminShell>
  )
}

/**
 * Chiffre clé.
 *
 * `trend` n'apparaît que si un mois précédent existe : afficher « +100 % » le
 * premier mois serait exact arithmétiquement et trompeur à la lecture.
 */
function Kpi({
  href,
  label,
  value,
  icon,
  tone,
  foot,
  trend,
}: {
  href: string
  label: string
  value: number
  icon: React.ReactNode
  tone: 'blue' | 'leaf' | 'amber' | 'ink'
  foot: string
  trend?: number | null
}) {
  const trendClass =
    trend === null || trend === undefined
      ? 'ad-kpi__trend ad-kpi__trend--flat'
      : trend > 0
        ? 'ad-kpi__trend ad-kpi__trend--up'
        : trend < 0
          ? 'ad-kpi__trend ad-kpi__trend--down'
          : 'ad-kpi__trend ad-kpi__trend--flat'

  return (
    <Link href={href} className={`ad-kpi ad-kpi--${tone}`}>
      <span className="ad-kpi__top">
        <span className="ad-kpi__ic">{icon}</span>
        <span className="ad-kpi__label">{label}</span>
        <span className="ad-kpi__go">
          <ArrowRight />
        </span>
      </span>

      <span className="ad-kpi__val">{value}</span>

      <span className="ad-kpi__foot">
        {trend !== null && trend !== undefined ? (
          <span className={trendClass}>
            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trend > 0 ? '+' : ''}
            {trend}%
          </span>
        ) : null}
        {foot}
      </span>
    </Link>
  )
}
