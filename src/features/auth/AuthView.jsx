import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { setStoredRole } from '../../hooks/useActiveRole'
import OnboardingWizard from './OnboardingWizard'

const loginRoles = [
  {
    id: 'manager',
    label: 'Manager',
    description: 'Clubes, membresias y operacion',
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'coach',
    label: 'Coach',
    description: 'Evaluaciones, entreno y torneos',
    image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'player',
    label: 'Player',
    description: 'Perfil, retos y competencia',
    image: 'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=900&q=80',
  },
]

const introImageUrl = '/auth-court.jpg'

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

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setIsSubmitting(false)
      return
    }

    const canEnterRole = await validateSelectedRole(data.user, selectedRole)

    if (!canEnterRole) {
      await supabase.auth.signOut()
      setError(`Esta cuenta no tiene acceso como ${selectedRole}.`)
      setIsSubmitting(false)
      return
    }

    setStoredRole(selectedRole)
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
    <main className="min-h-screen bg-open-bg px-4 text-open-ink sm:px-6">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center py-12">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="grid w-full gap-4 rounded-[2rem] border border-open-border bg-open-surface p-3 shadow-2xl shadow-black/5 md:grid-cols-[1fr_430px] md:gap-5 md:p-4"
        >
          <div
            className="relative isolate flex min-h-[520px] overflow-hidden rounded-[1.65rem] border border-open-border bg-open-surface bg-cover bg-center p-7 sm:rounded-[2rem] md:p-11"
            style={{
              backgroundImage: `
                linear-gradient(
                  to right,
                  rgba(255,255,255,0.96) 0%,
                  rgba(255,255,255,0.82) 40%,
                  rgba(255,255,255,0.24) 100%
                ),
                linear-gradient(
                  to top,
                  rgba(255,255,255,0.95) 0%,
                  rgba(255,255,255,0.72) 34%,
                  transparent 72%
                ),
                url('${introImageUrl}')
              `,
            }}
          >
            <div className="flex min-h-full w-full flex-col justify-between">
              <div>
                <p className="open-logo text-sm text-open-muted">
                  OPEN
                </p>
                <h1 className="mt-8 max-w-xl text-5xl font-black leading-[0.92] text-open-ink sm:text-6xl lg:text-7xl">
                  Performance hub for competitive tennis.
                </h1>
              </div>

              <div className="grid gap-3 text-sm font-semibold text-open-muted sm:grid-cols-3">
                <span>Players</span>
                <span>Ratings</span>
                <span>Match intelligence</span>
              </div>
            </div>
          </div>

          {step === 'role' ? (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="flex flex-col justify-center gap-5 rounded-[1.65rem] border border-open-border bg-open-bg p-5 sm:rounded-[2rem] sm:p-7 md:p-9"
            >
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-open-muted">
                  Acceso OPEN
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-open-ink">
                  Como quieres entrar?
                </h2>
                <p className="mt-2 text-sm font-semibold text-open-muted">
                  Selecciona tu perfil para continuar.
                </p>
              </div>

              <div className="grid gap-3">
                {loginRoles.map((role) => (
                  <RoleBanner key={role.id} role={role} onSelect={handleRoleSelect} />
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
              className="flex flex-col justify-center gap-5 rounded-[1.65rem] border border-open-border bg-open-bg p-5 sm:rounded-[2rem] sm:p-7 md:p-9"
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
                  Entra con una cuenta autorizada para este perfil.
                </p>
              </div>

              <label className="grid gap-2 text-sm font-medium text-open-ink">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  className="h-12 rounded-[1.1rem] border border-open-border bg-open-surface px-4 text-base text-open-ink outline-none transition focus:border-open-ink focus:bg-open-surface"
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
                  className="h-12 rounded-[1.1rem] border border-open-border bg-open-surface px-4 text-base text-open-ink outline-none transition focus:border-open-ink focus:bg-open-surface"
                  placeholder="••••••••"
                />
              </label>

              {error ? (
                <p className="rounded-[1.1rem] border border-open-border bg-open-surface px-4 py-3 text-sm text-open-muted">
                  {error}
                </p>
              ) : null}

              {message ? (
                <p className="rounded-[1.1rem] border border-open-border bg-open-surface px-4 py-3 text-sm text-open-muted">
                  {message}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-12 rounded-[1.1rem] bg-open-ink px-5 text-sm font-black text-open-surface transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </button>

              <button
                type="button"
                onClick={() => setMode('signup')}
                className="h-12 rounded-[1.1rem] border border-open-border bg-open-surface px-5 text-sm font-black text-open-ink transition hover:border-open-ink"
              >
                Registrarse
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

async function validateSelectedRole(user, selectedRole) {
  const primaryRole = user?.user_metadata?.role || 'player'

  if (selectedRole === 'manager') {
    return primaryRole === 'manager'
  }

  if (selectedRole === 'coach') {
    if (primaryRole === 'coach') {
      return true
    }

    const { data: player } = await supabase
      .from('players')
      .select('is_coach')
      .eq('user_id', user.id)
      .maybeSingle()

    return Boolean(player?.is_coach)
  }

  return primaryRole === 'player' || primaryRole === 'coach'
}

function RoleBanner({ role, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(role.id)}
      className="group relative min-h-32 overflow-hidden rounded-[1.45rem] border border-open-border bg-open-ink p-5 text-center text-white transition hover:-translate-y-0.5 hover:border-open-ink hover:shadow-xl hover:shadow-black/10 sm:min-h-36 sm:text-left"
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.62] transition duration-300 group-hover:scale-105 group-hover:opacity-[0.78]"
        style={{ backgroundImage: `url('${role.image}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/74 to-black/18" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-transparent to-transparent" />

      <span className="relative z-10 flex min-h-24 flex-col items-center justify-center gap-4 sm:min-h-28 sm:items-start sm:justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-full border border-white/40 text-white transition group-hover:bg-white group-hover:text-open-ink sm:self-end">
          <ChevronRight size={17} strokeWidth={2.2} />
        </span>
        <span>
          <span className="block text-3xl font-black leading-none sm:text-2xl">
            {role.label}
          </span>
          <span className="mx-auto mt-2 block max-w-48 text-sm font-semibold text-white/72 sm:mx-0">
            {role.description}
          </span>
        </span>
      </span>
    </button>
  )
}

export default AuthView
