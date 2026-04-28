import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { ensurePlayerProfile } from '../profile/profileConnections'

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

const ageGroups = [
  { id: 'junior', title: 'Junior', detail: '6 a 12 anos' },
  { id: 'juvenil', title: 'Juvenil', detail: '13 a 17 anos' },
  { id: 'adulto', title: 'Adulto', detail: '18 a 50 anos' },
  { id: 'senior', title: 'Senior', detail: '50+ anos' },
]

const categories = [
  { id: 'D', title: 'D', detail: 'Iniciacion' },
  { id: 'C', title: 'C', detail: 'Basico' },
  { id: 'B', title: 'B', detail: 'Intermedio' },
  { id: 'A', title: 'A', detail: 'Avanzado' },
  { id: 'Pro', title: 'Pro', detail: 'Elite' },
]

const slide = {
  initial: { x: 32, opacity: 0 },
  animate: { x: 0, opacity: 1 },
}

function OnboardingWizard({ initialRole = '', onBackToLogin }) {
  const [step, setStep] = useState(initialRole ? 2 : 1)
  const [selectedRole, setSelectedRole] = useState(initialRole)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    avatarUrl: '',
    sex: '',
    birthDate: '',
    ageGroup: '',
    suggestedCategory: '',
    yearsPlaying: '',
    coachingExperience: '',
    clubName: '',
    clubId: '',
  })
  const [clubs, setClubs] = useState([])
  const [clubQuery, setClubQuery] = useState('')
  const [isLoadingClubs, setIsLoadingClubs] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const totalSteps = selectedRole === 'manager' ? 3 : 6

  useEffect(() => {
    if (step !== 6 || selectedRole === 'manager') {
      return
    }

    let isMounted = true

    const loadClubs = async () => {
      setIsLoadingClubs(true)
      setError('')

      const { data, error: clubsError } = await supabase
        .from('clubs')
        .select('id, name, logo_url')
        .order('name', { ascending: true })

      if (!isMounted) return

      if (clubsError) {
        setError(clubsError.message)
      } else {
        setClubs(data || [])
      }

      setIsLoadingClubs(false)
    }

    loadClubs()

    return () => {
      isMounted = false
    }
  }, [selectedRole, step])

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

    if (step === 1 || (initialRole && step === 2)) {
      onBackToLogin?.()
      return
    }

    setStep((current) => current - 1)
  }

  const handleCredentialsSubmit = (event) => {
    event.preventDefault()
    setError('')

    if (formData.password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres.')
      return
    }

    setStep(3)
  }

  const handleProfileSubmit = (event) => {
    event.preventDefault()
    setError('')
    setStep(4)
  }

  const handleAgeGroupSubmit = (event) => {
    event.preventDefault()
    setError('')

    if (!formData.ageGroup) {
      setError('Selecciona tu grupo de edad.')
      return
    }

    setStep(5)
  }

  const handleCategorySubmit = (event) => {
    event.preventDefault()
    setError('')

    if (!formData.suggestedCategory) {
      setError('Selecciona tu categoria sugerida.')
      return
    }

    setStep(6)
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

    if (data.session && (selectedRole === 'player' || selectedRole === 'coach')) {
      const { error: playerError } = await ensurePlayerProfile(data.user, {
        email: formData.email,
        full_name: formData.fullName,
        phone: formData.phone || null,
        avatar_url: formData.avatarUrl || null,
        sex: formData.sex || null,
        birth_date: formData.birthDate || null,
        age_group: formData.ageGroup || null,
        suggested_category: formData.suggestedCategory || null,
        current_category: null,
        years_playing: Number(formData.yearsPlaying || 0),
        role: selectedRole,
        is_coach: selectedRole === 'coach',
        club_id: formData.clubId || null,
        club_membership_status: formData.clubId ? 'pending' : 'unassigned',
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        force: true,
      })

      if (playerError) {
        setError(playerError.message)
        setIsSubmitting(false)
        return
      }
    }

    if (data.session && selectedRole === 'manager' && data.user?.id) {
      await supabase.from('clubs').insert({
        manager_id: data.user.id,
        name: formData.clubName,
      })
    }

    setMessage('Cuenta creada. Revisa tu correo para confirmar el acceso.')
    setIsSubmitting(false)
  }

  const filteredClubs = clubs.filter((club) =>
    club.name.toLowerCase().includes(clubQuery.trim().toLowerCase()),
  )

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
              Paso {Math.min(step, totalSteps)} de {totalSteps}
            </p>
          </div>

          {step === 1 ? (
            <motion.div key="role" {...slide} transition={{ duration: 0.32 }}>
              <div className="text-center">
                <p className="open-logo text-sm text-open-muted">OPEN</p>
                <h1 className="mt-4 font-display text-3xl italic text-open-ink md:text-5xl">
                  COMO QUIERES USAR OPEN?
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
                  label="Contrasena"
                  type="password"
                  value={formData.password}
                  autoComplete="new-password"
                  onChange={(value) => updateField('password', value)}
                  placeholder="********"
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
              onSubmit={
                selectedRole === 'manager' ? handleFinalSubmit : handleProfileSubmit
              }
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
                  placeholder="Andres Rivera"
                />

                {selectedRole !== 'manager' ? (
                  <>
                    <PillInput
                      label="Telefono"
                      type="tel"
                      value={formData.phone}
                      autoComplete="tel"
                      required={false}
                      onChange={(value) => updateField('phone', value)}
                      placeholder="+52 55 0000 0000"
                    />
                    <PillInput
                      label="Foto de perfil URL"
                      type="url"
                      value={formData.avatarUrl}
                      required={false}
                      onChange={(value) => updateField('avatarUrl', value)}
                      placeholder="https://..."
                    />
                    <PillInput
                      label="Fecha de nacimiento"
                      type="date"
                      value={formData.birthDate}
                      onChange={(value) => updateField('birthDate', value)}
                    />
                  </>
                ) : null}

                {selectedRole === 'player' ? (
                  <>
                    <PillSelect
                      label="Sexo"
                      value={formData.sex}
                      onChange={(value) => updateField('sex', value)}
                      options={[
                        { value: '', label: 'Selecciona una opcion' },
                        { value: 'female', label: 'Femenino' },
                        { value: 'male', label: 'Masculino' },
                        { value: 'other', label: 'Otro' },
                      ]}
                    />
                    <PillInput
                      label="Anos jugando tenis"
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
                    label="Anos de experiencia entrenando"
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
                {selectedRole === 'manager'
                  ? isSubmitting
                    ? 'Creando cuenta...'
                    : 'Crear cuenta'
                  : 'Continuar'}
              </PrimaryButton>
            </motion.form>
          ) : null}

          {step === 4 ? (
            <motion.form
              key="age-group"
              {...slide}
              transition={{ duration: 0.32 }}
              onSubmit={handleAgeGroupSubmit}
              className="mx-auto max-w-xl"
            >
              <StepHeader
                title="Grupo"
                subtitle="Esto separa rankings y rivales por etapa deportiva."
              />
              <ChoiceGrid
                items={ageGroups}
                value={formData.ageGroup}
                onChange={(value) => updateField('ageGroup', value)}
              />
              <Feedback error={error} message={message} />
              <PrimaryButton>Continuar</PrimaryButton>
            </motion.form>
          ) : null}

          {step === 5 ? (
            <motion.form
              key="category"
              {...slide}
              transition={{ duration: 0.32 }}
              onSubmit={handleCategorySubmit}
              className="mx-auto max-w-xl"
            >
              <StepHeader
                title="Categoria"
                subtitle="Tu coach la confirmara despues de evaluarte."
              />
              <ChoiceGrid
                items={categories}
                value={formData.suggestedCategory}
                onChange={(value) => updateField('suggestedCategory', value)}
              />
              <Feedback error={error} message={message} />
              <PrimaryButton>Continuar</PrimaryButton>
            </motion.form>
          ) : null}

          {step === 6 ? (
            <motion.form
              key="club"
              {...slide}
              transition={{ duration: 0.32 }}
              onSubmit={handleFinalSubmit}
              className="mx-auto max-w-xl"
            >
              <StepHeader
                title="Club"
                subtitle="Solicita acceso a tu club o termina sin club por ahora."
              />
              <div className="mt-8 grid gap-4">
                <PillInput
                  label="Buscar club"
                  type="search"
                  value={clubQuery}
                  required={false}
                  onChange={setClubQuery}
                  placeholder="Nombre del club"
                />
                <div className="grid max-h-72 gap-2 overflow-auto">
                  {filteredClubs.map((club) => (
                    <button
                      key={club.id}
                      type="button"
                      onClick={() => updateField('clubId', club.id)}
                      className={[
                        'flex items-center justify-between rounded-2xl border px-5 py-4 text-left transition',
                        formData.clubId === club.id
                          ? 'border-open-ink bg-open-ink text-white'
                          : 'border-open-light bg-open-surface text-open-ink hover:border-open-ink',
                      ].join(' ')}
                    >
                      <span className="text-sm font-semibold">{club.name}</span>
                      <span className="text-xs uppercase tracking-[0.14em] opacity-70">
                        {formData.clubId === club.id ? 'Pendiente' : 'Elegir'}
                      </span>
                    </button>
                  ))}
                </div>
                {isLoadingClubs ? (
                  <p className="text-sm text-open-muted">Cargando clubes...</p>
                ) : null}
                {!isLoadingClubs && clubs.length === 0 ? (
                  <p className="rounded-2xl border border-open-light bg-open-surface px-4 py-3 text-sm text-open-muted">
                    Todavia no hay clubes disponibles. Puedes terminar el registro
                    y unirte despues.
                  </p>
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
      phone: data.phone,
      avatar_url: data.avatarUrl,
      sex: data.sex,
      birth_date: data.birthDate,
      age_group: data.ageGroup,
      suggested_category: data.suggestedCategory,
      current_category: null,
      years_playing: Number(data.yearsPlaying || 0),
      club_id: data.clubId || null,
      club_membership_status: data.clubId ? 'pending' : 'unassigned',
      onboarding_completed: true,
    }
  }

  if (role === 'coach') {
    return {
      ...baseData,
      phone: data.phone,
      avatar_url: data.avatarUrl,
      birth_date: data.birthDate,
      age_group: data.ageGroup,
      suggested_category: data.suggestedCategory,
      current_category: null,
      club_id: data.clubId || null,
      club_membership_status: data.clubId ? 'pending' : 'unassigned',
      onboarding_completed: true,
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
      <p className="open-logo text-sm text-open-muted">OPEN</p>
      <h1 className="mt-4 font-display text-3xl italic text-open-ink md:text-5xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-open-muted">{subtitle}</p>
    </div>
  )
}

function ChoiceGrid({ items, value, onChange }) {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={[
            'rounded-2xl border p-5 text-left transition',
            value === item.id
              ? 'border-open-ink bg-open-ink text-white'
              : 'border-open-light bg-open-surface text-open-ink hover:border-open-ink',
          ].join(' ')}
        >
          <span className="block font-display text-xl italic">{item.title}</span>
          <span className="mt-2 block text-sm opacity-70">{item.detail}</span>
        </button>
      ))}
    </div>
  )
}

function PillInput({ label, onChange, required = true, ...props }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-open-ink">
      {label}
      <input
        {...props}
        required={required}
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
