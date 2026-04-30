import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Camera,
  Check,
  MapPin as MapPinIcon,
  Plus,
  X,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import useManagerClub from '../../hooks/useManagerClub'

// ─── Constants ────────────────────────────────────────────────────────────────

const SURFACES = [
  { value: 'clay',       label: 'Arcilla (Clay)' },
  { value: 'hard',       label: 'Dura (Hard)'    },
  { value: 'grass',      label: 'Pasto (Grass)'  },
  { value: 'artificial', label: 'Artificial'     },
]
const STATUSES = [
  { value: 'active',      label: 'Disponible'    },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'inactive',    label: 'Inactiva'      },
]
const STATUS_STYLES = {
  active:      'border-emerald-400/60 bg-emerald-500/20 text-emerald-300',
  maintenance: 'border-yellow-400/60 bg-yellow-500/20 text-yellow-300',
  inactive:    'border-white/20 bg-white/10 text-white/50',
}
// Surface accent colors used when no photo is set
const SURFACE_BG = {
  clay:       '#7B3F20',
  hard:       '#1B4F72',
  grass:      '#1B5E20',
  artificial: '#263238',
}
const SURFACE_LABELS = { clay: 'Arcilla', hard: 'Dura', grass: 'Pasto', artificial: 'Artificial' }
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const RES_STATUS_LABELS = { pending: 'Pendiente', confirmed: 'Confirmada', cancelled: 'Cancelada' }
const PAY_STATUS_LABELS = { free: 'Gratis', pending: 'Pago pendiente', paid: 'Pagado' }
const RES_STATUS_STYLES = {
  pending:   'border-yellow-400 text-yellow-600',
  confirmed: 'border-open-primary text-open-primary',
  cancelled: 'border-open-light text-open-muted',
}

