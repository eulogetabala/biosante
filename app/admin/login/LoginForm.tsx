'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowRight, Loader2, LockKeyhole } from 'lucide-react'

/**
 * Formulaire de connexion.
 *
 * Les identifiants sont envoyés à `/api/session`, qui interroge Firebase
 * Authentication. Le navigateur ne dialogue jamais directement avec Google :
 * la clé du projet n'a pas à être exposée côté client pour cette opération.
 */
export function LoginForm() {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setSending(true)
    setError('')

    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: String(formData.get('email') ?? ''),
          password: String(formData.get('password') ?? ''),
        }),
      })

      const result = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        setError(result?.error ?? 'Connexion refusée.')
        setSending(false)
        return
      }

      // `refresh` recharge les composants serveur pour que la page /admin
      // reçoive le nouveau cookie de session.
      router.replace('/admin')
      router.refresh()
    } catch {
      setError('Le serveur n’a pas répondu. Vérifiez votre connexion.')
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-login-form">
      <label>
        Adresse email
        <input
          required
          type="email"
          name="email"
          autoComplete="username"
          placeholder="admin@grbiosante.com"
        />
      </label>

      <label>
        Mot de passe
        <input
          required
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </label>

      {error ? (
        <p className="admin-alert admin-alert--error" role="alert">
          <AlertCircle size={15} /> {error}
        </p>
      ) : null}

      <button type="submit" disabled={sending} className="admin-primary-btn">
        {sending ? (
          <>
            Vérification <Loader2 size={16} className="animate-spin" />
          </>
        ) : (
          <>
            <LockKeyhole size={15} /> Se connecter
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </form>
  )
}
