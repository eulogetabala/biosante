'use client'

import { useEffect, useRef } from 'react'
import type { Map as LeafletMap, Marker } from 'leaflet'

import { labos } from '@/lib/site'

/** Centre du cadrage initial : entre les deux laboratoires. */
const CENTER: [number, number] = [-4.261, 15.283]
const INITIAL_ZOOM = 13
/** Zoom appliqué au clic sur une fiche d'adresse. */
const FOCUS_ZOOM = 16

/** Repère en goutte, aux couleurs du site. */
function pinIcon(alt: boolean) {
  const tone = alt ? 'lab-pin lab-pin--alt' : 'lab-pin'
  return `
    <div class="${tone}">
      <div class="lab-pin__dot">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
          fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 6v12M6 12h12"/>
        </svg>
        <span class="lab-pin__halo"></span>
      </div>
    </div>
  `
}

function popupHtml(labo: (typeof labos)[number]) {
  const note =
    labo.geo.precision === 'approx'
      ? '<span style="display:block;margin-top:.4rem;font-size:.6875rem;letter-spacing:.06em;text-transform:uppercase;opacity:.65">Repère de quartier</span>'
      : ''
  return `
    <strong>${labo.name}</strong>
    ${labo.address}<br />${labo.landmark}
    ${note}
  `
}

export function LabMap() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markersRef = useRef<Record<string, Marker>>({})

  useEffect(() => {
    let cancelled = false

    // Leaflet a besoin de `window` : on l'importe uniquement côté navigateur.
    void import('leaflet').then((L) => {
      const el = containerRef.current
      if (cancelled || !el || mapRef.current) return

      const map = L.map(el, {
        center: CENTER,
        zoom: INITIAL_ZOOM,
        scrollWheelZoom: false,
        attributionControl: true,
      })
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      labos.forEach((labo, index) => {
        const marker = L.marker([labo.geo.lat, labo.geo.lng], {
          icon: L.divIcon({
            className: 'lab-pin-wrap',
            html: pinIcon(index === 1),
            iconSize: [42, 42],
            iconAnchor: [21, 40],
            popupAnchor: [0, -38],
          }),
          title: labo.name,
          alt: `${labo.name} — ${labo.address}`,
        })
          .bindPopup(popupHtml(labo), { closeButton: false, offset: [0, 4] })
          .addTo(map)

        markersRef.current[labo.id] = marker
      })

      // Les deux points ont toujours été visibles au premier rendu.
      map.fitBounds(
        labos.map((labo) => [labo.geo.lat, labo.geo.lng] as [number, number]),
        { padding: [56, 56] },
      )

      const onFocus = (event: Event) => {
        const id = (event as CustomEvent<string>).detail
        const labo = labos.find((item) => item.id === id)
        if (!labo) return
        map.flyTo([labo.geo.lat, labo.geo.lng], FOCUS_ZOOM, { duration: 0.8 })
        markersRef.current[id]?.openPopup()
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }

      window.addEventListener('labmap:focus', onFocus)
      cleanup = () => window.removeEventListener('labmap:focus', onFocus)
    })

    let cleanup: (() => void) | undefined

    return () => {
      cancelled = true
      cleanup?.()
      mapRef.current?.remove()
      mapRef.current = null
      markersRef.current = {}
    }
  }, [])

  return (
    <div className="map-frame h-[24rem] lg:h-[32rem]">
      <div
        ref={containerRef}
        className="leaflet-map"
        role="application"
        aria-label="Carte des deux laboratoires Bio Santé Diagnostic à Brazzaville"
      />
    </div>
  )
}

/** Recentre la carte sur une adresse (appelé par les fiches de la page contact). */
export function focusLabOnMap(id: string) {
  window.dispatchEvent(new CustomEvent<string>('labmap:focus', { detail: id }))
}
