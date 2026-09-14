'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Ban,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Inbox,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  X,
} from 'lucide-react'

import {
  countStages,
  effectiveSlot,
  formatDate,
  formatLead,
  formatStamp,
  formatTime,
  lifecycleOf,
  reminderDue,
  type Appointment,
  type Lifecycle,
} from '@/lib/appointments'
import { channels } from '@/lib/notify'
import { labos, timeSlotGroups } from '@/lib/site'

import { actOnAppointment, useAppointments } from '../fetch'
import { AdminShell, adminIcons, type AdminLink } from '../shell'

/**
 * Rendez-vous.
 *
 * Une liste dense plutôt qu'un tableau de colonnes. Quatre colonnes côte à
 * côte affichaient quatre grands rectangles dont trois vides dès que la base
 * était calme, et la largeur restante écrasait les cartes — les dates s'y
 * coupaient en deux lignes. Ici, chaque rendez-vous occupe une ligne, les
 * filtres d'état sont des onglets comptés, et l'écran reste lisible qu'il y ait
 * deux dossiers ou deux cents.
 *
 * Les gestes sont sur la ligne : confirmer le créneau demandé coûte un clic.
 * Le tiroir ne sert qu'à ce qui demande une décision — choisir une autre date,
 * relire et envoyer le message.
 */

type Tab = 'recue' | 'confirmee' | 'annulee' | 'toutes'

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: 'recue', label: 'À traiter', hint: 'Aucune demande à instruire.' },
  { id: 'confirmee', label: 'Confirmés', hint: 'Aucun rendez-vous confirmé.' },
  { id: 'annulee', label: 'Annulés', hint: 'Aucun rendez-vous annulé.' },
  { id: 'toutes', label: 'Tous', hint: 'Aucun rendez-vous.' },
]

