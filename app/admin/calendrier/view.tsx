'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react'

import {
  effectiveSlot,
  formatMonth,
  formatTime,
  lifecycleOf,
  todayKey,
  type Appointment,
} from '@/lib/appointments'
import { labos } from '@/lib/site'

import { useAppointments } from '../fetch'
import { AdminShell, adminIcons, type AdminLink } from '../shell'
import { buildMonth, shiftMonth, WEEKDAYS } from '@/lib/calendar'

/**
 * Calendrier mensuel des rendez-vous.
 *
 * Ne montre que les créneaux retenus — une demande encore à instruire n'a pas
 * de date ferme, la placer sur un jour donnerait une fausse impression
 * d'engagement.
 *
 * La navigation est purement locale : changer de mois ne relance aucune
 * requête. Les demandes arrivent en une fois et le mois se calcule à
 * l'affichage, ce qui rend le passage d'un mois à l'autre instantané.
 */

export function CalendarView({ admin }: { admin: { name: string; email: string } }) {
  const { appointments, error, loading } = useAppointments()
  const [month, setMonth] = useState(() => todayKey().slice(0, 7))
  const [laboFilter, setLaboFilter] = useState('tous')
  const [selected, setSelected] = useState<string | null>(null)

  const rows = appointments ?? []
  const today = todayKey()

  const scheduled = useMemo(
    () => rows.filter((row) => row.status !== 'nouvelle' && row.status !== 'annulee'),
    [rows],
  )

  const filtered = useMemo(
    () => (laboFilter === 'tous' ? scheduled : scheduled.filter((row) => row.laboId === laboFilter)),
    [scheduled, laboFilter],
  )

  /** Créneaux du mois affiché, groupés par jour. */
  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const row of filtered) {
      const date = effectiveSlot(row).date
      if (!date.startsWith(month)) continue
      const list = map.get(date) ?? []
      list.push(row)
      map.set(date, list)
    }
    for (const list of map.values()) {
      list.sort((a, b) => effectiveSlot(a).time.localeCompare(effectiveSlot(b).time))
    }
    return map
  }, [filtered, month])

  const cells = useMemo(() => buildMonth(month), [month])

  const monthTotal = [...byDay.values()].reduce((sum, list) => sum + list.length, 0)
  const busiest = [...byDay.entries()].sort((a, b) => b[1].length - a[1].length)[0]

  const pending = rows.filter((row) => lifecycleOf(row) === 'recue').length
  const links: AdminLink[] = [
    { href: '/admin', label: "Vue d'ensemble", icon: adminIcons.overview },
    {
      href: '/admin/demandes',
      label: 'Rendez-vous',
      icon: adminIcons.requests,
      count: pending,
      tone: 'alert',
    },
    { href: '/admin/calendrier', label: 'Calendrier', icon: adminIcons.calendar },
    { href: '/admin/patients', label: 'Patients', icon: adminIcons.patients },
  ]

  const selectedRows = selected ? (byDay.get(selected) ?? []) : []

  return (
    <AdminShell admin={admin} links={links}>
      <header className="ad__head">
        <div>
          <p className="ad__crumb">Gestion</p>
          <h1>Calendrier</h1>
          <p>
            Les rendez-vous confirmés, mois par mois. Repérer une journée chargée avant d’y placer
            un nouveau créneau — le laboratoire ouvre 24h/24, une nuit creuse reste une option.
          </p>
        </div>

        <div className="ad-filters__right">
          <div className="ad-cal__nav">
            <button
              type="button"
              className="ad-cal__btn"
              onClick={() => setMonth(shiftMonth(month, -1))}
              aria-label="Mois précédent"
            >
              <ChevronLeft />
            </button>
            <span className="ad-cal__month">{formatMonth(month)}</span>
            <button
              type="button"
              className="ad-cal__btn"
              onClick={() => setMonth(shiftMonth(month, 1))}
              aria-label="Mois suivant"
            >
              <ChevronRight />
            </button>
          </div>

          <select
            value={laboFilter}
            onChange={(event) => setLaboFilter(event.target.value)}
            className="admin-select"
            aria-label="Filtrer par laboratoire"
          >
            <option value="tous">Les deux sites</option>
            {labos.map((labo) => (
              <option key={labo.id} value={labo.id}>
                {labo.short}
              </option>
            ))}
          </select>
        </div>
      </header>

      {error ? <p className="admin-alert admin-alert--error">{error}</p> : null}
      {loading ? <p className="ad-panel__hint">Chargement…</p> : null}

      {!loading ? (
        <div className="ad-grid ad-grid--2">
          <div className="ad-panel">
            <div className="ad-panel__head">
              <div>
                <p className="ad-panel__title">{monthTotal} rendez-vous ce mois</p>
                <p className="ad-panel__hint">
                  {busiest
                    ? `Journée la plus chargée : ${busiest[1].length} rendez-vous le ${busiest[0].split('-').reverse().slice(0, 2).join('/')}.`
                    : 'Aucun rendez-vous sur ce mois.'}
                </p>
              </div>
              <button type="button" className="ad-cal__btn" onClick={() => setMonth(today.slice(0, 7))}>
                <CalendarDays />
              </button>
            </div>

            <div className="ad-cal">
              {WEEKDAYS.map((day) => (
                <span className="ad-cal__dow" key={day}>
                  {day}
                </span>
              ))}

              {cells.map((cell) => {
                const list = byDay.get(cell.key) ?? []
                const className = [
                  'ad-cal__day',
                  cell.inMonth ? '' : 'ad-cal__day--off',
                  cell.key === today ? 'ad-cal__day--today' : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <button
                    type="button"
                    key={cell.key}
                    className={className}
                    onClick={() => setSelected(list.length > 0 ? cell.key : null)}
                    style={{ textAlign: 'left', cursor: list.length > 0 ? 'pointer' : 'default' }}
                  >
                    <span className="ad-cal__num">{cell.day}</span>
                    <span className="ad-cal__tags">
                      {list.slice(0, 2).map((row) => (
                        <span
                          className="ad-cal__tag"
                          key={row.id}
                        >
                          {formatTime(effectiveSlot(row).time)} {row.name.split(' ')[0]}
                        </span>
                      ))}
                      {list.length > 2 ? (
                        <span className="ad-cal__tag" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                          +{list.length - 2}
                        </span>
                      ) : null}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="ad-cal__legend">
              <span>
                <i style={{ background: 'color-mix(in oklab, var(--brand) 35%, transparent)' }} />
                Confirmé, patient prévenu
              </span>
              <span>
                <i style={{ background: 'color-mix(in oklab, #c2740a 35%, transparent)' }} />
                Confirmation pas encore envoyée
              </span>
            </div>
          </div>

          <div className="ad-panel">
            <div className="ad-panel__head">
              <div>
                <p className="ad-panel__title">
                  {selected
                    ? selected.split('-').reverse().join('/')
                    : 'Détail d’une journée'}
                </p>
                <p className="ad-panel__hint">
                  {selected
                    ? `${selectedRows.length} rendez-vous`
                    : 'Cliquez un jour marqué pour en voir le détail.'}
                </p>
              </div>
            </div>

            {selected && selectedRows.length > 0 ? (
              <div className="ad-list">
                {selectedRows.map((row) => (
                  <div className="ad-item" key={row.id}>
                    <span className="ad-item__time">{formatTime(effectiveSlot(row).time)}</span>
                    <span>
                      <span className="ad-item__name">{row.name}</span>
                      <span className="ad-item__meta">
                        <MapPin size={10} style={{ display: 'inline', marginRight: 4 }} />
                        {row.laboLabel} · {row.service}
                      </span>
                    </span>
                    {/* Le calendrier ne liste que des rendez-vous confirmés :
                        une demande encore à traiter n'a pas de date ferme. */}
                    <span className="admin-pill status-done">Confirmé</span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p className="ad-panel__hint" style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <Clock size={13} /> Cliquez un jour du calendrier pour afficher les créneaux.
                </p>
                {busiest ? (
                  <button
                    type="button"
                    className="admin-ghost-btn"
                    style={{ marginTop: '.9rem' }}
                    onClick={() => setSelected(busiest[0])}
                  >
                    Voir la journée la plus chargée
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </AdminShell>
  )
}
