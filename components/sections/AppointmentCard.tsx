'use client'

import { useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, ShieldCheck, X } from 'lucide-react'

import {
  countries,
  defaultCountry,
  flagEmoji,
  labos,
  services,
  timeSlotGroups,
} from '@/lib/site'

/**
 * Endpoint de réception Netlify Forms.
 * Ce n'est pas une route Next : c'est le squelette statique `public/__forms.html`.
 * Netlify n'intercepte les envois que sur un fichier réellement statique — un POST
 * vers « / » serait capté par le rendu Next et la demande serait perdue.
 */
const NETLIFY_ENDPOINT = '/__forms.html'

type Status = 'idle' | 'sending' | 'success' | 'error'

type Resume = {
  labo: string
  date: string
  time: string
}

/**
 * Carte de prise de rendez-vous : visuel arrondi compact d'un côté,
 * formulaire de l'autre. Aucune adresse (elles vivent dans le footer).
 */
export function AppointmentCard() {
  const [status, setStatus] = useState<Status>('idle')
  const [site, setSite] = useState(labos[0].id)
  const [dial, setDial] = useState(defaultCountry.dial)
  const [open, setOpen] = useState(false)
  const [resume, setResume] = useState<Resume | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)

    // Résumé affiché dans la confirmation, capturé avant le reset du formulaire.
    const laboId = String(formData.get('labo') ?? '')
    setResume({
      labo: labos.find((labo) => labo.id === laboId)?.short ?? '—',
      date: String(formData.get('date') ?? ''),
      time: String(formData.get('time') ?? ''),
    })

    setStatus('sending')

    // Encodage explicite, champ par champ, plutôt qu'un envoi FormData brut :
    // le corps envoyé reste ainsi un formulaire classique, ce qu'attend Netlify.
    const body = new URLSearchParams()
    formData.forEach((value, key) => {
      if (typeof value === 'string') body.append(key, value)
    })

    try {
      const response = await fetch(NETLIFY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })
      if (!response.ok) throw new Error(`Envoi refusé (${response.status})`)

      form.reset()
      setSite(labos[0].id)
      setDial(defaultCountry.dial)
      setStatus('success')
      setOpen(true)
    } catch {
      setStatus('error')
      setOpen(true)
    }
  }

  return (
    <section id="rendez-vous" className="px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="soft-card grid overflow-hidden lg:grid-cols-[.85fr_1.15fr]">
          {/* Visuel arrondi, compact */}
          <div className="p-4 sm:p-6 lg:p-7">
            <div className="relative h-64 overflow-hidden rounded-[1.6rem] sm:h-80 lg:h-full lg:min-h-[34rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1631816290138-9f0f79cada3b?auto=format&fit=crop&w=1200&q=90"
                alt="Technicienne de laboratoire au travail"
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[color-mix(in_oklab,var(--deep)_88%,transparent)] via-[color-mix(in_oklab,var(--deep)_20%,transparent)] to-transparent" />
              <div className="absolute inset-0 rounded-[1.6rem] ring-1 ring-inset ring-white/20" />

              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[.2em] text-accent">
                  Prise de rendez-vous
                </p>
                <p className="mt-3 max-w-xs text-xl font-semibold leading-tight tracking-[-.04em] text-white sm:text-2xl">
                  Un créneau, un prélèvement, un résultat clair.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {['Réponse rapide', 'Confidentiel'].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-white backdrop-blur"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire */}
          <div className="px-6 pb-10 pt-2 sm:px-10 lg:py-14 lg:pl-4 lg:pr-14">
            <form onSubmit={handleSubmit} className="max-w-xl">
              {/* Identité du formulaire, exigée par Netlify */}
              <input type="hidden" name="form-name" value="rendez-vous" />
              {/* Piège à robots : invisible pour un humain */}
              <p className="hidden" aria-hidden="true">
                <label>
                  Ne pas remplir
                  <input name="bot-field" tabIndex={-1} autoComplete="off" />
                </label>
              </p>

              <p className="eyebrow">Réserver un créneau</p>
              <h2 className="mt-4 text-3xl font-semibold leading-[1.05] tracking-[-.05em] sm:text-4xl">
                Prenons soin de votre temps.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Remplissez le formulaire, nous vous rappelons pour confirmer.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <label>
                  Nom complet
                  <input required name="name" placeholder="Votre nom" />
                </label>

                <label>
                  Téléphone
                  <span className="phone-field">
                    <select
                      aria-label="Indicatif pays"
                      value={dial}
                      onChange={(e) => setDial(e.target.value)}
                    >
                      {countries.map((c, i) => (
                        <option key={`${c.iso}-${i}`} value={c.dial}>
                          {flagEmoji(c.iso)} {c.dial}
                        </option>
                      ))}
                    </select>
                    <input
                      required
                      name="phone"
                      inputMode="tel"
                      placeholder="06 000 00 00"
                      className="pl-1"
                    />
                  </span>
                </label>
              </div>

              <label className="mt-4">
                Adresse email
                <input
                  required
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="vous@exemple.com"
                />
              </label>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label>
                  Service souhaité
                  <select required name="service" defaultValue="">
                    <option value="" disabled>
                      Choisir un service
                    </option>
                    {services.map((service) => (
                      <option key={service.title} value={service.title}>
                        {service.title}
                      </option>
                    ))}
                    <option value="Prélèvement à domicile">Prélèvement à domicile</option>
                  </select>
                </label>
                <label>
                  Laboratoire
                  <select
                    required
                    name="labo"
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    className="select-highlight"
                  >
                    {labos.map((labo) => (
                      <option key={labo.id} value={labo.id}>
                        {labo.short}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label>
                  Date souhaitée
                  <input required type="date" name="date" />
                </label>
                <label>
                  Créneau souhaité
                  <select required name="time" defaultValue="">
                    <option value="" disabled>
                      Choisir un créneau
                    </option>
                    {timeSlotGroups.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.slots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot.replace(':', 'h')}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
              </div>

              <label className="mt-4">
                Message (facultatif)
                <textarea
                  name="message"
                  rows={6}
                  placeholder="Une précision à nous transmettre ?"
                  className="resize-y"
                />
              </label>

              <button
                disabled={status === 'sending'}
                className="mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-primary px-5 py-4 text-[11px] font-bold uppercase tracking-[.14em] text-primary-foreground transition-colors hover:bg-leaf disabled:cursor-not-allowed disabled:opacity-70"
              >
                {status === 'sending' ? (
                  <>
                    Envoi en cours
                    <Loader2 size={16} className="animate-spin" />
                  </>
                ) : (
                  <>
                    Envoyer ma demande
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
              <p className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-muted-foreground">
                <ShieldCheck size={14} className="text-accent" />
                Vos informations restent confidentielles
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Confirmation */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="modal-backdrop" />
          <Dialog.Popup className="modal-popup">
            <Dialog.Close className="modal-close" aria-label="Fermer">
              <X size={16} />
            </Dialog.Close>

            {status === 'success' ? (
              <div className="text-center">
                <span className="modal-icon modal-icon--success">
                  <CheckCircle2 size={30} />
                </span>
                <Dialog.Title className="modal-title">Demande bien reçue</Dialog.Title>
                <Dialog.Description className="modal-text">
                  Votre message est en cours de traitement. Vous serez notifié d’ici peu par notre
                  équipe, qui vous rappellera pour confirmer le créneau.
                </Dialog.Description>

                {resume ? (
                  <dl className="modal-summary">
                    <div>
                      <dt>Laboratoire</dt>
                      <dd>{resume.labo}</dd>
                    </div>
                    <div>
                      <dt>Date</dt>
                      <dd>{resume.date || '—'}</dd>
                    </div>
                    <div>
                      <dt>Créneau</dt>
                      <dd>{resume.time ? resume.time.replace(':', 'h') : '—'}</dd>
                    </div>
                  </dl>
                ) : null}
              </div>
            ) : (
              <div className="text-center">
                <span className="modal-icon modal-icon--error">
                  <AlertCircle size={30} />
                </span>
                <Dialog.Title className="modal-title">L’envoi n’a pas abouti</Dialog.Title>
                <Dialog.Description className="modal-text">
                  Un souci technique a interrompu l’envoi de votre demande. Réessayez dans un
                  instant, ou appelez directement le laboratoire — nous vous répondrons tout de
                  suite.
                </Dialog.Description>
              </div>
            )}

            <Dialog.Close className="modal-action">
              {status === 'success' ? 'Fermer' : 'Réessayer'}
            </Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  )
}
