/**
 * Modèle d'une demande de rendez-vous.
 *
 * Un document Firestore par demande. Les dates restent des chaînes simples
 * (« AAAA-MM-JJ » et « HH:MM ») plutôt que des `Timestamp` : le formulaire
 * travaille déjà dans ce format, et la relecture côté administration évite
 * ainsi toute conversion de fuseau horaire. Le laboratoire comme le patient
 * sont à Brazzaville (UTC+1, sans heure d'été).
 */

export const APPOINTMENT_STATUSES = ['nouvelle', 'confirmee', 'annulee'] as const

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number]

/**
 * Indicatif d'appel par défaut, utilisé quand une demande ne le précise pas.
 * Brazzaville étant le seul lieu d'exercice, le Congo est le bon repli.
 */
export const DEFAULT_DIAL = '+242'

export type Appointment = {
  id: string
  name: string
  phone: string
  email: string
  service: string
  laboId: string
  laboLabel: string
  /** Créneau demandé par le patient. */
  date: string
  time: string
  message: string
  status: AppointmentStatus
  /** Horodatage ISO du dépôt de la demande. */
  createdAt: string
  /** Créneau retenu par l'administration à la confirmation. */
  confirmedDate: string | null
  confirmedTime: string | null
  /** Horodatage ISO de la confirmation (déclenche l'ouverture de WhatsApp). */
  notifiedAt: string | null
  /**
   * Indicatif d'appel choisi dans le formulaire, conservé séparément.
   *
   * Indispensable à la confirmation : `phone` ne contient que le numéro local
   * (par exemple `067657878`), sans lequel `wa.me` ne peut pas router le
   * message. Absent des demandes déposées avant l'ajout de ce champ.
   */
  dial: string
  /** Horodatage ISO de l'envoi du rappel, une fois le patient joint. */
  remindedAt?: string | null
}
/** Ce que le formulaire public transmet, une fois validé. */
export type NewAppointment = Pick<
  Appointment,
  'name' | 'phone' | 'email' | 'service' | 'laboId' | 'laboLabel' | 'date' | 'time' | 'message'
>

export const STATUS_META: Record<AppointmentStatus, { label: string; tone: string }> = {
  nouvelle: { label: 'Nouvelle', tone: 'status-new' },
  confirmee: { label: 'Confirmée', tone: 'status-done' },
  annulee: { label: 'Annulée', tone: 'status-off' },
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asStatus(value: unknown): AppointmentStatus {
  return APPOINTMENT_STATUSES.includes(value as AppointmentStatus)
    ? (value as AppointmentStatus)
    : 'nouvelle'
}

/**
 * Convertit un document Firestore brut en objet complet.
 * Tolérant aux champs manquants : un document ancien ne doit jamais faire
 * échouer l'affichage du tableau de bord.
 */
export function parseAppointment(id: string, data: Record<string, unknown>): Appointment {
  const created = data.createdAt

  return {
    id,
    name: asString(data.name, 'Sans nom'),
    phone: asString(data.phone),
    email: asString(data.email),
    service: asString(data.service),
    laboId: asString(data.laboId),
    laboLabel: asString(data.laboLabel, asString(data.laboId)),
    date: asString(data.date),
    time: asString(data.time),
    message: asString(data.message),
    status: asStatus(data.status),
    // Un `Timestamp` Firestore sérialisé arrive ici sous forme de chaîne ISO.
    createdAt: typeof created === 'string' ? created : asString(data.createdAtIso),
    confirmedDate: data.confirmedDate ? asString(data.confirmedDate) : null,
    confirmedTime: data.confirmedTime ? asString(data.confirmedTime) : null,
    notifiedAt: data.notifiedAt ? asString(data.notifiedAt) : null,
    remindedAt: data.remindedAt ? asString(data.remindedAt) : null,
    // Les demandes antérieures à l'ajout du champ retombent sur l'indicatif du
    // Congo : c'est de très loin le cas le plus fréquent, et une valeur erronée
    // reste corrigeable dans WhatsApp avant l'envoi.
    dial: asString(data.dial) || DEFAULT_DIAL,
  }
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  // La chaîne « AAAA-MM-JJ » est interprétée en UTC : sans ce réglage, un
  // fuseau négatif afficherait la veille.
  timeZone: 'UTC',
})

/** « 2026-09-14 » → « lundi 14 septembre 2026 ». */
export function formatDate(value: string): string {
  if (!value) return '—'
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(parsed.getTime()) ? value : dateFormatter.format(parsed)
}

const stampFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Africa/Brazzaville',
})

/** Horodatage ISO → « 13/09/2026 à 11:42 » (heure de Brazzaville). */
export function formatStamp(iso: string): string {
  if (!iso) return '—'
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return iso
  return stampFormatter.format(parsed).replace(' ', ' à ')
}

/** « 14:30 » → « 14h30 ». */
export function formatTime(value: string): string {
  return value ? value.replace(':', 'h') : '—'
}

/* ------------------------------------------------------------------ */
/* Cycle de vie d'une demande                                         */
/* ------------------------------------------------------------------ */

/**
 * Étape réelle d'une demande.
 *
 * Trois étapes, et non quatre. Une étape intermédiaire « créneau retenu mais
 * patient pas encore prévenu » a existé : elle était censée protéger du risque
 * qu'un patient se présente sans connaître son heure. Elle coûtait bien plus
 * qu'elle ne protégeait.
 *
 * D'abord elle mentait sur ce qui venait de se passer : le geste « Confirmer »
 * ouvre la conversation WhatsApp dans la foulée, donc l'écran affirmait « pas
 * encore prévenu » au moment précis où l'on prévenait. Ensuite elle faisait
 * quitter la ligne de sa propre vue sous les yeux de l'administrateur, qui
 * devait la poursuivre dans un autre onglet pour finir ce qu'il avait commencé.
 * Trois clics et deux onglets pour une décision, c'est ce qui rendait le
 * parcours illisible.
 *
 * Confirmer engage donc le rendez-vous : la ligne reste où elle est, et
 * l'effacement est définitif — il n'existe pas de geste pour défaire une
 * confirmation, seulement « Annuler » ou « Ajuster ».
 */
export type Lifecycle = 'recue' | 'notifiee' | 'annulee'

export function lifecycleOf(appointment: Appointment): Lifecycle {
  if (appointment.status === 'annulee') return 'annulee'
  if (appointment.status === 'confirmee') return 'notifiee'
  return 'recue'
}

/**
 * Créneau effectif : celui retenu par l'administration s'il existe, sinon
 * celui demandé par le patient.
 */
export function effectiveSlot(appointment: Appointment): { date: string; time: string } {
  return {
    date: appointment.confirmedDate ?? appointment.date,
    time: appointment.confirmedTime ?? appointment.time,
  }
}

/** Date du jour, au format des créneaux. */
export function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Le rendez-vous approche-t-il ?
 *
 * Renvoie les minutes restantes si le créneau tombe dans les deux heures à
 * venir, `0` s'il est déjà passé, et `null` si le rappel ne s'applique pas : il
 * n'existe que pour un rendez-vous confirmé et déjà transmis au patient.
 *
 * Relire `remindedAt` pour savoir s'il faut rappeler serait une erreur : le
 * rappel peut ne jamais partir — le patient est injoignable, la journée
 * s'achève —, et une demande non rappelée resterait alors invisible.
 *
 * L'heure du laboratoire est celle de Brazzaville (UTC+1, sans heure d'été).
 * On construit le créneau comme un instant UTC pour que le calcul soit
 * identique partout : sur le serveur, dans le navigateur, à Paris comme à
 * Brazzaville. La console affiche donc la même fenêtre de rappel pour tous.
 */
export function reminderDue(appointment: Appointment): number | null {
  const stage = lifecycleOf(appointment)
  if (stage !== 'notifiee') return null

  const slot = effectiveSlot(appointment)
  if (!slot.date || !slot.time) return null

  const target = Date.parse(`${slot.date}T${slot.time}:00Z`)
  if (Number.isNaN(target)) return null

  const remaining = target - Date.now()
  if (remaining <= 0) return 0
  if (remaining > 2 * 3_600_000) return null

  return Math.round(remaining / 60_000)
}

/** « dans 1 h 20 » — formulation du délai avant un rendez-vous. */
export function formatLead(minutes: number): string {
  if (minutes <= 0) return 'créneau passé'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `dans ${rest} min`
  if (rest === 0) return `dans ${hours} h`
  return `dans ${hours} h ${String(rest).padStart(2, '0')}`
}

/** Compteurs par étape, pour les onglets et le menu. */
export function countStages(appointments: Appointment[]): Record<Lifecycle, number> {
  const counts: Record<Lifecycle, number> = { recue: 0, notifiee: 0, annulee: 0 }
  for (const row of appointments) counts[lifecycleOf(row)] += 1
  return counts
}

