import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, MapPin as MapPinIcon, Plus, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import useManagerClub from '../../hooks/useManagerClub'

const SURFACES = [
  { value: 'clay', label: 'Arcilla (Clay)' },
  { value: 'hard', label: 'Dura (Hard)' },
  { value: 'grass', label: 'Pasto (Grass)' },
  { value: 'artificial', label: 'Artificial' },
]
const STATUSES = [
  { value: 'active', label: 'Disponible' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'inactive', label: 'Inactiva' },
]
const STATUS_STYLES = {
  active: 'border-open-primary text-open-primary',
  maintenance: 'border-yellow-400 text-yellow-600',
  inactive: 'border-open-light text-open-muted',
}
const SURFACE_LABELS = { clay: 'Arcilla', hard: 'Dura', grass: 'Pasto', artificial: 'Artificial' }
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const RES_STATUS_LABELS = { pending: 'Pendiente', confirmed: 'Confirmada', cancelled: 'Cancelada' }
const PAY_STATUS_LABELS = { free: 'Gratis', pending: 'Pago pendiente', paid: 'Pagado' }
const RES_STATUS_STYLES = {
  pending: 'border-yellow-400 text-yellow-600',
  confirmed: 'border-open-primary text-open-primary',
  cancelled: 'border-open-light text-open-muted',
}

function createEmptyForm() {
  return { name: '', surface: 'clay', isIndoor: false, notes: '', address: '' }
}
function createEmptyPricing(court = {}) {
  return {
    pricePerHour: court.price_per_hour ?? 0,
    peakPrice: court.peak_price_per_hour ?? '',
    peakStart: court.peak_start ?? '',
    peakEnd: court.peak_end ?? '',
    requiresPayment: court.requires_payment ?? false,
    autoConfirm: court.auto_confirm ?? true,
    openTime: court.open_time ?? '07:00',
    closeTime: court.close_time ?? '22:00',
    closedDays: court.closed_days ?? [],
  }
}

