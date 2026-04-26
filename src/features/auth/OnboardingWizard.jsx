import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'

const roles = [
  {
    id: 'manager',
    title: 'MANAGER',
    description: 'Gestiona tu club, organiza torneos y construye comunidad.',
  },
  {
    id: 'coach',
    title: 'COACH',
    description: 'Lleva el rendimiento de tus jugadores al siguiente nivel.',
  },
  {
    id: 'player',
    title: 'PLAYER',
    description: 'Mejora tu juego, compite y alcanza tus metas.',
  },
]

const slide = {
  initial: { x: 32, opacity: 0 },
  animate: { x: 0, opacity: 1 },
}

function OnboardingWizard({ onBackToLogin }) {
  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    sex: '',
    birthDate: '',
    yearsPlaying: '',
    coachingExperience: '',
    clubName: '',
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const selectRole = (role) => {
    setSelectedRole(role)
    setError('')
    setStep(2)
  }

  const goBack = () => {
    setError('')
    setMessage('')

    if (step === 1) {
      onBackToLogin?.()
      return
    }

    setStep((current) => current - 1)
  }

  const handleCredentialsSubmit = (event) => {
    event.preventDefault()
    setError('')

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setStep(3)
  }

  const handleFinalSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsSubmitting(true)

    const profileData = buildProfileData(selectedRole, formData)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          role: selectedRole,
          ...profileData,
        },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setIsSubmitting(false)
      return
    }

    if (selectedRole === 'player') {
      const { error: playerError } = await supabase.from('players').insert({
        user_id: data.user?.id,
        email: formData.email,
        full_name: formData.fullName,
        sex: formData.sex,
        birth_date: formData.birthDate || null,
        years_playing: Number(formData.yearsPlaying || 0),
        role: selectedRole,
      })

      if (playerError) {
        setError(playerError.message)
        setIsSubmitting(false)
        return
      }
    }

    if (selectedRole === 'manager' && data.user?.id) {
      await supabase.from('clubs').insert({
        manager_id: data.user.id,
        name: formData.clubName,
      })
    }

    setMessage('Cuenta creada. Revisa tu correo para confirmar el acceso.')
    setIsSubmitting(false)
  }

  return (
    <main className="min-h-screen bg-white px-6 text-open-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center py-10">
        <section className="w-full overflow-hidden bg-white">
          <div className="mb-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={goBack}
              className="grid h-11 w-11 place-items-center rounded-full border border-open-light bg-open-surface text-open-ink transition hover:border-open-ink"
              aria-label="Volver"
            >
              <ArrowLeft size={18} strokeWidth={1.8} />
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-open-muted">
              Paso {step} de 3
            </p>
          </div>

          {step === 1 ? (
            <motion.div key="role" {...slide} transition={{ duration: 0.32 }}>
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
                  OPEN
                </p>
                <h1 className="mt-4 font-display text-3xl italic text-open-ink md:text-5xl">
                  ¿CÓMO QUIERES USAR OPEN?
                </h1>
                <p className="mt-3 text-sm text-open-muted">
                  Elige tu rol y personaliza tu experiencia.
                </p>
              </div>

              <div className="mt-10 grid gap-4">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => selectRole(role.id)}
                    className="group flex items-center justify-between gap-5 rounded-2xl border border-open-light bg-open-surface p-5 text-left transition hover:border-open-ink hover:bg-white"
                  >
                    <span>
                      <span className="block font-display text-xl italic tracking-[0.08em] text-open-ink">
                        {role.title}
                      </span>
                      <span className="mt-2 block text-sm leading-6 text-open-muted">
                        {role.description}
                      </span>
                    </span>
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-open-light bg-white text-open-ink transition group-hover:border-open-ink group-hover:bg-open-ink group-hover:text-white">
                      <ArrowRight size={18} strokeWidth={1.8} />
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : null}

          {step === 2 ? (
            <motion.form
              key="credentials"
              {...slide}
              transition={{ duration: 0.32 }}
              onSubmit={handleCredentialsSubmit}
              className="mx-auto max-w-xl"
            >
              <StepHeader
                title="Credenciales"
                subtitle="Crea el acceso seguro para tu cuenta OPEN."
              />
              <div className="mt-8 grid gap-4">
                <PillInput
                  label="Email"
                  type="email"
                  value={formData.email}
                  autoComplete="email"
                  onChange={(value) => updateField('email', value)}
                  placeholder="nombre@open.app"
                />
                <PillInput
                  label="Contraseña"
                  type="password"
                  value={formData.password}
                  autoComplete="new-password"
                  onChange={(value) => updateField('password', value)}
                  placeholder="••••••••"
                />
              </div>
              <Feedback error={error} message={message} />
              <PrimaryButton>Continuar</PrimaryButton>
            </motion.form>
          ) : null}

          {step === 3 ? (
            <motion.form
              key="profile"
              {...slide}
              transition={{ duration: 0.32 }}
              onSubmit={handleFinalSubmit}
              className="mx-auto max-w-xl"
            >
              <StepHeader
                title="Perfil"
                subtitle="Completa los datos para personalizar tu experiencia."
              />
              <div className="mt-8 grid gap-4">
                <PillInput
                  label="Nombre completo"
                  type="text"
                  value={formData.fullName}
                  autoComplete="name"
                  onChange={(value) => updateField('fullName', value)}
                  placeholder="Andrés Rivera"
                />

                {selectedRole === 'player' ? (
                  <>
                    <PillSelect
                      label="Sexo"
                      value={formData.sex}
                      onChange={(value) => updateField('sex', value)}
                      options={[
                        { value: '', label: 'Selecciona una opción' },
                        { value: 'female', label: 'Femenino' },
                        { value: 'male', label: 'Masculino' },
                        { value: 'other', label: 'Otro' },
                      ]}
                    />
                    <PillInput
                      label="Fecha de nacimiento"
                      type="date"
                      value={formData.birthDate}
                      onChange={(value) => updateField('birthDate', value)}
                    />
                    <PillInput
                      label="Años jugando tenis"
                      type="number"
                      min="0"
                      value={formData.yearsPlaying}
                      onChange={(value) => updateField('yearsPlaying', value)}
                      placeholder="4"
                    />
                  </>
                ) : null}

                {selectedRole === 'coach' ? (
                  <PillInput
                    label="Años de experiencia entrenando"
                    type="number"
                    min="0"
                    value={formData.coachingExperience}
                    onChange={(value) =>
                      updateField('coachingExperience', value)
                    }
                    placeholder="8"
                  />
                ) : null}

                {selectedRole === 'manager' ? (
                  <PillInput
                    label="Nombre del club"
                    type="text"
                    value={formData.clubName}
                    onChange={(value) => updateField('clubName', value)}
                    placeholder="OPEN Tennis Club"
                  />
                ) : null}
              </div>
              <Feedback error={error} message={message} />
              <PrimaryButton disabled={isSubmitting}>
                {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
              </PrimaryButton>
            </motion.form>
          ) : null}
        </section>
      </div>
    </main>
  )
}