function createEmptyForm() {
  return { name: '', surface: 'clay', isIndoor: false, notes: '', address: '' }
}
function createEmptyPricing(court = {}) {
  return {
    pricePerHour:   court.price_per_hour       ?? 0,
    peakPrice:      court.peak_price_per_hour  ?? '',
    peakStart:      court.peak_start           ?? '',
    peakEnd:        court.peak_end             ?? '',
    requiresPayment:court.requires_payment     ?? false,
    autoConfirm:    court.auto_confirm         ?? true,
    openTime:       court.open_time            ?? '07:00',
    closeTime:      court.close_time           ?? '22:00',
    closedDays:     court.closed_days          ?? [],
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

function CanchasView() {
  const { club, clubId, isLoading: isClubLoading } = useManagerClub()
  const [courts, setCourts]       = useState([])
  const [reservations, setRes]    = useState([])
  const [isLoading, setLoading]   = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(createEmptyForm)
  const [isSaving, setIsSaving]   = useState(false)
  const [expandedId, setExpanded] = useState(null)
  const [editTab, setEditTab]     = useState('info')
  const [editInfo, setEditInfo]   = useState({ status: '', notes: '', address: '' })
  const [editPricing, setEditPricing] = useState(createEmptyPricing())
  const [resFilter, setResFilter] = useState('all')
  const [uploadingId, setUploadId]= useState(null)
  const [userId, setUserId]       = useState(null)
  const [error, setError]         = useState('')
  const [message, setMessage]     = useState('')
  const photoInputRef             = useRef(null)
  const uploadTargetId            = useRef(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id ?? null))
  }, [])

  const load = async () => {
    if (!clubId) return
    setLoading(true)
    const [courtsRes, resRes] = await Promise.all([
      supabase.from('courts').select('*').eq('club_id', clubId).order('name'),
      supabase.from('court_reservations').select('*, courts(name)')
        .eq('club_id', clubId)
        .order('reservation_date', { ascending: false })
        .limit(100),
    ])
    if (courtsRes.error) setError(courtsRes.error.message)
    else setCourts(courtsRes.data || [])
    setRes(resRes.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [clubId])

  const flash = (msg) => { setMessage(msg); setTimeout(() => setMessage(''), 2500) }

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return }
    setIsSaving(true); setError('')
    const { data, error: e } = await supabase
      .from('courts')
      .insert({ club_id: clubId, name: form.name.trim(), surface: form.surface,
        is_indoor: form.isIndoor, notes: form.notes.trim() || null,
        address: form.address.trim() || null, status: 'active' })
      .select().single()
    if (e) setError(e.message)
    else { setCourts((c) => [...c, data].sort((a, b) => a.name.localeCompare(b.name))); setForm(createEmptyForm()); setShowForm(false); flash('Cancha creada.') }
    setIsSaving(false)
  }

  // ── Open edit ───────────────────────────────────────────────────────────────
  const openEdit = (court) => {
    if (expandedId === court.id) { setExpanded(null); return }
    setExpanded(court.id)
    setEditTab('info')
    setEditInfo({ status: court.status, notes: court.notes || '', address: court.address || '' })
    setEditPricing(createEmptyPricing(court))
  }

  // ── Save info ───────────────────────────────────────────────────────────────
  const handleSaveInfo = async (courtId) => {
    setIsSaving(true)
    const { data, error: e } = await supabase.from('courts')
      .update({ status: editInfo.status, notes: editInfo.notes || null, address: editInfo.address.trim() || null })
      .eq('id', courtId).select().single()
    if (e) setError(e.message)
    else { setCourts((c) => c.map((x) => (x.id === data.id ? data : x))); setExpanded(null); flash('Cancha actualizada.') }
    setIsSaving(false)
  }

  // ── Save pricing ────────────────────────────────────────────────────────────
  const handleSavePricing = async (courtId) => {
    setIsSaving(true)
    const { data, error: e } = await supabase.from('courts')
      .update({
        price_per_hour:     Number(editPricing.pricePerHour) || 0,
        peak_price_per_hour:editPricing.peakPrice !== '' ? Number(editPricing.peakPrice) : null,
        peak_start:         editPricing.peakStart || null,
        peak_end:           editPricing.peakEnd || null,
        requires_payment:   editPricing.requiresPayment,
        auto_confirm:       editPricing.autoConfirm,
        open_time:          editPricing.openTime || '07:00',
        close_time:         editPricing.closeTime || '22:00',
        closed_days:        editPricing.closedDays,
      })
      .eq('id', courtId).select().single()
    if (e) setError(e.message)
    else { setCourts((c) => c.map((x) => (x.id === data.id ? data : x))); setExpanded(null); flash('Configuración guardada.') }
    setIsSaving(false)
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (courtId) => {
    if (!window.confirm('¿Eliminar esta cancha y todas sus reservaciones?')) return
    const { error: e } = await supabase.from('courts').delete().eq('id', courtId)
    if (e) { setError(e.message); return }
    setCourts((c) => c.filter((x) => x.id !== courtId))
    setRes((r) => r.filter((x) => x.court_id !== courtId))
    flash('Cancha eliminada.')
  }

  // ── Photo upload ────────────────────────────────────────────────────────────
  const triggerPhotoUpload = (courtId) => {
    uploadTargetId.current = courtId
    photoInputRef.current?.click()
  }

  const handlePhotoFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    const courtId = uploadTargetId.current
    if (!file || !courtId) return
    if (!file.type.startsWith('image/')) { setError('Selecciona una imagen.'); return }

    setUploadId(courtId)
    const uid  = userId || (await supabase.auth.getUser()).data?.user?.id
    const ext  = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${uid}/courts/${courtId}/photo-${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('profile-avatars')
      .upload(path, file, { cacheControl: '3600', contentType: file.type, upsert: true })

    if (upErr) { setError(upErr.message); setUploadId(null); return }

    const { data: urlData } = supabase.storage.from('profile-avatars').getPublicUrl(path)
    const photoUrl = urlData.publicUrl

    const { data: updated, error: dbErr } = await supabase.from('courts')
      .update({ photo_url: photoUrl }).eq('id', courtId).select().single()

    if (dbErr) setError(dbErr.message)
    else { setCourts((c) => c.map((x) => (x.id === updated.id ? updated : x))); flash('Foto actualizada.') }
    setUploadId(null)
  }

  // ── Reservation update ──────────────────────────────────────────────────────
  const updateReservation = async (resId, fields) => {
    setIsSaving(true)
    const { data, error: e } = await supabase.from('court_reservations')
      .update(fields).eq('id', resId).select('*, courts(name)').single()
    if (e) setError(e.message)
    else { setRes((r) => r.map((x) => (x.id === data.id ? data : x))); flash('Reservación actualizada.') }
    setIsSaving(false)
  }

  const kpis = {
    total:       courts.length,
    active:      courts.filter((c) => c.status === 'active').length,
    maintenance: courts.filter((c) => c.status === 'maintenance').length,
    inactive:    courts.filter((c) => c.status === 'inactive').length,
  }
  const filteredRes = reservations.filter((r) => resFilter === 'all' || r.status === resFilter)

  if (isClubLoading) return <p className="text-sm text-open-muted">Cargando club...</p>
  if (!clubId) return (
    <p className="border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
      No se encontró un club asociado a este manager.
    </p>
  )

  return (
    <section className="grid gap-6">
      {/* Hidden photo file input */}
      <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFile} />

      {/* Header */}
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-open-muted transition hover:text-open-ink">
            <ArrowLeft size={13} strokeWidth={2} />Dashboard
          </Link>
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">{club?.name || 'Club'}</p>
          <h1 className="mt-2 text-3xl font-semibold text-open-ink md:text-5xl">Canchas</h1>
        </div>
        <button type="button" onClick={() => { setShowForm((v) => !v); setError('') }}
          className="inline-flex h-11 items-center gap-2 bg-open-primary px-4 text-sm font-semibold text-white transition hover:opacity-90">
          <Plus size={16} strokeWidth={1.8} />
          {showForm ? 'Cancelar' : 'Nueva cancha'}
        </button>
      </div>

      {error   && <p className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {message && <p className="border border-open-light bg-open-surface px-4 py-3 text-sm font-semibold text-open-ink">{message}</p>}

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard label="Total"         value={kpis.total} />
        <KpiCard label="Disponibles"   value={kpis.active}      accent="primary" />
        <KpiCard label="Mantenimiento" value={kpis.maintenance} accent={kpis.maintenance > 0 ? 'warn' : undefined} />
        <KpiCard label="Inactivas"     value={kpis.inactive} />
      </div>

      {/* Nueva cancha form */}
      {showForm && (
        <article className="grid gap-4 border border-open-light bg-open-surface p-5">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-open-muted">Nueva cancha</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre">
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Cancha Central" className={inputCls} />
            </Field>
            <Field label="Superficie">
              <select value={form.surface} onChange={(e) => setForm((f) => ({ ...f, surface: e.target.value }))} className={inputCls}>
                {SURFACES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold text-open-ink">
            <input type="checkbox" checked={form.isIndoor} onChange={(e) => setForm((f) => ({ ...f, isIndoor: e.target.checked }))} className="h-4 w-4 accent-black" />
            Cancha techada (Indoor)
          </label>
          <Field label="Dirección (opcional)">
            <input type="text" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Ej: Av. Insurgentes Sur 1234" className={inputCls} />
          </Field>
          <Field label="Notas (opcional)">
            <input type="text" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Ej: Iluminación LED" className={inputCls} />
          </Field>
          <button type="button" onClick={handleCreate} disabled={isSaving}
            className="h-11 justify-self-start bg-open-primary px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
            {isSaving ? 'Creando...' : 'Crear cancha'}
          </button>
        </article>
      )}

      {/* ── Court ID Cards ── */}
      <div className="grid gap-4">
        {courts.map((court) => (
          <div key={court.id}>
            {/* ── Card ── */}
            <article
              className="relative overflow-hidden border border-black/20"
              style={{ minHeight: 300, backgroundColor: SURFACE_BG[court.surface] || '#0D0D0F' }}
            >
              {/* Background photo */}
              {court.photo_url && (
                <img
                  src={court.photo_url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}

              {/* Gradient overlay — darkens bottom for text readability */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />

              {/* Status badge — top right */}
              <div className="absolute right-3 top-3 z-20">
                <span className={`border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${STATUS_STYLES[court.status] || STATUS_STYLES.inactive}`}>
                  {STATUSES.find((s) => s.value === court.status)?.label}
                </span>
              </div>

              {/* Photo upload button — top left */}
              <button
                type="button"
                onClick={() => triggerPhotoUpload(court.id)}
                disabled={uploadingId === court.id}
                className="absolute left-3 top-3 z-20 grid h-8 w-8 place-items-center border border-white/20 bg-black/40 text-white/70 backdrop-blur-sm transition hover:border-white/60 hover:text-white disabled:opacity-50"
                title="Subir foto"
              >
                {uploadingId === court.id
                  ? <span className="text-[9px] font-bold">...</span>
                  : <Camera size={14} strokeWidth={1.8} />}
              </button>

              {/* Content — bottom */}
              <div className="relative z-10 flex flex-col justify-end px-6 pb-6 pt-24">
                {/* Tags */}
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <CourtTag>{SURFACE_LABELS[court.surface]}</CourtTag>
                  <CourtTag>{court.is_indoor ? 'Indoor' : 'Outdoor'}</CourtTag>
                  <CourtTag>{(court.open_time || '07:00').slice(0,5)}–{(court.close_time || '22:00').slice(0,5)}</CourtTag>
                </div>

                {/* Name */}
                <h2 className="text-3xl font-black leading-tight tracking-tight text-white md:text-4xl">
                  {court.name}
                </h2>

                {/* Price + features */}
                <p className="mt-1.5 text-sm text-white/60">
                  {court.price_per_hour > 0 ? `$${Number(court.price_per_hour).toFixed(0)}/hr` : 'Gratis'}
                  {court.auto_confirm ? ' · Conf. automática' : ' · Conf. manual'}
                  {court.requires_payment ? ' · Requiere pago' : ''}
                </p>

                {court.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(court.address)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs text-white/50 transition hover:text-white/80"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MapPinIcon size={11} strokeWidth={2} />
                    {court.address}
                  </a>
                )}
              </div>
            </article>

            {/* Action bar below card */}
            <div className="flex border border-t-0 border-open-light bg-open-surface">
              <button
                type="button"
                onClick={() => openEdit(court)}
                className="flex-1 py-2.5 text-xs font-semibold text-open-muted transition hover:bg-open-bg hover:text-open-ink"
              >
                {expandedId === court.id ? 'Cerrar' : 'Configurar'}
              </button>
              <div className="w-px bg-open-light" />
              <button
                type="button"
                onClick={() => handleDelete(court.id)}
                className="px-4 py-2.5 text-xs font-semibold text-open-muted transition hover:bg-red-50 hover:text-red-500"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>

            {/* ── Edit panel ── */}
            {expandedId === court.id && (
              <div className="border border-t-0 border-open-light bg-open-bg">
                {/* Tabs */}
                <div className="flex border-b border-open-light">
                  {[['info','Info'], ['precios','Precios y horario']].map(([t, label]) => (
                    <button key={t} type="button" onClick={() => setEditTab(t)}
                      className={`h-10 px-4 text-xs font-semibold transition ${editTab === t ? 'border-b-2 border-open-ink text-open-ink' : 'text-open-muted hover:text-open-ink'}`}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Info tab */}
                {editTab === 'info' && (
                  <div className="grid gap-3 p-4 sm:grid-cols-[160px_1fr_1fr_auto]">
                    <Field label="Estado">
                      <select value={editInfo.status} onChange={(e) => setEditInfo((s) => ({ ...s, status: e.target.value }))} className={inputCls}>
                        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Dirección">
                      <input type="text" value={editInfo.address} onChange={(e) => setEditInfo((s) => ({ ...s, address: e.target.value }))}
                        placeholder="Dirección..." className={inputCls} />
                    </Field>
                    <Field label="Notas">
                      <input type="text" value={editInfo.notes} onChange={(e) => setEditInfo((s) => ({ ...s, notes: e.target.value }))}
                        placeholder="Observaciones..." className={inputCls} />
                    </Field>
                    <button type="button" disabled={isSaving} onClick={() => handleSaveInfo(court.id)}
                      className="h-10 self-end bg-open-ink px-4 text-sm font-semibold text-white disabled:opacity-50">
                      {isSaving ? '...' : 'Guardar'}
                    </button>
                  </div>
                )}

                {/* Pricing tab */}
                {editTab === 'precios' && (
                  <div className="grid gap-5 p-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Field label="Precio/hora ($)">
                        <input type="number" min="0" step="0.50" value={editPricing.pricePerHour}
                          onChange={(e) => setEditPricing((p) => ({ ...p, pricePerHour: e.target.value }))} className={inputCls} />
                      </Field>
                      <Field label="Precio pico/hora ($)">
                        <input type="number" min="0" step="0.50" value={editPricing.peakPrice} placeholder="Mismo si vacío"
                          onChange={(e) => setEditPricing((p) => ({ ...p, peakPrice: e.target.value }))} className={inputCls} />
                      </Field>
                      <Field label="Inicio hora pico">
                        <input type="time" value={editPricing.peakStart}
                          onChange={(e) => setEditPricing((p) => ({ ...p, peakStart: e.target.value }))} className={inputCls} />
                      </Field>
                      <Field label="Fin hora pico">
                        <input type="time" value={editPricing.peakEnd}
                          onChange={(e) => setEditPricing((p) => ({ ...p, peakEnd: e.target.value }))} className={inputCls} />
                      </Field>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Hora apertura">
                        <input type="time" value={editPricing.openTime}
                          onChange={(e) => setEditPricing((p) => ({ ...p, openTime: e.target.value }))} className={inputCls} />
                      </Field>
                      <Field label="Hora cierre">
                        <input type="time" value={editPricing.closeTime}
                          onChange={(e) => setEditPricing((p) => ({ ...p, closeTime: e.target.value }))} className={inputCls} />
                      </Field>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-open-muted">Días cerrados</p>
                      <div className="flex flex-wrap gap-2">
                        {DAYS.map((day, idx) => {
                          const isClosed = editPricing.closedDays.includes(idx)
                          return (
                            <button key={idx} type="button"
                              onClick={() => setEditPricing((p) => ({
                                ...p,
                                closedDays: isClosed ? p.closedDays.filter((d) => d !== idx) : [...p.closedDays, idx],
                              }))}
                              className={`h-9 w-12 border text-xs font-semibold transition ${isClosed ? 'border-open-ink bg-open-ink text-white' : 'border-open-light bg-open-surface text-open-muted hover:border-open-ink'}`}>
                              {day}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-sm font-semibold text-open-ink">
                        <input type="checkbox" checked={editPricing.requiresPayment}
                          onChange={(e) => setEditPricing((p) => ({ ...p, requiresPayment: e.target.checked }))}
                          className="h-4 w-4 accent-black" />
                        Requiere pago para confirmar
                      </label>
                      <label className="flex items-center gap-2 text-sm font-semibold text-open-ink">
                        <input type="checkbox" checked={editPricing.autoConfirm}
                          onChange={(e) => setEditPricing((p) => ({ ...p, autoConfirm: e.target.checked }))}
                          className="h-4 w-4 accent-black" />
                        Confirmar reservaciones automáticamente
                      </label>
                    </div>
                    <button type="button" disabled={isSaving} onClick={() => handleSavePricing(court.id)}
                      className="h-10 justify-self-start bg-open-ink px-5 text-sm font-semibold text-white disabled:opacity-50">
                      {isSaving ? 'Guardando...' : 'Guardar configuración'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {!isLoading && courts.length === 0 && (
          <p className="col-span-full border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
            No hay canchas. Crea la primera con el botón de arriba.
          </p>
        )}
      </div>

      {isLoading && <p className="text-sm text-open-muted">Cargando...</p>}

      {/* ── Reservaciones ── */}
      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-open-muted">Reservaciones</h2>
          <div className="flex gap-1 border border-open-light bg-open-bg p-1">
            {[['all','Todas'],['pending','Pendientes'],['confirmed','Confirmadas'],['cancelled','Canceladas']].map(([v,l]) => (
              <button key={v} type="button" onClick={() => setResFilter(v)}
                className={`h-8 px-3 text-xs font-semibold transition ${resFilter === v ? 'bg-open-ink text-white' : 'text-open-muted hover:text-open-ink'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          {filteredRes.map((res) => (
            <ReservationRow key={res.id} res={res} courts={courts} isSaving={isSaving} onUpdate={updateReservation} />
          ))}
          {filteredRes.length === 0 && (
            <p className="border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">Sin reservaciones.</p>
          )}
        </div>
      </section>
    </section>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CourtTag({ children }) {
  return (
    <span className="border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white/80 backdrop-blur-sm">
      {children}
    </span>
  )
}

function ReservationRow({ res, courts, isSaving, onUpdate }) {
  const court = courts.find((c) => c.id === res.court_id)
  const isPaid = res.payment_status === 'paid'
  const isCancelled = res.status === 'cancelled'
  const isConfirmed = res.status === 'confirmed'

  return (
    <article className="grid gap-3 border border-open-light bg-open-surface px-4 py-3 sm:grid-cols-[1fr_auto]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-open-ink">
            {court?.name || res.courts?.name || 'Cancha'} · {res.reservation_date}
          </p>
          <span className={`border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${RES_STATUS_STYLES[res.status] || ''}`}>
            {RES_STATUS_LABELS[res.status]}
          </span>
          {res.total_price > 0 && (
            <span className={`border px-1.5 py-0.5 text-[10px] font-semibold ${isPaid ? 'border-open-primary text-open-primary' : 'border-yellow-400 text-yellow-600'}`}>
              {PAY_STATUS_LABELS[res.payment_status]}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-open-muted">
          {res.start_time?.slice(0, 5)} – {res.end_time?.slice(0, 5)} ·{' '}
          {res.total_price > 0 ? `$${Number(res.total_price).toFixed(2)}` : 'Gratis'}
          {res.notes ? ` · "${res.notes}"` : ''}
        </p>
      </div>
      {!isCancelled && (
        <div className="flex flex-wrap gap-2">
          {!isConfirmed && (
            <button type="button" disabled={isSaving} onClick={() => onUpdate(res.id, { status: 'confirmed' })}
              className="inline-flex h-8 items-center gap-1 bg-open-ink px-2.5 text-xs font-semibold text-white disabled:opacity-50">
              <Check size={12} strokeWidth={2} />Confirmar
            </button>
          )}
          {res.total_price > 0 && !isPaid && (
            <button type="button" disabled={isSaving} onClick={() => onUpdate(res.id, { payment_status: 'paid' })}
              className="h-8 border border-open-primary px-2.5 text-xs font-semibold text-open-primary disabled:opacity-50">
              Pagado
            </button>
          )}
          <button type="button" disabled={isSaving} onClick={() => onUpdate(res.id, { status: 'cancelled' })}
            className="h-8 border border-open-light px-2.5 text-xs font-semibold text-open-muted disabled:opacity-50">
            Cancelar
          </button>
        </div>
      )}
    </article>
  )
}

function Field({ label, children }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-[0.12em] text-open-muted">{label}</label>
      {children}
    </div>
  )
}

function KpiCard({ label, value, accent }) {
  const border = accent === 'primary' ? 'border-open-primary' : accent === 'warn' ? 'border-yellow-400' : 'border-open-light'
  return (
    <article className={`border bg-open-surface p-5 ${border}`}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-open-muted">{label}</p>
      <p className="mt-3 text-4xl font-black text-open-ink">{value}</p>
    </article>
  )
}

const inputCls = 'h-10 w-full border border-open-light bg-open-surface px-3 text-sm text-open-ink outline-none focus:border-open-primary'

export default CanchasView
