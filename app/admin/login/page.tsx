import { redirect } from 'next/navigation'

import { Logo } from '@/components/brand/Logo'
import { currentAdmin } from '@/lib/auth'
import { site } from '@/lib/site'

import { LoginForm } from './LoginForm'

export const dynamic = 'force-dynamic'

/** Écran de connexion. Une session déjà valide renvoie directement au tableau de bord. */
export default async function LoginPage() {
  if (await currentAdmin()) redirect('/admin')

  return (
    <main className="admin-login">
      <div className="admin-login-card">
        <span className="admin-login-logo">
          <Logo className="h-14" />
        </span>

        <p className="admin-eyebrow mt-8">Espace d’administration</p>
        <h1 className="admin-login-title">Accès réservé</h1>
        <p className="admin-login-text">
          Cet espace est réservé à l’équipe de {site.name}. Les identifiants sont ceux du compte
          administrateur du laboratoire.
        </p>

        <LoginForm />
      </div>

      <p className="admin-login-foot">
        {site.name} · {site.city}
      </p>
    </main>
  )
}
