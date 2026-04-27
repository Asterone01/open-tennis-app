import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { setStoredRole } from '../../hooks/useActiveRole'
import OnboardingWizard from './OnboardingWizard'

const loginRoles = [
  { id: 'manager', label: 'Manager', description: 'Clubes y torneos' },
  { id: 'coach', label: 'Coach', description: 'Evaluaciones' },
  { id: 'player', label: 'Player', description: 'Perfil y retos' },
]

function AuthView() {
  const [step, setStep] = useState('role')
  const [mode, setMode] = useState('login')
  const [selectedRole, setSelectedRole] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  if (mode === 'signup') {
    return (
      <OnboardingWizard
        initialRole={selectedRole}
        onBackToLogin={() => {
          setMode('login')
          setStep('auth')
        }}
      />
    )
  }

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setStoredRole(role)
    setStep('auth')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    setStoredRole(selectedRole)

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

          {step === 'role' ? (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="flex flex-col justify-center gap-5 bg-open-bg p-8 md:p-10"
            >
              <div>
                <h2 className="text-2xl font-semibold text-open-ink">
                  ¿Cómo quieres entrar?
                </h2>
                <p className="mt-2 text-sm text-open-muted">
                  Selecciona tu perfil para continuar.
                </p>
              </div>

              <div className="grid gap-2">
                {loginRoles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleSelect(role.id)}
                    className="group flex items-center justify-between border border-open-border bg-open-surface px-4 py-4 text-left text-open-ink transition hover:border-black hover:bg-black hover:text-white"
                  >
                    <span>
                      <span className="block text-sm font-semibold">
                        {role.label}
                      </span>
                      <span className="mt-1 block text-xs text-open-muted group-hover:text-white/75">
                        {role.description}
                      </span>
                    </span>
                    <span className="h-3 w-3 rounded-full border border-open-muted group-hover:border-white group-hover:bg-white" />
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="auth"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="flex flex-col justify-center gap-5 bg-open-bg p-8 md:p-10"
            >
              <button
                type="button"
                onClick={() => setStep('role')}
                className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-open-muted transition hover:text-open-ink"
              >
                <ArrowLeft size={16} strokeWidth={1.8} />
                Cambiar perfil
              </button>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-open-muted">
                  {selectedRole}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-open-ink">
                  Iniciar sesión
                </h2>
                <p className="mt-2 text-sm text-open-muted">
                  Entra o registra una cuenta para este perfil.
                </p>
              </div>

              <div className="grid grid-cols-2 border border-open-border bg-open-surface p-1">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="h-10 bg-black text-sm font-semibold text-white transition hover:bg-black"
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
                className="h-12 bg-black px-5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-black disabled:opacity-45"
              >
                {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
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
            </motion.form>
          )}
        </motion.section>
      </div>
    </main>
  )
}

export default AuthView
