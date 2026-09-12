'use client'

import { MapPinned } from 'lucide-react'

import { focusLabOnMap } from './LabMap'

/** Bouton de fiche adresse qui recentre la carte sur le laboratoire visé. */
export function FocusMapButton({ id, label = 'Voir sur la carte' }: { id: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => focusLabOnMap(id)}
      className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3.5 text-[11px] font-bold uppercase tracking-[.12em] text-primary transition-colors hover:border-leaf hover:text-leaf"
    >
      <MapPinned size={14} /> {label}
    </button>
  )
}
