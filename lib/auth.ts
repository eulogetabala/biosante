import 'server-only'

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

import { ADMINS, auth, db } from '@/lib/firebase-admin'

/**
 * Session de l'espace d'administration.
 *
 * Le cookie ne contient qu'un identifiant et une date d'expiration, le tout
 * signé par un secret détenu par le serveur. Aucun jeton d'accès Firebase n'y
 * transite : un cookie volé ne donne accès qu'à cette interface, il ne permet
 * pas d'appeler les API Google au nom du projet.
 */

export const SESSION_COOKIE = 'bsd_admin'

/** Durée d'une session. Assez courte pour une machine partagée au comptoir. */
const SESSION_HOURS = 8

export type AdminUser = {
  uid: string
  email: string
  name: string
}

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET
  if (!value || value.length < 32) {
    throw new Error(
      'Session : ADMIN_SESSION_SECRET est manquante ou trop courte (32 caractères minimum).',
    )
  }
  return value
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

/** Compare deux signatures sans laisser fuiter d'information par le temps de réponse. */
function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export function createToken(uid: string, hours = SESSION_HOURS): string {
  const expiresAt = Date.now() + hours * 3_600_000
  const payload = `${uid}.${expiresAt}`
  return `${payload}.${sign(payload)}`
}

export function readToken(token: string | undefined): string | null {
  if (!token) return null

  const parts = token.split('.')
  // L'identifiant Firebase ne contient pas de point : trois segments exactement.
  if (parts.length !== 3) return null

  const [uid, expiresAt, signature] = parts
  if (!uid || !expiresAt || !signature) return null

  if (!safeEqual(signature, sign(`${uid}.${expiresAt}`))) return null
  if (Number(expiresAt) < Date.now()) return null

  return uid
}

/** Ouvre une session : le cookie est posé par la route de connexion, jamais par le client. */
export async function startSession(uid: string): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, createToken(uid), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_HOURS * 3600,
  })
}

export async function endSession(): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 })
}

/**
 * Administrateur connecté, ou `null`.
 *
 * La signature seule ne suffit pas : l'utilisateur doit encore exister côté
 * Firebase. C'est ce double contrôle qui permet de révoquer un accès en
 * supprimant le compte, sans changer le secret du serveur.
 */
export async function currentAdmin(): Promise<AdminUser | null> {
  const store = await cookies()
  const uid = readToken(store.get(SESSION_COOKIE)?.value)
  if (!uid) return null

  try {
    const [record, account] = await Promise.all([
      db().collection(ADMINS).doc(uid).get(),
      auth().getUser(uid),
    ])

    if (!record.exists || record.get('active') === false) return null

    return {
      uid,
      email: account.email ?? (record.get('email') as string | undefined) ?? '',
      name: (record.get('name') as string | undefined) ?? account.displayName ?? 'Administrateur',
    }
  } catch (error) {
    // Panne d'infrastructure (Firestore injoignable, compte supprimé) : on
    // refuse l'accès. On journalise malgré tout — une erreur avalée en silence
    // fait passer une panne serveur pour un mauvais mot de passe, ce qui rend
    // le diagnostic très difficile.
    console.error('[auth] Vérification de session impossible :', error)
    return null
  }
}

/** Génère le secret de session affiché lors de l'installation. */
export function generateSecret(): string {
  return randomBytes(48).toString('base64url')
}
