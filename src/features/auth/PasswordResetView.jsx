import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function PasswordResetView({ session }) {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  if (!session && !window.location.hash.includes('access_token=')) {
    return <Navigate to="/login" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden.')
      return
    }

    setIsSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setIsSubmitting(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setIsComplete(true)
  }

  return (
    <main className="min-h-screen bg-open-bg px-6 text-open-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center py-12">
        <section className="w-full border border-open-light bg-open-surface p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
            OPEN
          </p>
          <h1 className="mt-6 text-3xl font-semibold text-open-ink">
            Restablecer contrasena
          </h1>

          {isComplete ? (
            <div className="mt-8 grid gap-5">
              <p className="text-sm leading-6 text-open-muted">
                Tu contrasena fue actualizada correctamente.
              </p>
              <button
                type="button"
                onClick={() => navigate('/dashboard', { replace: true })}
                className="h-12 bg-open-ink px-5 text-sm font-semibold text-white transition hover:bg-black"
              >
                Entrar al dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 grid gap-6">
              <label className="grid gap-2 text-sm font-medium text-open-ink">
                Nueva contrasena
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                  className="h-12 border border-open-light bg-open-bg px-4 text-base text-open-ink outline-none transition focus:border-open-ink focus:bg-white"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-open-ink">
                Confirmar contrasena
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                  className="h-12 border border-open-light bg-open-bg px-4 text-base text-open-ink outline-none transition focus:border-open-ink focus:bg-white"
                />
              </label>

              {error ? (
                <p className="border border-open-light bg-open-bg px-4 py-3 text-sm text-open-muted">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-12 bg-open-ink px-5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-open-muted"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar contrasena'}
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}

export default PasswordResetView
