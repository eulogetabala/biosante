'use client'

import { useState } from 'react'
import { Clock, MapPin, Phone } from 'lucide-react'

import { labos } from '@/lib/site'

import { useAppointments } from '../fetch'
import { AdminShell, adminIcons, type AdminLink } from '../shell'

/**
 * Laboratoires, en lecture seule.
 *
 * Les coordonnées viennent de `lib/site.ts`, la même source que le site public.
 * En dur ici, elles dériveraient à la première modification du site — et le
 * numéro affiché au comptoir doit être celui que les patients appellent.
 *
 * Pas de carte : la vue Contact en porte déjà une, et la dupliquer ici
 * demanderait d'embarquer Leaflet dans l'administration pour un besoin qui ne
 * se pose pas au traitement d'une demande.
 */

export function LabsView({ admin }: { admin: { name: string; email: string } }) {
  const { appointments } = useAppointments()
  const [laboFilter, setLaboFilter] = useState('tous')

  const rows = appointments ?? []
  const scoped = laboFilter === 'tous' ? rows : rows.filter((row) => row.laboId === laboFilter)

  const links: AdminLink[] = [
    { href: '/admin', label: "Vue d'ensemble", icon: adminIcons.overview },
    {
      href: '/admin/demandes',
      label: 'Rendez-vous',
      icon: adminIcons.requests,
      count: rows.filter((row) => row.status === 'nouvelle').length,
      tone: 'alert',
    },
    { href: '/admin/calendrier', label: 'Calendrier', icon: adminIcons.calendar },
    { href: '/admin/patients', label: 'Patients', icon: adminIcons.patients },
  ]

  return (
    <AdminShell admin={admin} links={links}>
      <header className="ad__head">
        <div>
          <p className="ad__crumb">Configuration</p>
          <h1>Laboratoires</h1>
          <p>
            Les deux sites, tels qu’ils apparaissent sur le site public. Coordonnées partagées avec
            la page Contact : une seule source, donc pas de divergence possible.
          </p>
        </div>

        <select
          value={laboFilter}
          onChange={(event) => setLaboFilter(event.target.value)}
          className="admin-select"
          aria-label="Filtrer les demandes par laboratoire"
        >
          <option value="tous">Les deux sites</option>
          {labos.map((labo) => (
            <option key={labo.id} value={labo.id}>
              {labo.short}
            </option>
          ))}
        </select>
      </header>

      {laboFilter !== 'tous' ? (
        <p className="ad-panel__hint" style={{ marginBottom: '1rem' }}>
          Filtre actif : {scoped.length} demande{scoped.length > 1 ? 's' : ''} sur ce site.
        </p>
      ) : null}

      <div className="ad-labs">
        {labos.map((labo) => {
          const count = rows.filter((row) => row.laboId === labo.id).length
          return (
            <article className="ad-lab" key={labo.id}>
              <div className="ad-lab__img" style={{ backgroundImage: `url('${labo.image}')` }}>
                <span className="ad-lab__badge">
                  <i /> 24h/24
                </span>
                <span className="ad-lab__name">{labo.name}</span>
              </div>

              <div className="ad-lab__body">
                <dl className="ad-dl">
                  <div>
                    <dt>
                      <MapPin /> Adresse
                    </dt>
                    <dd>
                      {labo.address}
                      <span className="ad-item__meta" style={{ display: 'block', fontWeight: 400 }}>
                        {labo.landmark}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <Phone /> Téléphone
                    </dt>
                    <dd>
                      <a href={`tel:${labo.tel}`}>{labo.phone}</a>
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <Clock /> Horaires
                    </dt>
                    <dd>
                      {labo.hours}
                      <span className="ad-item__meta" style={{ display: 'block', fontWeight: 400 }}>
                        {labo.hoursNote}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>Demandes reçues</dt>
                    <dd>{count}</dd>
                  </div>
                </dl>

                <div className="ad-actions">
                  <a href={labo.maps} target="_blank" rel="noreferrer" className="admin-ghost-btn">
                    Ouvrir dans Maps
                  </a>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </AdminShell>
  )
}
