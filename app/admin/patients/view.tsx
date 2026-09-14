'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, ChevronRight, Phone, Search, Users } from 'lucide-react'

import { formatDate, formatTime, lifecycleOf, type Appointment } from '@/lib/appointments'

import { groupByPhone, useAppointments } from '../fetch'
import { AdminShell, adminIcons, type AdminLink } from '../shell'

/**
 * Patients, regroupés par numéro de téléphone.
 *
 * Vue dérivée : aucune collection « patients » n'existe en base, et rien n'est
 * dupliqué ni maintenu. C'est un choix, pas une simplification subie. Le nom
 * saisi dans le formulaire est libre — « Awa Mbemba », « awa mbemba » et
 * « A. Mbemba » désignent la même personne — donc grouper par nom produirait
 * des fiches fantômes. Le numéro de téléphone est l'identifiant le plus fiable
 * dont on dispose sans faire créer un compte au patient.
 *
 * Conséquence assumée : deux personnes partageant un même numéro apparaîtront
 * ensemble. C'est rare, visible, et sans gravité.
 */

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

function lastVisit(rows: Appointment[]): string {
  const stamps = rows.map((row) => row.createdAt).filter(Boolean).sort()
  return stamps[stamps.length - 1] ?? ''
}

export function PatientsView({ admin }: { admin: { name: string; email: string } }) {
  const { appointments, error, loading } = useAppointments()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const rows = appointments ?? []

  const groups = useMemo(() => {
    const all = groupByPhone(rows)
    const needle = query.trim().toLowerCase()
    if (!needle) return all

    return all.filter((group) =>
      [group.name, group.phone, ...group.rows.map((row) => row.service)]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [rows, query])

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
    {
      href: '/admin/patients',
      label: 'Patients',
      icon: adminIcons.patients,
      count: groups.length,
    },
  ]

  return (
    <AdminShell admin={admin} links={links}>
      <header className="ad__head">
        <div>
          <p className="ad__crumb">Gestion</p>
          <h1>Patients</h1>
          <p>
            Regroupés par numéro de téléphone. Le nom étant saisi librement dans le formulaire,
            c’est le seul identifiant fiable sans faire créer un compte au patient.
          </p>
        </div>

        <label className="admin-search">
          <Search size={15} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nom, numéro, service…"
          />
        </label>
      </header>

      {error ? (
        <p className="admin-alert admin-alert--error">
          <AlertTriangle size={15} />
          {error}
        </p>
      ) : null}

      {loading ? <p className="ad-panel__hint">Chargement…</p> : null}

      {!loading && groups.length === 0 ? (
        <div className="admin-empty">
          <Users size={24} className="mx-auto text-brand" />
          <p className="mt-4 font-semibold">
            {query ? 'Aucun patient ne correspond à cette recherche.' : 'Aucun patient pour l’instant.'}
          </p>
        </div>
      ) : null}

      {!loading && groups.length > 0 ? (
        <div className="ad-panel">
          <div className="ad-list">
            {groups.map((group) => {
              const isOpen = open === group.key
              return (
                <div key={group.key}>
                  <button
                    type="button"
                    className="ad-item"
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 0, borderBottom: '1px solid var(--border)', cursor: 'pointer', font: 'inherit' }}
                    onClick={() => setOpen(isOpen ? null : group.key)}
                    aria-expanded={isOpen}
                  >
                    <span className="ad-ava">{initialsOf(group.name)}</span>
                    <span style={{ minWidth: 0 }}>
                      <span className="ad-item__name">{group.name}</span>
                      <span className="ad-item__meta">
                        {group.dial} {group.phone}
                        {lastVisit(group.rows) ? ` · dernier contact ${formatDate(lastVisit(group.rows).slice(0, 10))}` : ''}
                      </span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                      <span className="ad-kan__n">{group.rows.length}</span>
                      <ChevronRight
                        size={15}
                        style={{
                          color: 'var(--muted-foreground)',
                          transform: isOpen ? 'rotate(90deg)' : 'none',
                          transition: 'transform .2s ease',
                        }}
                      />
                    </span>
                  </button>

                  {isOpen ? (
                    <div style={{ padding: '.6rem 0 .9rem 2.7rem' }}>
                      <div className="ad-actions" style={{ marginTop: 0, marginBottom: '.7rem' }}>
                        <a
                          href={`tel:${group.phone.replace(/\D/g, '')}`}
                          className="admin-ghost-btn"
                        >
                          <Phone size={14} /> Appeler
                        </a>
                      </div>

                      <div className="ad-list">
                        {group.rows
                          .slice()
                          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                          .map((row) => {
                            const stage = lifecycleOf(row)
                            const date = row.confirmedDate ?? row.date
                            const time = row.confirmedTime ?? row.time

                            return (
                              <div className="ad-item" key={row.id}>
                                <span className="ad-item__time">{formatTime(time)}</span>
                                <span>
                                  <span className="ad-item__name">{row.service}</span>
                                  <span className="ad-item__meta">
                                    {formatDate(date)} · {row.laboLabel}
                                  </span>
                                </span>
                                <span
                                  className={`admin-pill ${
                                    stage === 'annulee'
                                      ? 'status-off'
                                      : stage === 'notifiee'
                                        ? 'status-done'
                                        : 'status-new'
                                  }`}
                                >
                                  {stage === 'recue'
                                    ? 'À traiter'
                                    : stage === 'notifiee'
                                      ? 'Confirmé'
                                      : 'Annulé'}
                                </span>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </AdminShell>
  )
}
