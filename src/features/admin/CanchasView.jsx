import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, MapPin as MapPinIcon, Plus, X } from 'lucide-react'
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

function createEmptyForm() {
  return { name: '', surface: 'clay', isIndoor: false, notes: '', address: '' }
}

function CanchasView() {
  const { club, clubId, isLoading: isClubLoading } = useManagerClub()
  const [courts, setCourts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(createEmptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    if (!clubId) return
    setIsLoading(true)
    const { data, error: loadError } = await supabase
      .from('courts')
      .select('*')
      .eq('club_id', clubId)
      .order('name', { ascending: true })

    if (loadError) setError(loadError.message)
    else setCourts(data || [])
    setIsLoading(false)
  }

  useEffect(() => { load() }, [clubId])

  const handleCreate = async () => {
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return }
    setIsSaving(true)
    setError('')

    const { data, error: insertError } = await supabase
      .from('courts')
      .insert({
        club_id: clubId,
        name: form.name.trim(),
        surface: form.surface,
        is_indoor: form.isIndoor,
        notes: form.notes.trim() || null,
        address: form.address.trim() || null,
        status: 'active',
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
    } else {
      setCourts((curr) => [...curr, data].sort((a, b) => a.name.localeCompare(b.name)))
      setForm(createEmptyForm())
      setShowForm(false)
      setMessage('Cancha creada.')
      setTimeout(() => setMessage(''), 2500)
    }
    setIsSaving(false)
  }

  const handleStatusUpdate = async (courtId) => {
    setIsSaving(true)
    const { data, error: updateError } = await supabase
      .from('courts')
      .update({ status: editStatus, notes: editNotes || null, address: editAddress.trim() || null })
      .eq('id', courtId)
      .select()
      .single()

    if (updateError) {
      setError(updateError.message)
    } else {
      setCourts((curr) => curr.map((c) => (c.id === data.id ? data : c)))
      setEditingId(null)
      setMessage('Cancha actualizada.')
      setTimeout(() => setMessage(''), 2500)
    }
    setIsSaving(false)
  }

  const handleDelete = async (courtId) => {
    if (!window.confirm('¿Eliminar esta cancha?')) return
    const { error: deleteError } = await supabase.from('courts').delete().eq('id', courtId)
    if (deleteError) { setError(deleteError.message); return }
    setCourts((curr) => curr.filter((c) => c.id !== courtId))
    setMessage('Cancha eliminada.')
    setTimeout(() => setMessage(''), 2500)
  }

  const kpis = {
    total: courts.length,
    active: courts.filter((c) => c.status === 'active').length,
    maintenance: courts.filter((c) => c.status === 'maintenance').length,
    inactive: courts.filter((c) => c.status === 'inactive').length,
  }

  if (isClubLoading) return <p className="text-sm text-open-muted">Cargando club...</p>

  if (!clubId) {
    return (
      <p className="border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
        No se encontró un club asociado a este manager.
      </p>
    )
  }

  return (
    <section className="grid gap-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-open-muted transition hover:text-open-ink"
          >
            <ArrowLeft size={13} strokeWidth={2} />
            Dashboard
          </Link>
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
            {club?.name || 'Club'}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-open-ink md:text-5xl">
            Canchas
          </h1>
        </div>
        <button
          type="button"
          onClick={() => { setShowForm((v) => !v); setError('') }}
          className="inline-flex h-11 items-center gap-2 bg-open-primary px-4 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Plus size={16} strokeWidth={1.8} />
          {showForm ? 'Cancelar' : 'Nueva cancha'}
        </button>
      </div>

      {error && (
        <p className="border border-open-light bg-open-surface px-4 py-3 text-sm text-open-muted">
          {error}
        </p>
      )}
      {message && (
        <p className="border border-open-light bg-open-surface px-4 py-3 text-sm font-semibold text-open-ink">
          {message}
        </p>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        <KpiCard label="Total canchas" value={kpis.total} />
        <KpiCard label="Disponibles" value={kpis.active} accent="primary" />
        <KpiCard label="Mantenimiento" value={kpis.maintenance} accent={kpis.maintenance > 0 ? 'warn' : undefined} />
        <KpiCard label="Inactivas" value={kpis.inactive} />
      </div>

      {/* Formulario nueva cancha */}
      {showForm && (
        <article className="grid gap-4 border border-open-light bg-open-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-open-muted">
            Nueva cancha
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-open-muted">
                Nombre
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej: Cancha Central"
                className="h-11 border border-open-light bg-open-bg px-3 text-sm text-open-ink outline-none focus:border-open-primary"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-open-muted">
                Superficie
              </label>
              <select
                value={form.surface}
                onChange={(e) => setForm((f) => ({ ...f, surface: e.target.value }))}
                className="h-11 border border-open-light bg-open-bg px-3 text-sm text-open-ink outline-none focus:border-open-primary"
              >
                {SURFACES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-3 text-sm font-semibold text-open-ink">
            <input
              type="checkbox"
              checked={form.isIndoor}
              onChange={(e) => setForm((f) => ({ ...f, isIndoor: e.target.checked }))}
              className="h-4 w-4 accent-black"
            />
            Cancha techada (Indoor)
          </label>
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-open-muted">
              Dirección (opcional)
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Ej: Av. Insurgentes Sur 1234, CDMX"
              className="h-11 border border-open-light bg-open-bg px-3 text-sm text-open-ink outline-none focus:border-open-primary"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-open-muted">
              Notas (opcional)
            </label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Ej: Iluminación LED, acceso desde entrada norte"
              className="h-11 border border-open-light bg-open-bg px-3 text-sm text-open-ink outline-none focus:border-open-primary"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSaving}
            className="h-11 justify-self-start bg-open-primary px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? 'Creando...' : 'Crear cancha'}
          </button>
        </article>
      )}

      {/* Lista de canchas */}
      <div className="grid gap-3">
        {courts.map((court) => (
          <article
            key={court.id}
            className="border border-open-light bg-open-surface"
          >
            {/* Row principal */}
            <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-open-ink">{court.name}</h2>
                  <span
                    className={[
                      'border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]',
                      STATUS_STYLES[court.status] || STATUS_STYLES.inactive,
                    ].join(' ')}
                  >
                    {STATUSES.find((s) => s.value === court.status)?.label || court.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-open-muted">
                  {SURFACE_LABELS[court.surface] || court.surface} ·{' '}
                  {court.is_indoor ? 'Indoor' : 'Outdoor'}
                  {court.notes ? ` · ${court.notes}` : ''}
                </p>
                {court.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(court.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-open-primary transition hover:opacity-70"
                  >
                    <MapPinIcon size={12} strokeWidth={2} />
                    {court.address}
                  </a>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (editingId === court.id) { setEditingId(null); return }
                    setEditingId(court.id)
                    setEditStatus(court.status)
                    setEditNotes(court.notes || '')
                    setEditAddress(court.address || '')
                  }}
                  className="h-9 border border-open-light bg-open-bg px-3 text-xs font-semibold text-open-ink transition hover:border-open-primary"
                >
                  {editingId === court.id ? 'Cancelar' : 'Editar'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(court.id)}
                  className="grid h-9 w-9 place-items-center border border-open-light bg-open-bg text-open-muted transition hover:border-red-400 hover:text-red-500"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Panel de edición inline */}
            {editingId === court.id && (
              <div className="grid gap-3 border-t border-open-light bg-open-bg px-5 py-4 sm:grid-cols-[160px_1fr_1fr_auto]">
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-open-muted">
                    Estado
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="h-10 border border-open-light bg-open-surface px-3 text-sm text-open-ink outline-none focus:border-open-primary"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-open-muted">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Ej: Av. Insurgentes Sur 1234, CDMX"
                    className="h-10 border border-open-light bg-open-surface px-3 text-sm text-open-ink outline-none focus:border-open-primary"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.12em] text-open-muted">
                    Notas
                  </label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Observaciones..."
                    className="h-10 border border-open-light bg-open-surface px-3 text-sm text-open-ink outline-none focus:border-open-primary"
                  />
                </div>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleStatusUpdate(court.id)}
                  className="h-10 self-end bg-open-ink px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            )}
          </article>
        ))}

        {!isLoading && courts.length === 0 && (
          <p className="border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
            No hay canchas registradas. Crea la primera con el botón de arriba.
          </p>
        )}
      </div>

      {isLoading && <p className="text-sm text-open-muted">Cargando canchas...</p>}
    </section>
  )
}

function KpiCard({ label, value, accent }) {
  const border =
    accent === 'primary' ? 'border-open-primary' :
    accent === 'warn' ? 'border-yellow-400' :
    'border-open-light'
  return (
    <article className={`border bg-open-surface p-5 ${border}`}>
      <p className="text-sm font-semibold text-open-muted">{label}</p>
      <p className="mt-4 text-4xl font-semibold text-open-ink">{value}</p>
    </article>
  )
}

export default CanchasView
