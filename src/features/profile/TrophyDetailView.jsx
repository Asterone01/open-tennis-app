import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Copy, Download, Save, Share2, Trophy } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const SEASON_THEME = {
  spring: { label: 'Primavera', color: '#2d7a4a' },
  summer: { label: 'Verano', color: '#f5a623' },
  autumn: { label: 'Otono', color: '#e67e22' },
  winter: { label: 'Invierno', color: '#3498db' },
}

const COLOR_PRESETS = ['#0D0D0F', '#2d7a4a', '#f5a623', '#e67e22', '#3498db']

export default function TrophyDetailView() {
  const { trophyId } = useParams()
  const trophyRef = useRef(null)
  const [trophy, setTrophy] = useState(null)
  const [player, setPlayer] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [message, setMessage] = useState('')
  const [backgroundColor, setBackgroundColor] = useState('#0D0D0F')
  const [includePhoto, setIncludePhoto] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function load() {
      setIsLoading(true)
      setError('')

      const [{ data: userData }, trophyRes] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('tournament_trophies')
          .select('*')
          .eq('id', trophyId)
          .maybeSingle(),
      ])

      if (!isMounted) return

      setCurrentUserId(userData.user?.id || null)

      if (trophyRes.error || !trophyRes.data) {
        setError(trophyRes.error?.message || 'No se encontro este trofeo.')
        setIsLoading(false)
        return
      }

      const nextTrophy = trophyRes.data
      setTrophy(nextTrophy)
      setMessage(nextTrophy.custom_message || '')
      setBackgroundColor(nextTrophy.background_color || seasonTheme(nextTrophy).color)
      setIncludePhoto(nextTrophy.include_photo !== false)

      const { data: playerData } = await supabase
        .from('players')
        .select('id, full_name, avatar_url, current_category, suggested_category, age_group, level')
        .eq('id', String(nextTrophy.player_id))
        .maybeSingle()

      if (isMounted) {
        setPlayer(playerData || null)
        setIsLoading(false)
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [trophyId])

  const canEdit = trophy?.user_id && trophy.user_id === currentUserId
  const theme = useMemo(() => seasonTheme(trophy), [trophy])
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  async function savePersonalization() {
    if (!canEdit || !trophy) return
    setIsSaving(true)
    setNotice('')

    const { data, error: saveError } = await supabase
      .from('tournament_trophies')
      .update({
        custom_message: message.trim() || null,
        background_color: backgroundColor,
        include_photo: includePhoto,
      })
      .eq('id', trophy.id)
      .select()
      .single()

    if (saveError) {
      setNotice(saveError.message)
    } else {
      setTrophy(data)
      setNotice('Trofeo actualizado.')
    }

    setIsSaving(false)
  }

  async function shareTrophy() {
    const text = `Gane ${trophy?.tournament_title || 'un torneo'} en OPEN.`
    if (navigator.share) {
      await navigator.share({ title: 'Trofeo OPEN', text, url: shareUrl })
      return
    }
    await copyLink()
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  function downloadCard() {
    const html = trophyRef.current?.outerHTML || ''
    const page = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Trofeo OPEN</title>
          <style>
            body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f6f6f7; font-family: Inter, Arial, sans-serif; }
            .trophy-card { width: min(92vw, 520px); }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `
    const blob = new Blob([page], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `trofeo-open-${trophy?.id || 'digital'}.html`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) return <p className="text-sm text-open-muted">Cargando trofeo...</p>

  if (error || !trophy) {
    return (
      <section className="mx-auto grid max-w-4xl gap-5">
        <BackLink />
        <p className="border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
          {error || 'No se encontro este trofeo.'}
        </p>
      </section>
    )
  }

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-6">
      <BackLink />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <TrophyCard
          refEl={trophyRef}
          trophy={trophy}
          player={player}
          theme={theme}
          backgroundColor={backgroundColor}
          includePhoto={includePhoto}
          message={message}
        />

        <aside className="grid gap-4">
          <section className="border border-open-light bg-open-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-open-muted">
              Compartir
            </p>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={shareTrophy}
                className="inline-flex h-11 items-center justify-center gap-2 bg-open-primary px-4 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Share2 size={16} strokeWidth={1.8} />
                Compartir trofeo
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex h-11 items-center justify-center gap-2 border border-open-light bg-open-bg px-4 text-sm font-semibold text-open-ink transition hover:border-open-primary"
              >
                {copied ? <Check size={16} strokeWidth={1.8} /> : <Copy size={16} strokeWidth={1.8} />}
                {copied ? 'Link copiado' : 'Copiar link'}
              </button>
              <button
                type="button"
                onClick={downloadCard}
                className="inline-flex h-11 items-center justify-center gap-2 border border-open-light bg-open-bg px-4 text-sm font-semibold text-open-ink transition hover:border-open-primary"
              >
                <Download size={16} strokeWidth={1.8} />
                Descargar card
              </button>
            </div>
          </section>

          {canEdit ? (
            <section className="border border-open-light bg-open-surface p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-open-muted">
                Personalizar
              </p>
              <label className="mt-4 grid gap-2 text-sm font-semibold text-open-ink">
                Frase del campeon
                <input
                  value={message}
                  onChange={(event) => setMessage(event.target.value.slice(0, 50))}
                  maxLength={50}
                  className="field"
                  placeholder="Campeon inquebrantable"
                />
                <span className="text-xs font-normal text-open-muted">{message.length}/50</span>
              </label>

              <div className="mt-4 grid gap-2">
                <p className="text-sm font-semibold text-open-ink">Color</p>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBackgroundColor(color)}
                      className={[
                        'h-9 w-9 border transition',
                        backgroundColor === color ? 'border-open-ink ring-2 ring-open-ink/20' : 'border-open-light',
                      ].join(' ')}
                      style={{ backgroundColor: color }}
                      aria-label={`Usar color ${color}`}
                    />
                  ))}
                </div>
              </div>

              <label className="mt-4 flex items-center justify-between gap-3 border border-open-light bg-open-bg p-3 text-sm font-semibold text-open-ink">
                Incluir foto
                <input
                  type="checkbox"
                  checked={includePhoto}
                  onChange={(event) => setIncludePhoto(event.target.checked)}
                  className="h-5 w-5 accent-open-primary"
                />
              </label>

              <button
                type="button"
                onClick={savePersonalization}
                disabled={isSaving}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 bg-open-primary px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                <Save size={16} strokeWidth={1.8} />
                {isSaving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              {notice ? <p className="mt-3 text-sm text-open-muted">{notice}</p> : null}
            </section>
          ) : null}
        </aside>
      </div>
    </section>
  )
}

function TrophyCard({ refEl, trophy, player, theme, backgroundColor, includePhoto, message }) {
  const displayName = player?.full_name || 'Campeon OPEN'
  const category = trophy.category || player?.current_category || player?.suggested_category || 'Open'
  const ageGroup = trophy.age_group || player?.age_group || ''

  return (
    <article
      ref={refEl}
      className="trophy-card overflow-hidden border border-open-light bg-open-surface shadow-2xl shadow-black/10"
      style={{ color: '#ffffff' }}
    >
      <div
        className="relative min-h-[34rem] p-6 sm:p-8"
        style={{ background: `linear-gradient(145deg, ${backgroundColor}, #050506)` }}
      >
        <div className="absolute inset-x-0 top-0 h-2" style={{ backgroundColor: theme.color }} />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/60">
              Trofeo digital
            </p>
            <h1 className="mt-3 text-4xl text-white sm:text-6xl">Campeon</h1>
          </div>
          <div className="grid h-16 w-16 place-items-center border border-white/20 bg-white/10">
            <Trophy size={28} strokeWidth={1.6} />
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-2xl font-black text-white">{trophy.tournament_title}</p>
            <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/60">
              {trophy.club_name || 'Club OPEN'} · {theme.label}
            </p>
          </div>
          {includePhoto && player?.avatar_url ? (
            <img
              src={player.avatar_url}
              alt=""
              className="h-24 w-24 border border-white/20 object-cover"
            />
          ) : null}
        </div>

        <div className="mt-10 grid gap-3 border-y border-white/15 py-6">
          <InfoLine label="Ganador" value={displayName} />
          <InfoLine label="Categoria" value={`Cat. ${category}${ageGroup ? ` · ${ageGroup}` : ''}`} />
          <InfoLine label="Fecha" value={formatDate(trophy.won_at)} />
        </div>

        <div className="mt-8 border border-white/15 bg-white/10 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">Frase</p>
          <p className="mt-3 text-xl font-semibold leading-snug text-white">
            "{message || trophy.custom_message || 'Campeon inquebrantable'}"
          </p>
        </div>

        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.18em] text-white/45">
          <span>OPEN</span>
          <span>Play. Improve. Connect.</span>
        </div>
      </div>
    </article>
  )
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="font-bold uppercase tracking-[0.16em] text-white/45">{label}</span>
      <span className="text-right font-semibold text-white">{value}</span>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      to="/profile"
      className="inline-flex h-10 w-fit items-center gap-2 border border-open-light bg-open-surface px-3 text-sm font-semibold text-open-ink transition hover:border-open-primary"
    >
      <ArrowLeft size={16} strokeWidth={1.8} />
      Perfil
    </Link>
  )
}

function seasonTheme(trophy) {
  if (trophy?.season && SEASON_THEME[trophy.season]) return SEASON_THEME[trophy.season]
  const month = trophy?.won_at ? new Date(`${trophy.won_at}T00:00:00`).getMonth() + 1 : new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return SEASON_THEME.spring
  if (month >= 6 && month <= 8) return SEASON_THEME.summer
  if (month >= 9 && month <= 11) return SEASON_THEME.autumn
  return SEASON_THEME.winter
}

function formatDate(value) {
  if (!value) return 'Fecha pendiente'
  return new Date(`${value}T00:00:00`).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