function CanchasView() {
  const { club, clubId, isLoading: isClubLoading } = useManagerClub()
  const [courts, setCourts] = useState([])
  const [reservations, setReservations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(createEmptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [editTab, setEditTab] = useState('info')
  const [editInfo, setEditInfo] = useState({ status: '', notes: '', address: '' })
  const [editPricing, setEditPricing] = useState(createEmptyPricing())
  const [resFilter, setResFilter] = useState('all')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    if (!clubId) return
    setIsLoading(true)
    const [courtsRes, resRes] = await Promise.all([
      supabase.from('courts').select('*').eq('club_id', clubId).order('name'),
      supabase
        .from('court_reservations')
        .select('*, courts(name)')
        .eq('club_id', clubId)
        .order('reservation_date', { ascending: false })
        .limit(100),
    ])
    if (courtsRes.error) setError(courtsRes.error.message)
    else setCourts(courtsRes.data || [])
    setReservations(resRes.data || [])
    setIsLoading(false)
  }

  useEffect(() => { load() }, [clubId])

  const flash = (msg) => { setMessage(msg); setTimeout(() => setMessage(''), 2500) }

  const handleCreate = async () => {
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return }
    setIsSaving(true); setError('')
    const { data, error: e } = await supabase
      .from('courts')
      .insert({
        club_id: clubId, name: form.name.trim(), surface: form.surface,
        is_indoor: form.isIndoor, notes: form.notes.trim() || null,
        address: form.address.trim() || null, status: 'active',
      })
      .select().single()
    if (e) setError(e.message)
    else { setCourts((c) => [...c, data].sort((a, b) => a.name.localeCompare(b.name))); setForm(createEmptyForm()); setShowForm(false); flash('Cancha creada.') }
    setIsSaving(false)
  }

  const openEdit = (court) => {
    if (expandedId === court.id) { setExpandedId(null); return }
    setExpandedId(court.id)
    setEditTab('info')
    setEditInfo({ status: court.status, notes: court.notes || '', address: court.address || '' })
    setEditPricing(createEmptyPricing(court))
  }

  const handleSaveInfo = async (courtId) => {
    setIsSaving(true)
    const { data, error: e } = await supabase
      .from('courts').update({ status: editInfo.status, notes: editInfo.notes || null, address: editInfo.address.trim() || null })
      .eq('id', courtId).select().single()
    if (e) setError(e.message)
    else { setCourts((c) => c.map((x) => (x.id === data.id ? data : x))); setExpandedId(null); flash('Cancha actualizada.') }
    setIsSaving(false)
  }

  const handleSavePricing = async (courtId) => {
    setIsSaving(true)
    const { data, error: e } = await supabase
      .from('courts').update({
        price_per_hour: Number(editPricing.pricePerHour) || 0,
        peak_price_per_hour: editPricing.peakPrice !== '' ? Number(editPricing.peakPrice) : null,
        peak_start: editPricing.peakStart || null,
        peak_end: editPricing.peakEnd || null,
        requires_payment: editPricing.requiresPayment,
        auto_confirm: editPricing.autoConfirm,
        open_time: editPricing.openTime || '07:00',
        close_time: editPricing.closeTime || '22:00',
        closed_days: editPricing.closedDays,
      })
      .eq('id', courtId).select().single()
    if (e) setError(e.message)
    else { setCourts((c) => c.map((x) => (x.id === data.id ? data : x))); setExpandedId(null); flash('Configuración guardada.') }
    setIsSaving(false)
  }

  const handleDelete = async (courtId) => {
    if (!window.confirm('¿Eliminar esta cancha y todas sus reservaciones?')) return
    const { error: e } = await supabase.from('courts').delete().eq('id', courtId)
    if (e) { setError(e.message); return }
    setCourts((c) => c.filter((x) => x.id !== courtId))
    setReservations((r) => r.filter((x) => x.court_id !== courtId))
    flash('Cancha eliminada.')
  }

  const updateReservation = async (resId, fields) => {
    setIsSaving(true)
    const { data, error: e } = await supabase
      .from('court_reservations').update(fields).eq('id', resId).select('*, courts(name)').single()
    if (e) setError(e.message)
    else { setReservations((r) => r.map((x) => (x.id === data.id ? data : x))); flash('Reservación actualizada.') }
    setIsSaving(false)
  }

  const kpis = {
    total: courts.length,
    active: courts.filter((c) => c.status === 'active').length,
    maintenance: courts.filter((c) => c.status === 'maintenance').length,
    inactive: courts.filter((c) => c.status === 'inactive').length,
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

      {error && <p className="border border-open-light bg-open-surface px-4 py-3 text-sm text-open-muted">{error}</p>}
      {message && <p className="border border-open-light bg-open-surface px-4 py-3 text-sm font-semibold text-open-ink">{message}</p>}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        <KpiCard label="Total" value={kpis.total} />
        <KpiCard label="Disponibles" value={kpis.active} accent="primary" />
        <KpiCard label="Mantenimiento" value={kpis.maintenance} accent={kpis.maintenance > 0 ? 'warn' : undefined} />
        <KpiCard label="Inactivas" value={kpis.inactive} />
      </div>

      {/* Formulario nueva cancha */}
      {showForm && (
        <article className="grid gap-4 border border-open-light bg-open-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-open-muted">Nueva cancha</h2>
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
              placeholder="Ej: Av. Insurgentes Sur 1234, CDMX" className={inputCls} />
          </Field>
          <Field label="Notas (opcional)">
            <input type="text" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Ej: Iluminación LED, acceso norte" className={inputCls} />
          </Field>
          <button type="button" onClick={handleCreate} disabled={isSaving}
            className="h-11 justify-self-start bg-open-primary px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
            {isSaving ? 'Creando...' : 'Crear cancha'}
          </button>
        </article>
      )}

      {/* Lista de canchas */}
      <div className="grid gap-3">
        {courts.map((court) => (
          <article key={court.id} className="border border-open-light bg-open-surface">
            {/* Row principal */}
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-open-ink">{court.name}</h2>
                  <span className={`border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${STATUS_STYLES[court.status] || STATUS_STYLES.inactive}`}>
                    {STATUSES.find((s) => s.value === court.status)?.label}
                  </span>
                  {court.price_per_hour > 0 && (
                    <span className="border border-open-light px-1.5 py-0.5 text-[10px] font-semibold text-open-muted">
                      ${Number(court.price_per_hour).toFixed(0)}/hr
                    </span>
                  )}
                  {court.price_per_hour === 0 && !court.requires_payment && (
                    <span className="border border-open-light px-1.5 py-0.5 text-[10px] font-semibold text-open-muted">Gratis</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-open-muted">
                  {SURFACE_LABELS[court.surface]} · {court.is_indoor ? 'Indoor' : 'Outdoor'} ·{' '}
                  {court.open_time?.slice(0, 5) || '07:00'} – {court.close_time?.slice(0, 5) || '22:00'}
                  {court.notes ? ` · ${court.notes}` : ''}
                </p>
                {court.address && (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(court.address)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-open-primary transition hover:opacity-70">
                    <MapPinIcon size={12} strokeWidth={2} />{court.address}
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => openEdit(court)}
                  className="h-9 border border-open-light bg-open-bg px-3 text-xs font-semibold text-open-ink transition hover:border-open-primary">
                  {expandedId === court.id ? 'Cerrar' : 'Editar'}
                </button>
                <button type="button" onClick={() => handleDelete(court.id)}
                  className="grid h-9 w-9 place-items-center border border-open-light bg-open-bg text-open-muted transition hover:border-red-400 hover:text-red-500">
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Panel edición con tabs */}
            {expandedId === court.id && (
              <div className="border-t border-open-light bg-open-bg">
                {/* Tabs */}
                <div className="flex border-b border-open-light">
                  {[['info', 'Info'], ['precios', 'Precios y horario']].map(([t, label]) => (
                    <button key={t} type="button" onClick={() => setEditTab(t)}
                      className={`h-10 px-4 text-xs font-semibold transition ${editTab === t ? 'border-b-2 border-open-ink text-open-ink' : 'text-open-muted hover:text-open-ink'}`}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Tab Info */}
                {editTab === 'info' && (
                  <div className="grid gap-3 p-5 sm:grid-cols-[160px_1fr_1fr_auto]">
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

                {/* Tab Precios y horario */}
                {editTab === 'precios' && (
                  <div className="grid gap-5 p-5">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Field label="Precio/hora ($)">
                        <input type="number" min="0" step="0.50" value={editPricing.pricePerHour}
                          onChange={(e) => setEditPricing((p) => ({ ...p, pricePerHour: e.target.value }))} className={inputCls} />
                      </Field>
                      <Field label="Precio pico/hora ($)">
                        <input type="number" min="0" step="0.50" value={editPricing.peakPrice}
                          placeholder="Mismo si vacío"
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
          </article>
        ))}

        {!isLoading && courts.length === 0 && (
          <p className="border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
            No hay canchas. Crea la primera con el botón de arriba.
          </p>
        )}
      </div>

      {isLoading && <p className="text-sm text-open-muted">Cargando...</p>}

      {/* ── Reservaciones ── */}
      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-open-muted">Reservaciones</h2>
          <div className="flex gap-1 border border-open-light bg-open-bg p-1">
            {[['all', 'Todas'], ['pending', 'Pendientes'], ['confirmed', 'Confirmadas'], ['cancelled', 'Canceladas']].map(([v, l]) => (
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
            <p className="border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
              Sin reservaciones.
            </p>
          )}
        </div>
      </section>
    </section>
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
          {res.player_id}
          {res.total_price > 0 ? ` · $${Number(res.total_price).toFixed(2)}` : ' · Gratis'}
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
              Marcar pagado
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
      <p className="text-sm font-semibold text-open-muted">{label}</p>
      <p className="mt-4 text-4xl font-semibold text-open-ink">{value}</p>
    </article>
  )
}

const inputCls = 'h-10 w-full border border-open-light bg-open-surface px-3 text-sm text-open-ink outline-none focus:border-open-primary'

export default CanchasView
