import { useEffect, useState } from 'react'
import { Image, Palette, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function BrandKitEditor() {
  const [user, setUser] = useState(null)
  const [clubId, setClubId] = useState(null)
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#0D0D0F')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadClub = async () => {
      setIsLoading(true)
      setError('')

      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (!isMounted) return

      if (userError || !userData.user) {
        setError(userError?.message || 'No se pudo cargar el manager.')
        setIsLoading(false)
        return
      }

      setUser(userData.user)

      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('manager_id', userData.user.id)
        .maybeSingle()

      if (!isMounted) return

      if (clubError) {
        setError(clubError.message)
      } else if (club) {
        setClubId(club.id)
        setName(club.name || '')
        setLogoUrl(club.logo_url || '')
        setPrimaryColor(club.primary_color || '#0D0D0F')
      } else {
        setName(userData.user.user_metadata?.club_name || '')
      }

      setIsLoading(false)
    }

    loadClub()

    return () => {
      isMounted = false
    }
  }, [])

  const handleSave = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setMessage('')

    const payload = {
      manager_id: user.id,
      name,
      logo_url: logoUrl || null,
      primary_color: primaryColor,
    }

    const query = clubId
      ? supabase.from('clubs').update(payload).eq('id', clubId).select().single()
      : supabase.from('clubs').insert(payload).select().single()

    const { data, error: saveError } = await query

    if (saveError) {
      setError(saveError.message)
    } else {
      setClubId(data.id)
      setMessage('Cambios guardados.')
      window.dispatchEvent(
        new CustomEvent('open-theme-updated', {
          detail: {
            primaryColor: data.primary_color,
            logoUrl: data.logo_url || '',
            clubName: data.name,
          },
        }),
      )
    }

    setIsSaving(false)
  }

  return (
    <form
      onSubmit={handleSave}
      className="grid gap-5 border border-open-light bg-open-surface p-5 md:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)] md:p-6"
    >
      <section className="grid content-start gap-5">
        <div>
          <p className="text-sm font-semibold text-open-muted">Brand kit</p>
          <h2 className="mt-2 text-2xl font-semibold text-open-ink">
            Identidad del club
          </h2>
        </div>

        <Field label="Nombre del Club">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="h-12 w-full border border-open-light bg-open-bg px-4 text-base text-open-ink outline-none transition focus:border-open-ink focus:bg-white"
            placeholder="OPEN Tennis Club"
          />
        </Field>

        <Field label="URL del Logo">
          <div className="flex h-12 items-center gap-3 border border-open-light bg-open-bg px-4 transition focus-within:border-open-ink focus-within:bg-white">
            <Image size={18} strokeWidth={1.8} className="text-open-muted" />
            <input
              type="url"
              value={logoUrl}
              onChange={(event) => setLogoUrl(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-base text-open-ink outline-none"
              placeholder="https://..."
            />
          </div>
        </Field>

        <Field label="Color Principal">
          <div className="flex h-12 items-center gap-3 border border-open-light bg-open-bg px-4">
            <Palette size={18} strokeWidth={1.8} className="text-open-muted" />
            <input
              type="color"
              value={primaryColor}
              onChange={(event) => setPrimaryColor(event.target.value)}
              className="h-8 w-12 cursor-pointer border-0 bg-transparent p-0"
              aria-label="Color principal"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(event) => setPrimaryColor(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-base font-semibold uppercase text-open-ink outline-none"
            />
          </div>
        </Field>

        {error ? (
          <p className="border border-open-light bg-open-bg px-4 py-3 text-sm text-open-muted">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="border border-open-light bg-open-bg px-4 py-3 text-sm text-open-muted">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSaving || isLoading || !user}
          className="inline-flex h-12 items-center justify-center gap-2 bg-open-primary px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-open-muted"
        >
          <Save size={17} strokeWidth={1.8} />
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </section>

      <section
        className="border border-open-light bg-open-bg p-4"
        style={{ '--color-brand-primary': primaryColor }}
      >
        <div className="overflow-hidden border border-open-light bg-white">
          <div className="flex h-14 items-center justify-between border-b border-open-light px-4">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  className="h-8 w-8 object-contain"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="h-8 w-8 bg-open-primary" />
              )}
              <span className="text-sm font-semibold text-open-ink">
                {name || 'Tu Club'}
              </span>
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-open-muted">
              Preview
            </span>
          </div>

          <div className="grid gap-4 p-5">
            <div>
              <p className="text-sm text-open-muted">Dashboard</p>
              <h3 className="mt-1 text-2xl font-semibold text-open-ink">
                Torneo del fin de semana
              </h3>
            </div>
            <button
              type="button"
              className="h-11 bg-open-primary px-4 text-sm font-semibold text-white"
            >
              Crear bracket
            </button>
            <div className="grid grid-cols-3 gap-3">
              {['Jugadores', 'Canchas', 'Matches'].map((item) => (
                <div key={item} className="border border-open-light bg-open-bg p-3">
                  <p className="text-xs text-open-muted">{item}</p>
                  <p className="mt-2 text-xl font-semibold text-open-ink">24</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </form>
  )
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-open-ink">
      {label}
      {children}
    </label>
  )
}

export default BrandKitEditor
