import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import OnboardingWizard from './OnboardingWizard'

function AuthView() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  if (mode === 'signup') {
    return <OnboardingWizard onBackToLogin={() => setMode('login')} />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
    }

    setIsSubmitting(false)
  }

  const handlePasswordReset = async () => {
    setError('')
    setMessage('')

    if (!email) {
      setError('Escribe tu email para enviarte el restablecimiento.')
      return
    }

    setIsResetting(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      },
    )
    setIsResetting(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setMessage('Te enviamos un enlace para restablecer tu contraseña.')
  }

  return (
    <main className="min-h-screen bg-open-bg px-6 text-open-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center py-12">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="grid w-full overflow-hidden border border-open-border bg-white md:grid-cols-[1fr_420px]"
        >
          <div className="flex min-h-[520px] flex-col justify-between border-open-border p-8 md:border-r md:p-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
                OPEN
              </p>
              <h1 className="mt-8 max-w-xl text-4xl font-semibold leading-tight text-open-ink md:text-6xl">
                Performance hub for competitive tennis.
              </h1>
            </div>

            <div className="grid gap-3 text-sm text-open-muted sm:grid-cols-3">
              <span>Players</span>
              <span>Ratings</span>
              <span>Match intelligence</span>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col justify-center gap-5 bg-open-bg p-8 md:p-10"
          >
            <div>
              <h2 className="text-2xl font-semibold text-open-ink">
                Iniciar sesión
              </h2>
              <p className="mt-2 text-sm text-open-muted">
                Accede al panel operativo de OPEN.
              </p>
            </div>

            <div className="grid grid-cols-2 border border-open-border bg-open-surface p-1">
              <button
                type="button"
                className="h-10 bg-open-ink text-sm font-semibold text-white transition"
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="h-10 text-sm font-semibold text-open-muted transition hover:text-open-ink"
              >
                Registrarse
              </button>
            </div>

            <label className="grid gap-2 text-sm font-medium text-open-ink">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className="h-12 border border-open-border bg-open-surface px-4 text-base text-open-ink outline-none transition focus:border-open-ink focus:bg-white"
                placeholder="nombre@open.app"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-open-ink">
              Contraseña
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="h-12 border border-open-border bg-open-surface px-4 text-base text-open-ink outline-none transition focus:border-open-ink focus:bg-white"
                placeholder="••••••••"
              />
            </label>

            {error ? (
              <p className="border border-open-border bg-white px-4 py-3 text-sm text-open-muted">
                {error}
              </p>
            ) : null}

            {message ? (
              <p className="border border-open-border bg-white px-4 py-3 text-sm text-open-muted">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 bg-open-ink px-5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-open-muted"
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>

            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={isResetting}
              className="text-left text-sm font-semibold text-open-muted transition hover:text-open-ink disabled:cursor-not-allowed"
            >
              {isResetting
                ? 'Enviando restablecimiento...'
                : 'Olvidé mi contraseña'}
            </button>
          </form>
        </motion.section>
      </div>
    </main>
  )
}

export default AuthView