/** « 2026-09-14 » → « 14 sept. » pour les axes de graphique. */
const shortDateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

export function formatDayShort(value: string): string {
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(parsed.getTime()) ? value : shortDateFormatter.format(parsed)
}

/** « 2026-09 » → « septembre 2026 ». */
const monthFormatter = new Intl.DateTimeFormat('fr-FR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatMonth(key: string): string {
  const parsed = new Date(`${key}-01T00:00:00Z`)
  return Number.isNaN(parsed.getTime()) ? key : monthFormatter.format(parsed)
}

/** « 2026-09-14 » → « lun. 14 ». Utilisé dans les regroupements par jour. */
const weekdayShortFormatter = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

export function formatDayWithWeekday(value: string): string {
  const parsed = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(parsed.getTime()) ? value : weekdayShortFormatter.format(parsed)
}

/* ------------------------------------------------------------------ */
/* Agrégats pour le tableau de bord                                   */
/* ------------------------------------------------------------------ */

export type DayPoint = { date: string; recues: number; confirmees: number }

export type Overview = {
  /** Demandes reçues, pas encore instruites. */
  recues: number
  /** Rendez-vous confirmés, tenus par le laboratoire. */
  confirmes: number
  /** Rendez-vous confirmés du jour, triés par heure. */
  aujourdhui: Appointment[]
  /** Demandes reçues depuis l'ouverture du mois. */
  ceMois: number
  /** Demandes reçues le mois précédent, pour la tendance. */
  moisPrecedent: number
  /** Prochains rendez-vous confirmés, à partir d'aujourd'hui, par ordre d'arrivée. */
  prochains: Appointment[]
  /** Nombre de patients distincts, identifiés par leur numéro de téléphone. */
  patients: number
  /** Série journalière sur `days` jours, du plus ancien au plus récent. */
  serie: DayPoint[]
  parService: { label: string; count: number }[]
  parLabo: { id: string; label: string; count: number }[]
}

/** « 2026-09 » reculé d'un mois, en gérant le passage d'année. */
function previousMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  if (!year || !month) return monthKey
  return month === 1
    ? `${year - 1}-12`
    : `${year}-${String(month - 1).padStart(2, '0')}`
}

/**
 * Calcule en une passe tout ce qu'affiche la vue d'ensemble.
 *
 * Rassemblé ici plutôt que dans le composant : ce sont des règles de comptage,
 * et une erreur de bornage (un jour manquant, un doublon) fausserait
 * silencieusement les chiffres affichés.
 *
 * `stampOf` détermine à quelle date une demande est rattachée dans la série :
 * la date de dépôt pour une demande reçue, la date du rendez-vous pour une
 * confirmation. Les deux courbes répondent donc à deux questions différentes.
 */