/** « aujourd'hui », « hier », « il y a 3 j » — plus parlant qu'une date ISO. */
function relative(iso: string): string {
  if (!iso) return '—'
  const stamp = new Date(iso).getTime()
  if (Number.isNaN(stamp)) return '—'

  const hours = Math.floor((Date.now() - stamp) / 3_600_000)
  if (hours < 1) return "à l'instant"
  if (hours < 24) return `il y a ${hours} h`

  const days = Math.floor(hours / 24)
  if (days === 1) return 'hier'
  return `il y a ${days} j`
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

function avatarTone(stage: Lifecycle): string {
  if (stage === 'notifiee') return 'ad-ava ad-ava--done'
  if (stage === 'annulee') return 'ad-ava ad-ava--off'
  return 'ad-ava'
}

/** Étiquette d'état. */
function Chip({ stage }: { stage: Lifecycle }) {
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

function inTab(stage: Lifecycle, tab: Tab): boolean {
  if (tab === 'toutes') return true
  if (tab === 'recue') return stage === 'recue'
  if (tab === 'confirmee') return stage === 'notifiee'
  return stage === 'annulee'
}

type Due = { appointment: Appointment; minutes: number }

export function Board({ admin }: { admin: { name: string; email: string } }) {
  const { appointments, error, loading, replace } = useAppointments()
  const params = useSearchParams()

  // La recherche vit dans la barre supérieure ; on ne fait que la lire. Deux
  // états de recherche séparés finiraient par se contredire à l'écran.
  const query = params.get('q') ?? ''

  const [tab, setTab] = useState<Tab>('recue')
  const [laboFilter, setLaboFilter] = useState('tous')
  const [openId, setOpenId] = useState<string | null>(null)
  const [onlyDue, setOnlyDue] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'warn'; text: string; href?: string } | null>(
    null,
  )

  const rows = appointments ?? []
  const stages = countStages(rows)

  /**
   * Rappels dus, recalculés à la minute.
   *
   * `Date.now()` n'est pas réactif : sans ce battement, un rendez-vous entrerait
   * dans la fenêtre des deux heures sans que l'écran s'en aperçoive, alors que
   * c'est précisément le moment où il faut agir.
   */
  const [beat, setBeat] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setBeat((value) => value + 1), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const due: Due[] = useMemo(() => {
    return rows
      .map((appointment) => ({ appointment, minutes: reminderDue(appointment) }))
      .filter((entry): entry is Due => entry.minutes !== null)
      .sort((a, b) => a.minutes - b.minutes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, beat])

  const dueIds = new Set(due.map((entry) => entry.appointment.id))

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return rows
      .filter((row) => {
        if (laboFilter !== 'tous' && row.laboId !== laboFilter) return false
        if (onlyDue && !dueIds.has(row.id)) return false
        if (!needle) return true
        return [row.name, row.phone, row.email, row.service, row.laboLabel]
          .join(' ')
          .toLowerCase()
          .includes(needle)
      })
      .filter((row) => inTab(lifecycleOf(row), tab))
      // Les plus récents en haut : c'est ce qui vient d'arriver qu'on traite.
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query, laboFilter, onlyDue, tab, beat])

  const open = rows.find((row) => row.id === openId) ?? null

  const counts: Record<Tab, number> = {
    recue: stages.recue,
    confirmee: stages.notifiee,
    annulee: stages.annulee,
    toutes: rows.length,
  }

  const links: AdminLink[] = [
    { href: '/admin', label: "Vue d'ensemble", icon: adminIcons.overview },
    {
      href: '/admin/demandes',
      label: 'Rendez-vous',
      icon: adminIcons.requests,
      count: stages.recue,
      tone: 'alert',
    },
    { href: '/admin/calendrier', label: 'Calendrier', icon: adminIcons.calendar },
    { href: '/admin/patients', label: 'Patients', icon: adminIcons.patients },
  ]

  return (
    <AdminShell admin={admin} links={links}>
      <header className="ad__head">
        <div>
          <h1>Rendez-vous</h1>
          <p>
            Confirmez le créneau demandé, ajustez-le si besoin, ou annulez. Le message au patient est
            déjà rédigé ; les rappels des deux prochaines heures sont signalés en haut de liste.
          </p>
        </div>

        <div className="ad-filters__right">
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

          <button
            type="button"
            className={onlyDue ? 'admin-primary-btn' : 'admin-ghost-btn'}
            onClick={() => setOnlyDue((value) => !value)}
            aria-pressed={onlyDue}
          >
            <BellRing size={14} />
            Rappels{due.length > 0 ? ` (${due.length})` : ''}
          </button>
        </div>
      </header>

      {error ? (
        <p className="admin-alert admin-alert--error">
          <AlertTriangle size={15} />
          {error}
        </p>
      ) : null}

      {loading ? <p className="ad-panel__hint">Chargement…</p> : null}

      {!loading && rows.length === 0 && !error ? (
        <div className="admin-empty">
          <Inbox size={24} className="mx-auto text-brand" />
          <p className="mt-4 font-semibold">Aucun rendez-vous pour l’instant.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Les demandes envoyées depuis le site apparaîtront ici.
          </p>
        </div>
      ) : null}

      {!loading && rows.length > 0 ? (
        <>
          {/* Rappels dus : la seule chose qui justifie de remonter en haut. */}
          {due.length > 0 && !onlyDue ? (
            <div className="ad-remind">
              <div className="ad-remind__head">
                <BellRing />
                <b>
                  {due.length} rappel{due.length > 1 ? 's' : ''} à envoyer
                </b>
                <span className="ad-remind__tag">dans les 2 heures</span>
              </div>

              <div className="ad-remind__list">
                {due.slice(0, 4).map(({ appointment, minutes }) => {
                  const reminder = channels(appointment, 'reminder')
                  const phones = appointment.phone.replace(/\D/g, '')

                  return (
                    <div className="ad-remind__row" key={appointment.id}>
                      <span className="ad-remind__when">
                        {formatTime(effectiveSlot(appointment).time)} · {formatLead(minutes)}
                      </span>
                      <span className="ad-remind__who">
                        {appointment.name}
                        <span className="ad-remind__meta"> · {appointment.laboLabel}</span>
                      </span>

                      <span className="ad-remind__act">
                        {/* Numéro inexploitable par `wa.me` : plutôt qu'un bouton
                            mort, on propose l'appel — seul recours. */}
                        {reminder.whatsapp ? (
                          <a
                            className="ad-act__btn ad-act__btn--warn"
                            href={reminder.whatsapp}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <MessageCircle />
                            Rappeler
                          </a>
                        ) : (
                          <a className="ad-act__btn ad-act__btn--warn" href={`tel:${phones}`}>
                            <Phone />
                            Appeler
                          </a>
                        )}

                        <button
                          type="button"
                          className="ad-act__btn"
                          onClick={() => void markReminded(appointment)}
                        >
                          Fait
                        </button>
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}

          <div className="ad-panel ad-panel--flush">
            <div className="ad-tabs" role="tablist">
              {TABS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === entry.id}
                  className={tab === entry.id ? 'ad-tab ad-tab--on' : 'ad-tab'}
                  onClick={() => setTab(entry.id)}
                >
                  {entry.label}
                  <span className="ad-tab__n">{counts[entry.id]}</span>
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <p className="ad-panel__hint" style={{ padding: '1.6rem 1.25rem' }}>
                {query
                  ? `Aucun rendez-vous ne correspond à « ${query} ».`
                  : (TABS.find((entry) => entry.id === tab)?.hint ?? 'Rien à afficher.')}
              </p>
            ) : (
              <ul className="ad-rows">
                {visible.map((row) => (
                  <li key={row.id}>
                    <Row
                      appointment={row}
                      isOpen={openId === row.id}
                      isDue={dueIds.has(row.id)}
                      onOpen={() => setOpenId(row.id)}
                      onUpdate={replace}
                      onMessage={setMessage}
                      onCanceled={() => setOpenId(null)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}

      {open ? (
        <AdjustModal
          key={open.id}
          appointment={open}
          onClose={() => setOpenId(null)}
          onUpdate={replace}
          onMessage={setMessage}
        />
      ) : null}

      {message ? <Toast message={message} onClose={() => setMessage(null)} /> : null}
    </AdminShell>
  )

  /** Marque un rappel comme envoyé, depuis le bandeau. */
  async function markReminded(appointment: Appointment) {
    const result = await actOnAppointment(appointment.id, 'reminded')
    if (result.ok) {
      const now = new Date().toISOString()
      replace({
        ...appointment,
        remindedAt: now,
        notifiedAt: appointment.notifiedAt ?? now,
        status: 'confirmee',
      })
      setMessage({ tone: 'ok', text: `Rappel noté pour ${appointment.name}.` })
    } else {
      setMessage({ tone: 'warn', text: result.error ?? 'Le rappel n’a pas pu être noté.' })
    }
  }
}

/* ------------------------------------------------------------------ */
/* Ligne de rendez-vous                                               */
/* ------------------------------------------------------------------ */

/**
 * Un rendez-vous, sur une ligne.
 *
 * Les gestes apparaissent selon l'état : « Confirmer » pour ce qui attend un
 * créneau, « Envoyer » pour ce qui attend une transmission, « Rappeler » pour un
 * rendez-vous à venir. Le reste — détail, autre date, annulation — vit dans le
 * tiroir, atteignable en cliquant la ligne.
 */
function Row({
  appointment,
  isOpen,
  isDue,
  onOpen,
  onUpdate,
  onMessage,
  onCanceled,
}: {
  appointment: Appointment
  isOpen: boolean
  isDue: boolean
  onOpen: () => void
  onUpdate: (updated: Appointment) => void
  onMessage: (message: { tone: 'ok' | 'warn'; text: string; href?: string } | null) => void
  onCanceled: () => void
}) {
  const stage = lifecycleOf(appointment)
  const slot = effectiveSlot(appointment)
  const [busy, setBusy] = useState(false)
  const [cancelBusy, setCancelBusy] = useState(false)

  const reminder = channels(appointment, 'reminder')
  const phones = appointment.phone.replace(/\D/g, '')

  /**
   * Confirme le créneau demandé, et ouvre le message.
   *
   * La fenêtre est réservée pendant le geste : les navigateurs bloquent les
   * ouvertures différées, après un appel réseau.
   */
  async function confirmAsAsked() {
    setBusy(true)
    const tab = window.open('', '_blank')

    const result = await actOnAppointment(appointment.id, 'confirm', slot)

    if (!result.ok) {
      tab?.close()
      onMessage({ tone: 'warn', text: result.error ?? 'L’opération n’a pas abouti.' })
      setBusy(false)
      return
    }

    const now = new Date().toISOString()
    onUpdate({
      ...appointment,
      status: 'confirmee',
      confirmedDate: slot.date,
      confirmedTime: slot.time,
      notifiedAt: now,
      remindedAt: null,
    })

    if (result.valid && result.whatsapp) {
      if (tab) tab.location.href = result.whatsapp
      else window.open(result.whatsapp, '_blank')
      onMessage({
        tone: 'ok',
        text: `Rendez-vous confirmé avec ${appointment.name}. Le message est prêt dans WhatsApp.`,
        href: result.whatsapp,
      })
    } else {
      tab?.close()
      onMessage({
        tone: 'warn',
        text: 'Rendez-vous confirmé, mais le numéro est incomplet. Appelez le patient.',
      })
    }

    setBusy(false)
  }

  /**
   * Annule le rendez-vous.
   *
   * L'annulation est le seul geste sans retour en arrière : aucun bouton ne
   * rouvre un dossier clos, il faudrait repasser par le formulaire public. Le
   * libellé du bouton le dit déjà sans ambiguïté, et les listes gardent une
   * trace des annulés — on n'interrompt donc pas par une confirmation
   * supplémentaire.
   */
  async function cancel() {
    setCancelBusy(true)
    const result = await actOnAppointment(appointment.id, 'cancel')
    setCancelBusy(false)

    if (!result.ok) {
      onMessage({ tone: 'warn', text: result.error ?? 'L’annulation n’a pas abouti.' })
      return
    }

    onMessage({ tone: 'ok', text: `Rendez-vous de ${appointment.name} annulé.` })
    onCanceled()
  }

  return (
    <div className={isDue ? 'ad-row ad-row--due' : isOpen ? 'ad-row ad-row--open' : 'ad-row'}>
      <button type="button" className="ad-row__body" onClick={onOpen} aria-label={`Détail — ${appointment.name}`}>
        <span className={avatarTone(stage)}>{initialsOf(appointment.name)}</span>

        <span className="ad-row__who">
          <span className="ad-row__name">{appointment.name}</span>
          <span className="ad-row__meta">
            {appointment.service} · {appointment.laboLabel}
          </span>
        </span>

        <span className="ad-row__slot">
          <span className="ad-row__date">{formatDate(slot.date)}</span>
          <span className="ad-row__time">{formatTime(slot.time)}</span>
        </span>

        <span className="ad-row__state">
          <Chip stage={stage} />
          <span className="ad-row__stamp">
            {isDue ? (
              <>
                <Clock size={11} /> rappel dû
              </>
            ) : (
              relative(appointment.createdAt)
            )}
          </span>
        </span>
      </button>

      <div className="ad-row__acts">
        {stage === 'recue' ? (
          <>
            {/* Trois intentions, trois boutons. « Confirmer » va droit au but :
                il retient le créneau demandé et ouvre le message. « Ajuster »
                ouvre le modal de proposition d'un autre créneau. « Annuler »
                clôt le dossier. Aucune action ne fait quitter la ligne. */}
            <button
              type="button"
              className="ad-act__btn ad-act__btn--go"
              onClick={confirmAsAsked}
              disabled={busy}
              title="Retenir le créneau demandé et prévenir le patient"
            >
              {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              Confirmer
            </button>
            <button
              type="button"
              className="ad-act__btn"
              onClick={onOpen}
              disabled={busy}
              title="Proposer un autre créneau au patient"
            >
              <CalendarClock />
              Ajuster
            </button>
            <button
              type="button"
              className="ad-act__btn ad-act__btn--kill"
              onClick={cancel}
              disabled={busy}
              title="Annuler cette demande"
            >
              {cancelBusy ? <Loader2 className="animate-spin" /> : <Ban />}
              Annuler
            </button>
          </>
        ) : null}

        {stage === 'notifiee' ? (
          <>
            {reminder.whatsapp ? (
              <a className="ad-act__btn" href={reminder.whatsapp} target="_blank" rel="noreferrer">
                <BellRing />
                Rappeler
              </a>
            ) : (
              <a className="ad-act__btn" href={`tel:${phones}`}>
                <Phone />
                Appeler
              </a>
            )}
            <button type="button" className="ad-act__btn" onClick={onOpen}>
              <CalendarClock />
              Ajuster
            </button>
            <button
              type="button"
              className="ad-act__btn ad-act__btn--kill"
              onClick={cancel}
              disabled={cancelBusy}
              title="Annuler ce rendez-vous"
            >
              {cancelBusy ? <Loader2 className="animate-spin" /> : <Ban />}
              Annuler
            </button>
          </>
        ) : null}

        {stage === 'annulee' ? (
          <button type="button" className="ad-act__btn" onClick={onOpen}>
            Consulter
          </button>
        ) : null}
      </div>

      <button
        type="button"
        className="ad-row__chev"
        onClick={onOpen}
        aria-label="Ouvrir le détail"
      >
        <ChevronRight />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Modal d'ajustement du créneau                                      */
/* ------------------------------------------------------------------ */

/**
 * Ajuster : proposer un autre créneau au patient.
 *
 * Un modal centré, et non le tiroir latéral d'avant. Ajuster n'est pas une
 * fiche à consulter en regard de la liste — c'est une décision ponctuelle qu'on
 * prend, puis qu'on referme. Le tiroir, lui, occupait le bord de l'écran en
 * permanence et donnait l'impression d'un formulaire à remplir à chaque
 * rendez-vous, alors que la majorité se confirme sans y toucher.
 *
 * Une conséquence utile de ce recentrage : on peut de nouveau mettre en avant
 * le créneau demandé par le patient. Il devient une information — « Demandé le
 * lundi 21 septembre à 08h30 » — et non un champ pré-rempli qui suggérait qu'il
 * fallait le corriger.
 *
 * L'aperçu du message montre la date modifiée, et non celle enregistrée : on
 * relit donc exactement ce que le patient recevra.
 */
const QUICK_OFFSETS = [
  { days: 1, label: 'Demain' },
  { days: 2, label: 'Après-demain' },
  { days: 3, label: 'Dans 3 jours' },
  { days: 7, label: 'Dans une semaine' },
]

function offsetDate(days: number): string {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function AdjustModal({
  appointment,
  onClose,
  onUpdate,
  onMessage,
}: {
  appointment: Appointment
  onClose: () => void
  onUpdate: (updated: Appointment) => void
  onMessage: (message: { tone: 'ok' | 'warn'; text: string; href?: string } | null) => void
}) {
  const stage = lifecycleOf(appointment)
  const [date, setDate] = useState(appointment.confirmedDate ?? appointment.date)
  const [time, setTime] = useState(appointment.confirmedTime ?? appointment.time)
  const [busy, setBusy] = useState(false)

  const phones = appointment.phone.replace(/\D/g, '')
  const labo = labos.find((entry) => entry.id === appointment.laboId)

  // Le créneau affiché par défaut est celui demandé : on ne propose pas autre
  // chose avant que l'administrateur en ait exprimé le besoin.
  const sameAsAsked =
    date === appointment.date && time === appointment.time

  // Aperçu vivant : le texte se recompose à chaque changement de créneau, ce qui
  // permet de le relire avant de l'envoyer.
  const preview = channels(
    { ...appointment, confirmedDate: date, confirmedTime: time },
    'confirmation',
  )

  /** Ferme sur Échap : un modal sans issue clavier enferme. */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function confirm() {
    setBusy(true)
    const tab = window.open('', '_blank')

    const result = await actOnAppointment(appointment.id, 'confirm', { date, time })

    if (!result.ok) {
      tab?.close()
      onMessage({ tone: 'warn', text: result.error ?? 'L’opération n’a pas abouti.' })
      setBusy(false)
      return
    }

    const now = new Date().toISOString()
    onUpdate({
      ...appointment,
      status: 'confirmee',
      confirmedDate: date,
      confirmedTime: time,
      notifiedAt: now,
      remindedAt: null,
    })

    if (result.valid && result.whatsapp) {
      if (tab) tab.location.href = result.whatsapp
      else window.open(result.whatsapp, '_blank')
      onMessage({
        tone: 'ok',
        text: sameAsAsked
          ? `Rendez-vous confirmé avec ${appointment.name}.`
          : `Nouveau créneau proposé à ${appointment.name}.`,
        href: result.whatsapp,
      })
    } else {
      tab?.close()
      onMessage({
        tone: 'warn',
        text: 'Créneau retenu, mais le numéro est incomplet. Appelez le patient.',
      })
    }

    setBusy(false)
    onClose()
  }

  return (
    <div
      className="ad-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`Ajuster le créneau — ${appointment.name}`}
    >
      <button type="button" className="ad-modal__veil" onClick={onClose} aria-label="Fermer" />

      <div className="ad-modal__panel">
        <div className="ad-modal__head">
          <span className="ad-modal__ic">
            <CalendarClock />
          </span>
          <div style={{ minWidth: 0 }}>
            <p className="ad-modal__title">Proposer un autre créneau</p>
            <p className="ad-modal__sub">
              {appointment.name} · {appointment.service}
            </p>
          </div>
          <button type="button" className="ad-modal__close" onClick={onClose} aria-label="Fermer">
            <X />
          </button>
        </div>

        <div className="ad-modal__body">
          {/* Le créneau demandé, en lecture. C'est la référence. */}
          <dl className="ad-modal__asked">
            <div>
              <dt>Demandé par le patient</dt>
              <dd>
                {formatDate(appointment.date)} à {formatTime(appointment.time)}
              </dd>
            </div>
            <div>
              <dt>Laboratoire</dt>
              <dd>
                {appointment.laboLabel}
                {labo?.landmark ? <span className="ad-modal__note">{labo.landmark}</span> : null}
              </dd>
            </div>
          </dl>

          <p className="ad-modal__legend">Nouveau créneau</p>

          <div className="ad-quick-slots">
            {QUICK_OFFSETS.map((entry) => {
              const target = offsetDate(entry.days)
              return (
                <button
                  key={entry.days}
                  type="button"
                  className="ad-quick-slots__btn"
                  data-on={date === target}
                  onClick={() => setDate(target)}
                >
                  {entry.label}
                </button>
              )
            })}
          </div>

          <div className="ad-slots" style={{ marginTop: '.7rem' }}>
            <label>
              Date
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label>
              Heure
              <select value={time} onChange={(event) => setTime(event.target.value)}>
                {timeSlotGroups.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.slots.map((option) => (
                      <option key={option} value={option}>
                        {formatTime(option)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>

          <p className="ad-preview__label">
            <span>Message qui sera envoyé</span>
            <button
              type="button"
              className="ad-panel__link"
              onClick={() => {
                void navigator.clipboard.writeText(preview.message)
                onMessage({ tone: 'ok', text: 'Message copié dans le presse-papiers.' })
              }}
            >
              <Copy size={11} style={{ display: 'inline', verticalAlign: '-1px' }} /> Copier
            </button>
          </p>
          <p className="ad-preview">{preview.message}</p>

          {!preview.valid ? (
            <p className="admin-alert admin-alert--warn">
              <AlertTriangle size={15} />
              <span>
                Numéro incomplet : le message ne peut pas être pré-rempli. Appelez le patient au{' '}
                <a href={`tel:${phones}`} className="admin-inline-link">
                  {appointment.dial} {appointment.phone}
                </a>
                .
              </span>
            </p>
          ) : null}
        </div>

        <div className="ad-modal__foot">
          <button type="button" className="admin-ghost-btn" onClick={onClose} disabled={busy}>
            Fermer
          </button>

          <button type="button" className="admin-primary-btn" onClick={confirm} disabled={busy}>
            {busy ? (
              <>
                Enregistrement <Loader2 size={15} className="animate-spin" />
              </>
            ) : (
              <>
                <Send size={14} />
                {sameAsAsked ? 'Confirmer et prévenir' : 'Confirmer ce créneau'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
/* ------------------------------------------------------------------ */
/* Bandeau de retour                                                  */
/* ------------------------------------------------------------------ */

/** Retour d'action, fugace et non bloquant. */
function Toast({
  message,
  onClose,
}: {
  message: { tone: 'ok' | 'warn'; text: string; href?: string }
  onClose: () => void
}) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 9_000)
    return () => window.clearTimeout(timer)
  }, [message.text, onClose])

  return (
    <div
      className={message.tone === 'ok' ? 'ad-toast ad-toast--ok' : 'ad-toast ad-toast--warn'}
      role="status"
    >
      {message.tone === 'ok' ? <CheckCircle2 /> : <AlertTriangle />}
      <span>{message.text}</span>
      {message.href ? (
        <a href={message.href} target="_blank" rel="noreferrer">
          Ouvrir <ExternalLink size={11} style={{ display: 'inline', verticalAlign: '-1px' }} />
        </a>
      ) : null}
    </div>
  )
}