function buildProfileData(role, data) {
  const baseData = { full_name: data.fullName }

  if (role === 'player') {
    return {
      ...baseData,
      sex: data.sex,
      birth_date: data.birthDate,
      years_playing: Number(data.yearsPlaying || 0),
    }
  }

  if (role === 'coach') {
    return {
      ...baseData,
      coaching_experience: Number(data.coachingExperience || 0),
    }
  }

  return {
    ...baseData,
    club_name: data.clubName,
  }
}

function StepHeader({ title, subtitle }) {
  return (
    <div className="text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
        OPEN
      </p>
      <h1 className="mt-4 font-display text-3xl italic text-open-ink md:text-5xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-open-muted">{subtitle}</p>
    </div>
  )
}

function PillInput({ label, onChange, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-open-ink">
      {label}
      <input
        {...props}
        required
        onChange={(event) => onChange(event.target.value)}
        className="h-14 rounded-full border border-open-light bg-open-surface px-5 text-base text-open-ink outline-none transition focus:border-open-ink focus:bg-white"
      />
    </label>
  )
}

function PillSelect({ label, value, onChange, options }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-open-ink">
      {label}
      <select
        value={value}
        required
        onChange={(event) => onChange(event.target.value)}
        className="h-14 rounded-full border border-open-light bg-open-surface px-5 text-base text-open-ink outline-none transition focus:border-open-ink focus:bg-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function Feedback({ error, message }) {
  if (!error && !message) {
    return null
  }

  return (
    <p className="mt-5 rounded-2xl border border-open-light bg-open-surface px-4 py-3 text-sm text-open-muted">
      {error || message}
    </p>
  )
}

function PrimaryButton({ children, disabled = false }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="mt-6 h-12 w-full rounded-full bg-open-ink px-5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-open-muted"
    >
      {children}
    </button>
  )
}

export default OnboardingWizard
