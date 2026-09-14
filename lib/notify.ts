/**
 * Notification du patient.
 *
 * Ni WhatsApp ni SMS ne sont envoyés par le serveur : les deux passent par
 * l'application de messagerie de l'administration, avec un texte déjà rédigé.
 *
 * La raison est la même pour les deux canaux. L'API WhatsApp de Meta impose un
 * numéro dédié — qui ne peut alors plus servir dans l'application WhatsApp —,
 * la validation d'un modèle de message et un paiement à la message. Et l'envoi
 * de SMS par API suppose un compte chez un opérateur, avec un coût unitaire et
 * un nom d'expéditeur à faire valider.
 *
 * Un lien « cliquer pour envoyer » n'a aucun de ces inconvénients : rien à
 * souscrire, le message part de la conversation que le patient connaît déjà, et
 * l'administration garde la main sur ce qui est envoyé — ce qui n'est pas
 * accessoire quand il s'agit de données de santé.
 *
 * Le jour où un envoi réellement automatique sera nécessaire — pour les rappels
 * notamment —, c'est ce module qu'il faudra doubler d'un client HTTP, sans
 * toucher au reste : les routes et l'interface consomment `channels()`.
 */

import { formatDate, formatTime, todayKey, type Appointment } from '@/lib/appointments'
import { labos } from '@/lib/site'

/** Longueur maximale d'un champ recopié dans le message. */
const MAX_FIELD = 60

/**
 * Neutralise ce qui pourrait déformer le message pré-rempli.
 *
 * Les retours à la ligne et les tabulations sont aplatis : sans cela, un nom ou
 * un message saisi par un patient pourrait injecter du texte sur plusieurs
 * lignes dans la fenêtre de messagerie de l'administration. La profondeur est
 * également bornée.
 */
export function sanitizeField(value: string, max = MAX_FIELD): string {
  return value
    .replace(/[\r\n\t\u2028\u2029]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, max)
}

/** Chiffres uniquement, sans indicatif d'appel. */
export function digits(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Numéro au format international, sans le `+`.
 *
 * C'est la forme attendue par `wa.me`, qui refuse le `+`.
 */
export function whatsappNumber(phone: string, dial: string): string {
  const local = digits(phone)
  const prefix = digits(dial)

  if (!local) return ''
  if (!prefix) return local

  return local.startsWith(prefix) ? local : `${prefix}${local}`
}

/**
 * Numéro au format E.164, avec le `+`.
 *
 * C'est la forme attendue par le schéma `sms:`. On ne peut donc pas réutiliser
 * `whatsappNumber`, qui le retire.
 */
export function e164Number(phone: string, dial: string): string {
  const number = whatsappNumber(phone, dial)
  return number ? `+${number}` : ''
}

/**
 * Le numéro est-il exploitable par `wa.me` ?
 *
 * Deux conditions, et non une simple longueur : un numéro doit porter un
 * indicatif pays. Or aucun indicatif ne commence par `0` — un numéro local
 * congolais (`067657878`) en a besoin. Sans ce contrôle, le lien serait
 * silencieusement inouvrable.
 */
export function isValidWhatsappNumber(number: string): boolean {
  return number.length >= 10 && !number.startsWith('0')
}

/** « aujourd'hui » ou « demain », selon le jour réel du rendez-vous. */
function relativeDay(date: string): string {
  if (date === todayKey()) return "aujourd'hui"

  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  if (date === tomorrow.toISOString().slice(0, 10)) return 'demain'

  return `le ${formatDate(date)}`
}

/** Ce qu'on peut envoyer au patient. */
export type NotificationKind = 'confirmation' | 'reminder'

/** Texte de la confirmation initiale. */
function confirmationText(appointment: Appointment): string {
  const labo = labos.find((entry) => entry.id === appointment.laboId)
  const date = appointment.confirmedDate ?? appointment.date
  const time = appointment.confirmedTime ?? appointment.time

  const lines = [
    `Bonjour ${sanitizeField(appointment.name)},`,
    '',
    'Votre rendez-vous est confirmé :',
    `• Date : ${formatDate(date)}`,
    `• Heure : ${formatTime(time)}`,
    `• Service : ${sanitizeField(appointment.service)}`,
  ]

  if (labo) {
    lines.push('', labo.name, labo.address, labo.landmark)
  }

  lines.push(
    '',
    'Merci de vous munir de votre ordonnance. Nous vous accueillons 24h/24, y compris les dimanches et jours fériés.',
  )

  return lines.join('\n')
}

/**
 * Texte du rappel, envoyé peu avant le rendez-vous.
 *
 * Volontairement plus court que la confirmation : il rappelle quand et où, sans
 * répéter les consignes. Un rappel qu'on ne lit pas en trois secondes ne sert à
 * rien.
 */
function reminderText(appointment: Appointment): string {
  const labo = labos.find((entry) => entry.id === appointment.laboId)
  const slot = {
    date: appointment.confirmedDate ?? appointment.date,
    time: appointment.confirmedTime ?? appointment.time,
  }

  const lines = [
    `Bonjour ${sanitizeField(appointment.name)},`,
    '',
    `Petit rappel : votre rendez-vous est prévu ${relativeDay(slot.date)} à ${formatTime(slot.time)}.`,
    `• Service : ${sanitizeField(appointment.service)}`,
  ]

  if (labo) {
    lines.push(`• Lieu : ${labo.name} — ${labo.address}`)
  }

  lines.push('', 'Merci de vous munir de votre ordonnance. À très bientôt.')

  return lines.join('\n')
}

/** Corps du message, selon ce qu'on envoie. */
export function messageFor(appointment: Appointment, kind: NotificationKind): string {
  return kind === 'reminder' ? reminderText(appointment) : confirmationText(appointment)
}

/** Lien `wa.me`, ou `null` si le numéro est inexploitable. */
export function whatsappLink(appointment: Appointment, kind: NotificationKind = 'confirmation'): string | null {
  const number = whatsappNumber(appointment.phone, appointment.dial)
  if (!isValidWhatsappNumber(number)) return null

  return `https://wa.me/${number}?text=${encodeURIComponent(messageFor(appointment, kind))}`
}

/**
 * Lien `sms:`, ou `null` si le numéro est inexploitable.
 *
 * Le premier séparateur est `?`, et non `&`. Les deux formes circulent — iOS
 * comprenait historiquement `sms:numéro&body=`, Android `sms:numéro?body=` —,
 * mais `?` est désormais reconnu par les deux. Le corps est encodé : sans cela,
 * un `&` dans le message couperait le texte, et un `#` le tronquerait.
 *
 * À savoir : sur un poste de bureau sans application liée, le lien peut ne rien
 * ouvrir. C'est sans conséquence — le bouton WhatsApp reste à côté.
 */
export function smsLink(appointment: Appointment, kind: NotificationKind = 'confirmation'): string | null {
  const number = e164Number(appointment.phone, appointment.dial)
  if (!number || number.length < 11) return null

  return `sms:${number}?body=${encodeURIComponent(messageFor(appointment, kind))}`
}

/** Les deux canaux disponibles pour une demande, et le message correspondant. */
export function channels(appointment: Appointment, kind: NotificationKind = 'confirmation') {
  const number = whatsappNumber(appointment.phone, appointment.dial)

  return {
    whatsapp: whatsappLink(appointment, kind),
    sms: smsLink(appointment, kind),
    number,
    valid: isValidWhatsappNumber(number),
    message: messageFor(appointment, kind),
  }
}