export function summarize(appointments: Appointment[], days = 14): Overview {
  const today = todayKey()
  const monthPrefix = today.slice(0, 7)
  const lastMonthPrefix = previousMonth(monthPrefix)

  const recues = appointments.filter((row) => lifecycleOf(row) === 'recue').length
  const confirmes = appointments.filter((row) => lifecycleOf(row) === 'notifiee').length

  /** Rendez-vous ayant une date ferme. */
  const scheduled = appointments.filter((row) => lifecycleOf(row) === 'notifiee')

  const aujourdhui = scheduled
    .filter((row) => effectiveSlot(row).date === today)
    .sort((a, b) => effectiveSlot(a).time.localeCompare(effectiveSlot(b).time))

  // À venir : aujourd'hui et après, du plus proche au plus lointain. Une date
  // passée mais non encore notifiée reste visible dans le board, pas ici : ce
  // bloc sert à anticiper, pas à rattraper.
  const prochains = scheduled
    .filter((row) => effectiveSlot(row).date >= today)
    .sort((a, b) => {
      const slotA = effectiveSlot(a)
      const slotB = effectiveSlot(b)
      return `${slotA.date} ${slotA.time}`.localeCompare(`${slotB.date} ${slotB.time}`)
    })
    .slice(0, 8)

  const phoneKeys = new Set(
    appointments.map((row) => row.phone.replace(/\D/g, '')).filter(Boolean),
  )

  // Série journalière : on initialise chaque jour à zéro, sinon une journée
  // sans activité disparaîtrait du graphique et la courbe mentirait.
  const series: DayPoint[] = []
  const index = new Map<string, DayPoint>()
  const now = new Date()

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(now.getTime() - offset * 86_400_000).toISOString().slice(0, 10)
    const point: DayPoint = { date: day, recues: 0, confirmees: 0 }
    series.push(point)
    index.set(day, point)
  }

  for (const row of appointments) {
    const received = row.createdAt ? row.createdAt.slice(0, 10) : ''
    const point = index.get(received)
    if (point) point.recues += 1

    if (row.status !== 'nouvelle') {
      const slot = effectiveSlot(row).date
      const confirmedPoint = index.get(slot)
      if (confirmedPoint) confirmedPoint.confirmees += 1
    }
  }

  const serviceCounts = new Map<string, number>()
  for (const row of appointments) {
    if (!row.service) continue
    serviceCounts.set(row.service, (serviceCounts.get(row.service) ?? 0) + 1)
  }

  const laboCounts = new Map<string, number>()
  for (const row of appointments) {
    laboCounts.set(row.laboId, (laboCounts.get(row.laboId) ?? 0) + 1)
  }

  return {
    recues,
    confirmes,
    aujourdhui,
    ceMois: appointments.filter((row) => row.date.startsWith(monthPrefix)).length,
    moisPrecedent: appointments.filter((row) => row.date.startsWith(lastMonthPrefix)).length,
    prochains,
    patients: phoneKeys.size,
    serie: series,
    parService: [...serviceCounts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    parLabo: [...laboCounts.entries()].map(([id, count]) => ({
      id,
      label: appointments.find((row) => row.laboId === id)?.laboLabel ?? id,
      count,
    })),
  }
}

/* ------------------------------------------------------------------ */
/* Validation des demandes entrantes                                  */
/* ------------------------------------------------------------------ */

/** Longueurs maximales, pour qu'un envoi malveillant ne gonfle pas la base. */
const LIMITS = { name: 120, phone: 40, email: 160, message: 2000, text: 160 } as const

export type BookingInput = Record<string, unknown>

export type BookingResult =
  | { ok: true; data: NewAppointment }
  | { ok: false; errors: string[] }

function text(input: BookingInput, key: string, max: number): string {
  const value = input[key]
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

/**
 * Contrôle d'une demande de rendez-vous.
 *
 * Tout est revérifié ici, sans faire confiance au navigateur : les menus
 * déroulants d'un formulaire se contournent en une ligne de console. Le
 * laboratoire est retrouvé côté serveur à partir de son identifiant, pour
 * qu'un libellé falsifié ne puisse pas se retrouver dans l'email d'alerte.
 */
export function validateBooking(input: BookingInput, options: {
  labos: { id: string; name: string }[]
  slots: string[]
}): BookingResult {
  const errors: string[] = []

  const name = text(input, 'name', LIMITS.name)
  const phone = text(input, 'phone', LIMITS.phone)
  const email = text(input, 'email', LIMITS.email)
  const service = text(input, 'service', LIMITS.text)
  const laboId = text(input, 'laboId', LIMITS.text)
  const date = text(input, 'date', 10)
  const time = text(input, 'time', 5)
  const message = text(input, 'message', LIMITS.message)

  if (name.length < 2) errors.push('Le nom est trop court.')

  // Au moins six chiffres : assez permissif pour les formats locaux,
  // assez strict pour écarter les saisies vides ou fantaisistes.
  if ((phone.match(/\d/g) ?? []).length < 6) errors.push('Le numéro de téléphone est invalide.')

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.push('L’adresse email est invalide.')

  if (!service) errors.push('Le service souhaité est manquant.')

  const labo = options.labos.find((entry) => entry.id === laboId)
  if (!labo) errors.push('Le laboratoire choisi est inconnu.')

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push('La date est invalide.')
  } else {
    const parsed = new Date(`${date}T00:00:00Z`)
    const today = new Date()
    const floor = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    if (Number.isNaN(parsed.getTime())) errors.push('La date est invalide.')
    else if (parsed.getTime() < floor) errors.push('La date choisie est déjà passée.')
  }

  if (!options.slots.includes(time)) errors.push('Le créneau choisi est invalide.')

  if (errors.length > 0) return { ok: false, errors }

  return {
    ok: true,
    data: {
      name,
      phone,
      email,
      service,
      laboId,
      // Le libellé est repris de la source, jamais du formulaire.
      laboLabel: labo?.name ?? laboId,
      date,
      time,
      message,
    },
  }
}
