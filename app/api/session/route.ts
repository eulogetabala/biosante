import { NextResponse } from 'next/server'

import { endSession, startSession } from '@/lib/auth'
import { ADMINS, auth, db } from '@/lib/firebase-admin'

/**
 * Ouverture et fermeture de session pour l'espace d'administration.
 *
 * L'identifiant et le mot de passe sont vérifiés par Firebase Authentication,
 * mais le mot de passe ne transite jamais jusqu'à Firestore : il ne quitte pas
 * les serveurs de Google. Seule la preuve d'identité (`uid`) est conservée,
 * le temps d'une session de huit heures.
 */

const MAX_ATTEMPTS = 6

/** Limitation basique : six essais par adresse IP et par quart d'heure. */
const WINDOW_MS = 15 * 60 * 1000
const attempts = new Map<string, number[]>()

function tooManyAttempts(ip: string): boolean {
  const now = Date.now()
  const recent = (attempts.get(ip) ?? []).filter((stamp) => now - stamp < WINDOW_MS)

  if (recent.length >= MAX_ATTEMPTS) {
    attempts.set(ip, recent)
    return true
  }

  recent.push(now)
  attempts.set(ip, recent)
  return false
}

function forgetAttempts(ip: string): void {
  attempts.delete(ip)
}

function clientIp(request: Request): string {
  return (
    request.headers.get('x-nf-client-connection-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'inconnue'
  )
}

export async function POST(request: Request) {
  const ip = clientIp(request)

  if (tooManyAttempts(ip)) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans quelques minutes.' },
      { status: 429 },
    )
  }

  // Deux clients pour cette route : le formulaire de connexion, qui envoie du
  // JSON, et le bouton de déconnexion du menu latéral, qui est un simple
  // formulaire HTML. Un POST de formulaire doit répondre par une redirection —
  // sinon le navigateur afficherait la réponse JSON brute.
  const contentType = request.headers.get('content-type') ?? ''
  const fromForm = contentType.includes('application/x-www-form-urlencoded')

  if (fromForm) {
    const data = await request.formData()
    if (data.get('action') === 'logout') {
      await endSession()
      // 303 : la suite doit être un GET, sans quoi le navigateur rejouerait le
      // POST de déconnexion sur la page d'arrivée.
      return NextResponse.redirect(new URL('/admin/login', request.url), 303)
    }
    return NextResponse.redirect(new URL('/admin/login', request.url), 303)
  }

  const payload = (await request.json().catch(() => null)) as
    | { email?: unknown; password?: unknown; action?: unknown }
    | null

  if (payload?.action === 'logout') {
    await endSession()
    return NextResponse.json({ ok: true })
  }

  const email = typeof payload?.email === 'string' ? payload.email.trim() : ''
  const password = typeof payload?.password === 'string' ? payload.password : ''

  if (!email || !password) {
    return NextResponse.json({ error: 'Identifiant et mot de passe requis.' }, { status: 400 })
  }

  // Message unique et volontairement vague : il ne doit pas indiquer si
  // l'adresse existe dans le projet.
  const rejected = NextResponse.json(
    { error: 'Identifiants incorrects.' },
    { status: 401 },
  )

  try {
    // Appel direct à l'API REST de Google : on ne charge pas le SDK client
    // dans le navigateur pour une simple vérification de mot de passe.
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      },
    )

    if (!response.ok) return rejected

    const session = (await response.json()) as { localId?: string }
    const uid = session.localId
    if (!uid) return rejected

    // Second verrou : un compte Firebase valide ne suffit pas, il doit
    // figurer dans la collection `admins`. Créer un utilisateur ne donne
    // donc pas accès au tableau de bord.
    const record = await db().collection(ADMINS).doc(uid).get()
    if (!record.exists || record.get('active') === false) return rejected

    // Contrôle que le compte existe toujours côté Firebase Auth.
    await auth().getUser(uid)

    forgetAttempts(ip)
    await startSession(uid)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[auth] Connexion impossible :', error)
    return NextResponse.json(
      { error: 'La connexion n’a pas pu être vérifiée. Réessayez dans un instant.' },
      { status: 503 },
    )
  }
}
