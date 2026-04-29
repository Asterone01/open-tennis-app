import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import usePlayerProfile from '../profile/usePlayerProfile'
import useManagerClub from '../../hooks/useManagerClub'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const SURFACE_LABELS = { clay: 'Arcilla', hard: 'Dura', grass: 'Césped', carpet: 'Moqueta' }

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

function minutesToTime(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function buildSlots(court) {
  const open = timeToMinutes(court.open_time || '07:00')
  const close = timeToMinutes(court.close_time || '22:00')
  const slots = []
  for (let t = open; t + 60 <= close; t += 60) {
    slots.push({ start: minutesToTime(t), end: minutesToTime(t + 60) })
  }
  return slots
}

function calcPrice(court, startTime) {
  const base = Number(court.price_per_hour) || 0
  if (!court.peak_price_per_hour || !court.peak_start || !court.peak_end) return base
  const slotMins = timeToMinutes(startTime)
  const peakStart = timeToMinutes(court.peak_start)
  const peakEnd = timeToMinutes(court.peak_end)
  if (slotMins >= peakStart && slotMins < peakEnd) {
    return Number(court.peak_price_per_hour)
  }
  return base
}

function isPeakSlot(court, startTime) {
  if (!court.peak_start || !court.peak_end) return false
  const slotMins = timeToMinutes(startTime)
  const peakStart = timeToMinutes(court.peak_start)
  const peakEnd = timeToMinutes(court.peak_end)
  return slotMins >= peakStart && slotMins < peakEnd
}

export default function CourtReservationsView() {
  const { profile } = usePlayerProfile()
  const { clubId: managerClubId } = useManagerClub()
  const effectiveClubId = profile.clubId || managerClubId

  const [courts, setCourts] = useState([])
  const [selectedCourt, setSelectedCourt] = useState(null)
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [takenSlots, setTakenSlots] = useState([])
  const [selectedSlots, setSelectedSlots] = useState([])
  const [notes, setNotes] = useState('')
  const [myReservations, setMyReservations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load courts for this club
  useEffect(() => {
    if (!effectiveClubId) return
    supabase
      .from('courts')
      .select('*')
      .eq('club_id', effectiveClubId)
      .eq('status', 'active')
      .order('name')
      .then(({ data }) => {
        setCourts(data || [])
        setIsLoading(false)
      })
  }, [effectiveClubId])

  // Load my reservations
  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id
      if (!uid) return
      const { data } = await supabase
        .from('court_reservations')
        .select('*, courts(name)')
        .eq('user_id', uid)
        .order('reservation_date', { ascending: false })
        .order('start_time', { ascending: true })
        .limit(30)
      setMyReservations(data || [])
    }
    load()
  }, [])

  // Load taken slots when court+date change
  useEffect(() => {
    if (!selectedCourt || !selectedDate) return
    setSelectedSlots([])
    supabase
      .from('court_reservations')
      .select('start_time, status')
      .eq('court_id', selectedCourt.id)
      .eq('reservation_date', selectedDate)
      .neq('status', 'cancelled')
      .then(({ data }) => setTakenSlots((data || []).map((r) => r.start_time.slice(0, 5))))
  }, [selectedCourt, selectedDate])

  const dayOfWeek = useMemo(() => {
    if (!selectedDate) return -1
    return new Date(selectedDate + 'T00:00:00').getDay()
  }, [selectedDate])

  const isCourtClosed = useMemo(() => {
    if (!selectedCourt) return false
    return (selectedCourt.closed_days || []).includes(dayOfWeek)
  }, [selectedCourt, dayOfWeek])

  const slots = useMemo(() => {
    if (!selectedCourt) return []
    return buildSlots(selectedCourt)
  }, [selectedCourt])

  const totalPrice = useMemo(() => {
    if (!selectedCourt) return 0
    return selectedSlots.reduce((sum, s) => sum + calcPrice(selectedCourt, s), 0)
  }, [selectedCourt, selectedSlots])

  const toggleSlot = (startTime) => {
    setSelectedSlots((prev) =>
      prev.includes(startTime) ? prev.filter((s) => s !== startTime) : [...prev, startTime],
    )
  }

  const handleBook = async () => {
    if (!selectedCourt || selectedSlots.length === 0) return
    setIsSaving(true)
    setError('')
    setSuccess('')

    const { data: userData } = await supabase.auth.getUser()
    const uid = userData.user?.id

    const rows = selectedSlots.map((start) => {
      const startMins = timeToMinutes(start)
      const end = minutesToTime(startMins + 60)
      const price = calcPrice(selectedCourt, start)
      return {
        court_id: selectedCourt.id,
        club_id: effectiveClubId,
        player_id: profile.playerId || uid,
        user_id: uid,
        reservation_date: selectedDate,
        start_time: start,
        end_time: end,
        duration_hours: 1,
        total_price: price,
        status: selectedCourt.auto_confirm ? 'confirmed' : 'pending',
        payment_status: price === 0 || !selectedCourt.requires_payment ? 'free' : 'pending',
        notes: notes.trim() || null,
      }
    })

    const { error: insertError } = await supabase.from('court_reservations').insert(rows)

    if (insertError) {
      if (insertError.code === '23505') {
        setError('Uno o más horarios ya están ocupados. Recarga y vuelve a intentar.')
      } else {
        setError(insertError.message)
      }
    } else {
      const label = selectedCourt.auto_confirm ? 'confirmada' : 'pendiente de confirmación'
      setSuccess(
        `Reserva ${label} — ${selectedSlots.length} hora${selectedSlots.length > 1 ? 's' : ''} el ${formatDate(selectedDate)}.`,
      )
      setSelectedSlots([])
      setNotes('')
      // Refresh taken slots
      const { data } = await supabase
        .from('court_reservations')
        .select('start_time')
        .eq('court_id', selectedCourt.id)
        .eq('reservation_date', selectedDate)
        .neq('status', 'cancelled')
      setTakenSlots((data || []).map((r) => r.start_time.slice(0, 5)))
      // Refresh my reservations
      const { data: mine } = await supabase
        .from('court_reservations')
        .select('*, courts(name)')
        .eq('user_id', uid)
        .order('reservation_date', { ascending: false })
        .order('start_time', { ascending: true })
        .limit(30)
      setMyReservations(mine || [])
    }
    setIsSaving(false)
  }

  const handleCancel = async (resId) => {
    await supabase
      .from('court_reservations')
      .update({ status: 'cancelled' })
      .eq('id', resId)
    setMyReservations((prev) =>
      prev.map((r) => (r.id === resId ? { ...r, status: 'cancelled' } : r)),
    )
    if (selectedCourt) {
      setTakenSlots((prev) =>
        prev.filter((s) => {
          const res = myReservations.find((r) => r.id === resId)
          return res ? s !== res.start_time.slice(0, 5) : true
        }),
      )
    }
  }

  if (!effectiveClubId) {
    return (
      <div className="grid place-items-center py-20 text-sm text-open-muted">
        Vincula tu cuenta a un club para reservar canchas.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid place-items-center py-20 text-sm text-open-muted">
        Cargando canchas…
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-bold text-open-ink">Reservar Cancha</h1>

      {/* Court selection */}
      {courts.length === 0 ? (
        <p className="text-sm text-open-muted">No hay canchas activas en tu club.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {courts.map((court) => (
            <CourtCard
              key={court.id}
              court={court}
              isSelected={selectedCourt?.id === court.id}
              onSelect={() => {
                setSelectedCourt(court)
                setSelectedSlots([])
                setError('')
                setSuccess('')
              }}
            />
          ))}
        </div>
      )}

      {/* Booking panel */}
      {selectedCourt && (
        <div className="border border-open-light bg-open-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-open-ink">{selectedCourt.name}</h2>
            <button
              type="button"
              onClick={() => {
                setSelectedCourt(null)
                setSelectedSlots([])
              }}
              className="text-open-muted hover:text-open-ink"
            >
              <X size={16} />
            </button>
          </div>

          {/* Date picker */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-open-muted">
              Fecha
            </p>
            <DateStrip
              selectedDate={selectedDate}
              onChange={(d) => {
                setSelectedDate(d)
                setSelectedSlots([])
                setError('')
                setSuccess('')
              }}
            />
          </div>

          {/* Slots */}
          {isCourtClosed ? (
            <p className="rounded border border-open-light bg-open-bg px-4 py-3 text-sm text-open-muted">
              La cancha está cerrada los {DAYS[dayOfWeek]}.
            </p>
          ) : (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-open-muted">
                Horarios disponibles
              </p>
              {slots.length === 0 ? (
                <p className="text-sm text-open-muted">Sin horarios configurados.</p>
              ) : (
                <div className="mb-4 flex flex-wrap gap-2">
                  {slots.map((slot) => {
                    const taken = takenSlots.includes(slot.start)
                    const picked = selectedSlots.includes(slot.start)
                    const peak = isPeakSlot(selectedCourt, slot.start)
                    const price = calcPrice(selectedCourt, slot.start)
                    return (
                      <SlotButton
                        key={slot.start}
                        slot={slot}
                        taken={taken}
                        picked={picked}
                        peak={peak}
                        price={price}
                        requires_payment={selectedCourt.requires_payment}
                        onClick={() => !taken && toggleSlot(slot.start)}
                      />
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Summary + notes + confirm */}
          {selectedSlots.length > 0 && (
            <div className="mt-4 border-t border-open-light pt-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-open-muted">
                  {selectedSlots.length} hora{selectedSlots.length > 1 ? 's' : ''}
                </span>
                <span className="font-semibold text-open-ink">
                  {totalPrice === 0
                    ? 'Gratis'
                    : `$${totalPrice.toLocaleString('es')}`}
                </span>
              </div>
              {selectedCourt.requires_payment && totalPrice > 0 && (
                <p className="mb-3 text-xs text-open-muted">
                  El pago se coordina con el club.
                </p>
              )}
              <textarea
                placeholder="Notas opcionales…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mb-3 w-full resize-none border border-open-light bg-open-bg px-3 py-2 text-sm text-open-ink placeholder:text-open-muted focus:outline-none focus:ring-1 focus:ring-open-primary"
              />
              {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
              {success && <p className="mb-2 text-xs text-green-600">{success}</p>}
              <button
                type="button"
                onClick={handleBook}
                disabled={isSaving}
                className="h-10 w-full bg-open-primary text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {isSaving
                  ? 'Guardando…'
                  : selectedCourt.auto_confirm
                  ? 'Confirmar reserva'
                  : 'Solicitar reserva'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* My reservations */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-open-ink">Mis Reservaciones</h2>
        {myReservations.length === 0 ? (
          <p className="text-sm text-open-muted">Sin reservaciones.</p>
        ) : (
          <div className="grid gap-2">
            {myReservations.map((res) => (
              <MyReservationRow
                key={res.id}
                res={res}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CourtCard({ court, isSelected, onSelect }) {
  const price = Number(court.price_per_hour) || 0
  const surface = SURFACE_LABELS[court.surface] || court.surface || '—'
  const hours =
    court.open_time && court.close_time
      ? `${court.open_time.slice(0, 5)} – ${court.close_time.slice(0, 5)}`
      : null

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'border p-4 text-left transition',
        isSelected
          ? 'border-open-primary bg-open-primary/5'
          : 'border-open-light bg-open-surface hover:border-open-ink',
      ].join(' ')}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <span className="font-semibold text-open-ink">{court.name}</span>
        <span className="shrink-0 text-xs font-semibold text-open-primary">
          {price === 0 ? 'Gratis' : `$${price}/hr`}
        </span>
      </div>
      <p className="text-xs text-open-muted">
        {surface}
        {court.is_indoor ? ' · Cubierta' : ''}
        {hours ? ` · ${hours}` : ''}
      </p>
    </button>
  )
}

function DateStrip({ selectedDate, onChange }) {
  const [offset, setOffset] = useState(0)
  const dates = Array.from({ length: 7 }, (_, i) => addDays(todayStr(), offset + i))

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setOffset((o) => Math.max(0, o - 7))}
        disabled={offset === 0}
        className="grid h-8 w-8 shrink-0 place-items-center border border-open-light text-open-muted transition hover:border-open-ink disabled:opacity-30"
      >
        <ChevronLeft size={14} />
      </button>
      <div className="flex flex-1 gap-1 overflow-x-auto pb-1">
        {dates.map((d) => {
          const dayNum = new Date(d + 'T00:00:00').getDate()
          const dayName = DAYS[new Date(d + 'T00:00:00').getDay()]
          const isSelected = d === selectedDate
          return (
            <button
              key={d}
              type="button"
              onClick={() => onChange(d)}
              className={[
                'flex shrink-0 flex-col items-center gap-0.5 border px-2 py-1.5 text-xs font-semibold transition',
                isSelected
                  ? 'border-open-primary bg-open-primary text-white'
                  : 'border-open-light bg-open-bg text-open-ink hover:border-open-primary',
              ].join(' ')}
            >
              <span className="text-[10px] font-normal opacity-80">{dayName}</span>
              <span>{dayNum}</span>
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => setOffset((o) => o + 7)}
        className="grid h-8 w-8 shrink-0 place-items-center border border-open-light text-open-muted transition hover:border-open-ink"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

function SlotButton({ slot, taken, picked, peak, price, requires_payment, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={taken}
      className={[
        'flex flex-col items-center gap-0.5 border px-3 py-2 text-xs font-semibold transition',
        taken
          ? 'cursor-not-allowed border-open-light bg-open-light text-open-muted line-through opacity-50'
          : picked
          ? 'border-open-primary bg-open-primary text-white'
          : peak
          ? 'border-amber-400 bg-amber-50 text-amber-700 hover:border-amber-500 dark:bg-amber-900/20 dark:text-amber-300'
          : 'border-open-light bg-open-bg text-open-ink hover:border-open-primary',
      ].join(' ')}
    >
      <span>
        {slot.start} – {slot.end}
      </span>
      {requires_payment && price > 0 && (
        <span className="text-[10px] font-normal opacity-80">${price}</span>
      )}
      {peak && !taken && !picked && (
        <span className="text-[9px] font-bold uppercase tracking-widest">Peak</span>
      )}
    </button>
  )
}

const STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
}
const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-open-light text-open-muted',
}
const PAYMENT_LABELS = {
  free: 'Gratis',
  pending: 'Pago pendiente',
  paid: 'Pagado',
}

function MyReservationRow({ res, onCancel }) {
  const canCancel = res.status !== 'cancelled'
  const courtName = res.courts?.name || '—'
  const dateStr = formatDate(res.reservation_date)
  const timeStr = `${res.start_time?.slice(0, 5)} – ${res.end_time?.slice(0, 5)}`

  return (
    <div className="flex items-center justify-between gap-4 border border-open-light bg-open-surface px-4 py-3">
      <div className="grid gap-0.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-open-ink">{courtName}</span>
          <span
            className={[
              'rounded-full px-2 py-0.5 text-[11px] font-semibold',
              STATUS_COLORS[res.status] || 'bg-open-light text-open-muted',
            ].join(' ')}
          >
            {STATUS_LABELS[res.status] || res.status}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-open-muted">
          <span className="flex items-center gap-1">
            <CalendarDays size={11} />
            {dateStr}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {timeStr}
          </span>
          {res.total_price > 0 && (
            <span className="font-semibold text-open-ink">${res.total_price}</span>
          )}
          {res.payment_status && (
            <span className="text-open-muted">{PAYMENT_LABELS[res.payment_status] || ''}</span>
          )}
        </div>
        {res.notes && <p className="text-xs italic text-open-muted">{res.notes}</p>}
      </div>
      {canCancel && (
        <button
          type="button"
          onClick={() => onCancel(res.id)}
          className="shrink-0 border border-open-light px-2 py-1 text-xs font-semibold text-open-muted transition hover:border-red-400 hover:text-red-500"
        >
          Cancelar
        </button>
      )}
    </div>
  )
}
