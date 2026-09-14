'use client'

import { useCallback, useEffect, useState } from 'react'

import type { Appointment } from '@/lib/appointments'

/**
 * Source unique des demandes pour toutes les vues d'administration.
 *
 * Les vues sont des composants clients : sans cache partagé, le menu, la vue
 * d'ensemble et le board chargeraient chacun de leur côté et pourraient
 * afficher des compteurs différents au même instant. Ici, une seule requête
 * alimente tout le monde, et une confirmation met à jour l'ensemble d'un coup.
 *
 * Les pages serveur n'envoient aucune donnée initiale : ce serait un second
 * chemin de lecture à maintenir, et il faudrait le tenir cohérent avec
 * celui-ci. Le chargement se fait donc uniquement ici.
 */

export type AdminData = {
  appointments: Appointment[]
  email: string
}

type Store = {
  data: AdminData | null
  error: string | null
  loading: boolean
  listeners: Set<() => void>
}

const store: Store = { data: null, error: null, loading: false, listeners: new Set() }

function emit() {
  for (const listener of store.listeners) listener()
}

async function load(force = false) {
  if (store.loading) return
  if (store.data && !force) return

  store.loading = true
  store.error = null
  emit()

  try {
    const response = await fetch('/api/appointments', { cache: 'no-store' })
    if (response.status === 401) {
      // Session expirée : on renvoie vers la connexion plutôt que d'afficher
      // une erreur technique que l'administrateur ne pourrait pas résoudre.
      window.location.href = '/admin/login'
      return
    }

    const payload = (await response.json()) as Partial<AdminData> & { error?: string }
    if (!response.ok) throw new Error(payload.error ?? 'Lecture impossible.')

    store.data = {
      appointments: payload.appointments ?? [],
      email: payload.email ?? '',
    }
  } catch (error) {
    store.error = error instanceof Error ? error.message : 'Lecture impossible.'
  } finally {
    store.loading = false
    emit()
  }
}

/**
 * Renvoie les demandes et de quoi les modifier.
 *
 * `replace` remplace une demande dans le cache ; `reload` force une relecture
 * depuis le serveur. Les mutations passent par les routes API puis mettent à
 * jour le cache local — sans relecture complète, l'interface reste immédiate
 * même sur une connexion lente.
 */
export function useAppointments() {
  const [, force] = useState(0)

  useEffect(() => {
    const listener = () => force((value) => value + 1)
    store.listeners.add(listener)
    void load()
    return () => {
      store.listeners.delete(listener)
    }
  }, [])

  const replace = useCallback((updated: Appointment) => {
    if (!store.data) return
    store.data = {
      ...store.data,
      appointments: store.data.appointments.map((row) => (row.id === updated.id ? updated : row)),
    }
    emit()
  }, [])

  const reload = useCallback(() => load(true), [])

  return {
    appointments: store.data?.appointments ?? null,
    email: store.data?.email ?? '',
    error: store.error,
    // « Chargement » tant qu'aucune donnée n'est connue, et non `store.loading` :
    // cet indicateur ne passe à vrai qu'une fois l'effet exécuté, soit après le
    // premier rendu. Sans cette correction, la vue d'ensemble affiche brièvement
    // « Aucune demande pour l'instant » alors que la requête n'est pas partie.
    loading: store.data === null && store.error === null,
    replace,
    reload,
  }
}

/** Action sur une demande. */
export type AppointmentAction = 'confirm' | 'cancel' | 'reminded'

/** Réponse d'une action de traitement. */
export type ConfirmResult = {
  ok: boolean
  whatsapp?: string | null
  sms?: string | null
  message?: string
  number?: string
  valid?: boolean
  error?: string
  appointment?: Appointment
}

/** Confirme, annule, ou marque un rappel comme transmis. */
export async function actOnAppointment(
  id: string,
  action: AppointmentAction,
  slot?: { date: string; time: string },
): Promise<ConfirmResult> {
  try {
    const response = await fetch('/api/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, date: slot?.date, time: slot?.time }),
    })

    const payload = (await response.json().catch(() => null)) as ConfirmResult | null
    if (!response.ok || !payload?.ok) {
      return { ok: false, error: payload?.error ?? 'L’opération n’a pas abouti.' }
    }
    return payload
  } catch {
    return { ok: false, error: 'Le serveur n’a pas répondu. Réessayez.' }
  }
}

/** Regroupe les demandes par numéro de téléphone. */
export function groupByPhone(appointments: Appointment[]) {
  const groups = new Map<
    string,
    { key: string; name: string; phone: string; dial: string; rows: Appointment[] }
  >()

  for (const row of appointments) {
    const digits = row.phone.replace(/\D/g, '')
    if (!digits) continue

    const existing = groups.get(digits)
    if (existing) {
      existing.rows.push(row)
      continue
    }

    groups.set(digits, {
      key: digits,
      name: row.name,
      phone: row.phone,
      dial: row.dial,
      rows: [row],
    })
  }

  return [...groups.values()].sort((a, b) => b.rows.length - a.rows.length)
}
