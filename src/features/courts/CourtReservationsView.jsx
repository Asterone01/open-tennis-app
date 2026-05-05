import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import useManagerClub from '../../hooks/useManagerClub'
import usePlayerProfile from '../profile/usePlayerProfile'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const SURFACE_LABELS = { clay: 'Arcilla', hard: 'Dura', grass: 'Cesped', carpet: 'Moqueta' }
const COURTS_HERO_IMAGE =
  'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=1800&q=80'
const COURT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1400&q=80'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function formatDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`)
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
  return slotMins >= peakStart && slotMins < peakEnd
    ? Number(court.peak_price_per_hour)
    : base
}

function isPeakSlot(court, startTime) {
  if (!court.peak_start || !court.peak_end) return false
  const slotMins = timeToMinutes(startTime)
  const peakStart = timeToMinutes(court.peak_start)
  const peakEnd = timeToMinutes(court.peak_end)
  return slotMins >= peakStart && slotMins < peakEnd
}

function courtHours(court) {
  return court.open_time && court.close_time
    ? `${court.open_time.slice(0, 5)} - ${court.close_time.slice(0, 5)}`
    : 'Horario por definir'
}

function courtMeta(court) {
  const surface = SURFACE_LABELS[court.surface] || court.surface || 'Superficie'
  return [surface, court.is_indoor ? 'Cubierta' : 'Exterior', courtHours(court)]
    .filter(Boolean)
    .join(' · ')
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
  const [mobileStep, setMobileStep] = useState(1)
  const [lastBooked, setLastBooked] = useState(null)

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

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id
      if (!uid) return
      const { data } = await supabase
        .from('court_reservations')
        .select('*, courts(name, photo_url)')
        .eq('user_id', uid)
        .order('reservation_date', { ascending: false })
        .order('start_time', { ascending: true })
        .limit(30)
      setMyReservations(data || [])
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedCourt || !selectedDate) return
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
    return new Date(`${selectedDate}T00:00:00`).getDay()
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

  const nextReservation = useMemo(
    () => myReservations.find((res) => res.status !== 'cancelled') || null,
    [myReservations],
  )

  const toggleSlot = (startTime) => {
    setSelectedSlots((prev) =>
      prev.includes(startTime) ? prev.filter((s) => s !== startTime) : [...prev, startTime],
    )
  }

  const selectCourt = (court) => {
    setSelectedCourt(court)
    setSelectedSlots([])
    setError('')
    setSuccess('')
    setLastBooked(null)
    setMobileStep(2)
  }

  const refreshMyReservations = async (uid) => {
    const { data } = await supabase
      .from('court_reservations')
      .select('*, courts(name, photo_url)')
      .eq('user_id', uid)
      .order('reservation_date', { ascending: false })
      .order('start_time', { ascending: true })
      .limit(30)
    setMyReservations(data || [])
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
      setError(
        insertError.code === '23505'
          ? 'Uno o mas horarios ya estan ocupados. Recarga y vuelve a intentar.'
          : insertError.message,
      )
    } else {
      const label = selectedCourt.auto_confirm ? 'confirmada' : 'pendiente de confirmacion'
      setLastBooked({
        court: selectedCourt,
        date: selectedDate,
        slots: selectedSlots,
        totalPrice,
        label,
      })
      setSuccess(
        `Reserva ${label}: ${selectedSlots.length} hora${selectedSlots.length > 1 ? 's' : ''} el ${formatDate(selectedDate)}.`,
      )
      setSelectedSlots([])
      setNotes('')

      const { data } = await supabase
        .from('court_reservations')
        .select('start_time')
        .eq('court_id', selectedCourt.id)
        .eq('reservation_date', selectedDate)
        .neq('status', 'cancelled')
      setTakenSlots((data || []).map((r) => r.start_time.slice(0, 5)))
      await refreshMyReservations(uid)
      setMobileStep(4)
    }
    setIsSaving(false)
  }

  const handleCancel = async (resId) => {
    await supabase.from('court_reservations').update({ status: 'cancelled' }).eq('id', resId)
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
        Cargando canchas...
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <header className="relative isolate overflow-hidden rounded-[2rem] bg-open-ink px-5 py-6 text-white shadow-sm sm:rounded-[2.25rem] sm:px-7 sm:py-7 lg:min-h-[14rem] lg:px-8 lg:py-8">
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${COURTS_HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,0.9),rgba(0,0,0,0.56),rgba(0,0,0,0.18))]" />
        <div className="grid min-h-full gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.38fr)] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/68">
              Canchas
            </p>
            <h1 className="mt-4 max-w-2xl text-5xl font-black leading-[0.94] tracking-normal text-white sm:text-5xl lg:text-6xl">
              Reserva sin friccion.
            </h1>
            <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-white/76">
              Elige cancha, fecha y horario. Mas adelante este flujo puede sincronizarse con Google Calendar por club.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <HeroMetric label="Canchas" value={courts.length} />
            <HeroMetric label="Reservas" value={myReservations.length} />
            <HeroMetric label="Horas" value={selectedSlots.length} />
            <HeroMetric label="Total" value={totalPrice === 0 ? 'Gratis' : `$${totalPrice}`} />
          </div>
        </div>
      </header>

      <MobileReservationSteps
        step={mobileStep}
        selectedCourt={selectedCourt}
        selectedSlots={selectedSlots}
        lastBooked={lastBooked}
      />

      {courts.length === 0 ? (
        <p className="rounded-[1.5rem] border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
          No hay canchas activas en tu club.
        </p>
      ) : (
        <section className={[mobileStep === 1 ? 'grid' : 'hidden', 'gap-3 sm:grid'].join(' ')}>
          <SectionTitle
            kicker="Paso 1"
            title="Elige cancha"
            detail="Cada cancha usa su foto como banner para reconocerla rapido."
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courts.map((court) => (
              <CourtCard
                key={court.id}
                court={court}
                isSelected={selectedCourt?.id === court.id}
                onSelect={() => selectCourt(court)}
              />
            ))}
          </div>
        </section>
      )}

      {selectedCourt ? (
        <section
          className={[
            mobileStep === 2 || mobileStep === 3 ? 'block' : 'hidden',
            'overflow-hidden rounded-[2rem] border border-open-light bg-open-surface shadow-sm sm:block',
          ].join(' ')}
        >
          <div className="relative isolate min-h-56 overflow-hidden bg-open-ink p-5 text-white sm:min-h-40 sm:p-5">
            <div
              className="absolute inset-0 -z-20 bg-cover bg-center"
              style={{ backgroundImage: `url(${selectedCourt.photo_url || COURT_FALLBACK_IMAGE})` }}
            />
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,0.86),rgba(0,0,0,0.48),rgba(0,0,0,0.14))]" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/64">
                  Paso 2
                </p>
                <h2 className="mt-3 text-4xl font-black leading-none text-white sm:text-4xl">
                  {selectedCourt.name}
                </h2>
                <p className="mt-3 text-sm font-semibold text-white/72">{courtMeta(selectedCourt)}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCourt(null)
                  setSelectedSlots([])
                  setMobileStep(1)
                }}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/20 bg-white/12 text-white backdrop-blur-md transition hover:bg-white/20"
                aria-label="Cerrar cancha seleccionada"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.34fr)]">
            <div className={[mobileStep === 2 ? 'grid' : 'hidden', 'gap-4 sm:grid'].join(' ')}>
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-open-muted">
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

              {isCourtClosed ? (
                <p className="rounded-[1.25rem] border border-open-light bg-open-bg px-4 py-3 text-sm font-semibold text-open-muted">
                  La cancha esta cerrada los {DAYS[dayOfWeek]}.
                </p>
              ) : (
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-open-muted">
                    Horarios disponibles
                  </p>
                  {slots.length === 0 ? (
                    <p className="text-sm text-open-muted">Sin horarios configurados.</p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-4">
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
                            requiresPayment={selectedCourt.requires_payment}
                            onClick={() => !taken && toggleSlot(slot.start)}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-2 sm:hidden">
                <button
                  type="button"
                  onClick={() => setMobileStep(3)}
                  disabled={selectedSlots.length === 0}
                  className="h-12 rounded-full bg-open-ink text-sm font-black text-white transition disabled:opacity-40"
                >
                  Continuar a confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setMobileStep(1)}
                  className="h-11 rounded-full border border-open-light bg-open-surface text-sm font-black text-open-muted"
                >
                  Cambiar cancha
                </button>
              </div>
            </div>

            <aside className={[mobileStep === 3 ? 'grid' : 'hidden', 'content-start gap-3 rounded-[1.5rem] border border-open-light bg-open-bg p-4 sm:grid'].join(' ')}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-open-muted">
                Paso 3
              </p>
              <h3 className="text-2xl font-black leading-7 text-open-ink">Confirmar</h3>
              <div className="grid gap-2 rounded-[1.25rem] bg-open-surface p-3 text-sm">
                <SummaryLine label="Cancha" value={selectedCourt.name} />
                <SummaryLine label="Fecha" value={formatDate(selectedDate)} />
                <SummaryLine
                  label="Horas"
                  value={selectedSlots.length > 0 ? selectedSlots.join(', ') : 'Selecciona horario'}
                />
                <SummaryLine
                  label="Total"
                  value={totalPrice === 0 ? 'Gratis' : `$${totalPrice.toLocaleString('es')}`}
                />
              </div>
              {selectedCourt.requires_payment && totalPrice > 0 ? (
                <p className="text-xs leading-5 text-open-muted">El pago se coordina con el club.</p>
              ) : null}
              <textarea
                placeholder="Notas opcionales..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-[1rem] border border-open-light bg-open-surface px-3 py-3 text-sm font-semibold text-open-ink placeholder:text-open-muted focus:outline-none focus:ring-1 focus:ring-open-primary"
              />
              {error ? <p className="text-xs font-semibold text-red-500">{error}</p> : null}
              {success ? <p className="text-xs font-semibold text-green-600">{success}</p> : null}
              <button
                type="button"
                onClick={handleBook}
                disabled={isSaving || selectedSlots.length === 0}
                className="h-12 w-full rounded-full bg-open-primary text-sm font-black text-white transition hover:opacity-90 disabled:opacity-40"
              >
                {isSaving
                  ? 'Guardando...'
                  : selectedCourt.auto_confirm
                    ? 'Confirmar reserva'
                    : 'Solicitar reserva'}
              </button>
              <button
                type="button"
                onClick={() => setMobileStep(2)}
                className="h-11 rounded-full border border-open-light bg-open-surface text-sm font-black text-open-muted sm:hidden"
              >
                Volver a horarios
              </button>
            </aside>
          </div>
        </section>
      ) : null}

      {lastBooked ? (
        <ReservationSuccessCard
          booking={lastBooked}
          onNewReservation={() => {
            setLastBooked(null)
            setSelectedCourt(null)
            setMobileStep(1)
          }}
        />
      ) : null}

      {nextReservation ? <NextReservationCard res={nextReservation} /> : null}

      <section className="grid gap-3">
        <SectionTitle kicker="Agenda" title="Mis reservaciones" />
        {myReservations.length === 0 ? (
          <p className="rounded-[1.5rem] border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
            Sin reservaciones.
          </p>
        ) : (
          <div className="grid gap-2">
            {myReservations.map((res) => (
              <MyReservationRow key={res.id} res={res} onCancel={handleCancel} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function HeroMetric({ label, value }) {
  return (
    <div className="rounded-[1.15rem] border border-white/14 bg-white/10 p-3 backdrop-blur-md">
      <p className="text-xl font-black leading-none text-white">{value}</p>
      <p className="mt-2 text-[0.6rem] font-black uppercase tracking-[0.16em] text-white/68">
        {label}
      </p>
    </div>
  )
}

function MobileReservationSteps({ step, selectedCourt, selectedSlots, lastBooked }) {
  const items = [
    { number: 1, label: 'Cancha', active: step === 1, done: Boolean(selectedCourt) },
    { number: 2, label: 'Horario', active: step === 2, done: selectedSlots.length > 0 },
    { number: 3, label: 'Confirmar', active: step === 3, done: Boolean(lastBooked) },
    { number: 4, label: 'Lista', active: step === 4, done: Boolean(lastBooked) },
  ]

  return (
    <div className="grid gap-3 rounded-[1.5rem] border border-open-light bg-open-surface p-3 sm:hidden">
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => (
          <div key={item.number} className="grid gap-2">
            <div
              className={[
                'grid h-11 place-items-center rounded-[1rem] text-sm font-black',
                item.active
                  ? 'bg-open-ink text-white'
                  : item.done
                    ? 'bg-open-primary text-white'
                    : 'bg-open-bg text-open-muted',
              ].join(' ')}
            >
              {item.number}
            </div>
            <p className="text-center text-[0.64rem] font-black uppercase tracking-[0.08em] text-open-muted">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReservationSuccessCard({ booking, onNewReservation }) {
  const image = booking.court.photo_url || COURT_FALLBACK_IMAGE
  const timeLabel = booking.slots.join(', ')

  return (
    <article className="relative isolate overflow-hidden rounded-[2rem] bg-open-ink p-5 text-white shadow-sm sm:p-6">
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,0.9),rgba(0,0,0,0.58),rgba(0,0,0,0.24))]" />
      <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-white/64">
            Cancha reservada
          </p>
          <h2 className="mt-3 text-4xl font-black leading-none sm:text-5xl">
            {booking.court.name}
          </h2>
          <div className="mt-5 grid gap-2 text-sm font-semibold text-white/76 sm:grid-cols-3">
            <span className="rounded-[1rem] border border-white/14 bg-white/10 px-3 py-2 backdrop-blur-md">
              {formatDate(booking.date)}
            </span>
            <span className="rounded-[1rem] border border-white/14 bg-white/10 px-3 py-2 backdrop-blur-md">
              {timeLabel}
            </span>
            <span className="rounded-[1rem] border border-white/14 bg-white/10 px-3 py-2 backdrop-blur-md">
              {booking.totalPrice === 0 ? 'Gratis' : `$${booking.totalPrice.toLocaleString('es')}`}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onNewReservation}
          className="h-12 rounded-full bg-white px-5 text-sm font-black text-open-ink transition hover:opacity-90"
        >
          Nueva reserva
        </button>
      </div>
    </article>
  )
}

function NextReservationCard({ res }) {
  const courtName = res.courts?.name || 'Cancha'
  const image = res.courts?.photo_url || COURT_FALLBACK_IMAGE
  const timeStr = `${res.start_time?.slice(0, 5)} - ${res.end_time?.slice(0, 5)}`

  return (
    <article className="overflow-hidden rounded-[2rem] border border-open-light bg-open-surface shadow-sm">
      <div className="grid sm:grid-cols-[12rem_1fr_auto]">
        <div className="relative h-32 bg-open-ink sm:h-full">
          <img src={image} alt={courtName} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="grid content-center gap-2 p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-open-muted">
            Tu proxima cancha
          </p>
          <h2 className="text-2xl font-black text-open-ink">{courtName}</h2>
          <div className="flex flex-wrap gap-2 text-xs font-black text-open-muted">
            <span className="rounded-full bg-open-bg px-3 py-1">{formatDate(res.reservation_date)}</span>
            <span className="rounded-full bg-open-bg px-3 py-1">{timeStr}</span>
            <span className="rounded-full bg-open-bg px-3 py-1">
              {STATUS_LABELS[res.status] || res.status}
            </span>
          </div>
        </div>
        <div className="grid content-center p-4 sm:min-w-36 sm:text-right">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-open-muted">
            Estado
          </p>
          <p className="mt-1 text-lg font-black text-open-ink">
            {PAYMENT_LABELS[res.payment_status] || 'Listo'}
          </p>
        </div>
      </div>
    </article>
  )
}

function SectionTitle({ kicker, title, detail }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-open-muted">{kicker}</p>
        <h2 className="mt-1 text-2xl font-black text-open-ink">{title}</h2>
      </div>
      {detail ? (
        <p className="hidden max-w-sm text-right text-sm leading-6 text-open-muted sm:block">
          {detail}
        </p>
      ) : null}
    </div>
  )
}

function CourtCard({ court, isSelected, onSelect }) {
  const price = Number(court.price_per_hour) || 0
  const image = court.photo_url || COURT_FALLBACK_IMAGE

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'group relative isolate grid min-h-[16rem] overflow-hidden rounded-[2rem] p-5 text-left text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl sm:min-h-[12rem] sm:rounded-[1.5rem] sm:p-4',
        isSelected ? 'ring-2 ring-open-primary ring-offset-2 ring-offset-open-bg' : '',
      ].join(' ')}
    >
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center transition duration-500 group-hover:scale-105"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.22),rgba(0,0,0,0.88))]" />
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full border border-white/20 bg-white/12 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.16em] backdrop-blur-md">
          {isSelected ? 'Seleccionada' : 'Disponible'}
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-open-ink">
          {price === 0 ? 'Gratis' : `$${price}/hr`}
        </span>
      </div>
      <div className="mt-auto">
        <h3 className="text-3xl font-black leading-8 sm:text-2xl sm:leading-7">{court.name}</h3>
        <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-white/72">
          <MapPin size={13} />
          {courtMeta(court)}
        </p>
      </div>
    </button>
  )
}

function DateStrip({ selectedDate, onChange }) {
  const [offset, setOffset] = useState(0)
  const dates = Array.from({ length: 7 }, (_, i) => addDays(todayStr(), offset + i))

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setOffset((o) => Math.max(0, o - 7))}
        disabled={offset === 0}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-open-light bg-open-bg text-open-muted transition hover:border-open-ink disabled:opacity-30"
      >
        <ChevronLeft size={16} />
      </button>
      <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
        {dates.map((d) => {
          const dayNum = new Date(`${d}T00:00:00`).getDate()
          const dayName = DAYS[new Date(`${d}T00:00:00`).getDay()]
          const isSelected = d === selectedDate
          return (
            <button
              key={d}
              type="button"
              onClick={() => onChange(d)}
              className={[
                'grid h-16 min-w-14 shrink-0 place-items-center rounded-[1rem] border px-3 text-xs font-black transition',
                isSelected
                  ? 'border-open-primary bg-open-primary text-white'
                  : 'border-open-light bg-open-bg text-open-ink hover:border-open-primary',
              ].join(' ')}
            >
              <span className="text-[10px] font-semibold opacity-80">{dayName}</span>
              <span className="text-base">{dayNum}</span>
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => setOffset((o) => o + 7)}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-open-light bg-open-bg text-open-muted transition hover:border-open-ink"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

function SlotButton({ slot, taken, picked, peak, price, requiresPayment, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={taken}
      className={[
        'grid min-h-20 content-center rounded-[1.25rem] border px-3 py-3 text-left text-sm font-black transition sm:min-h-16 sm:rounded-[1rem] sm:py-2',
        taken
          ? 'cursor-not-allowed border-open-light bg-open-light text-open-muted line-through opacity-50'
          : picked
            ? 'border-open-ink bg-open-ink text-white'
            : peak
              ? 'border-amber-400 bg-amber-50 text-amber-700 hover:border-amber-500'
              : 'border-open-light bg-open-bg text-open-ink hover:border-open-primary',
      ].join(' ')}
    >
      <span>
        {slot.start} - {slot.end}
      </span>
      <span className="mt-1 text-xs font-semibold opacity-70">
        {taken
          ? 'Ocupado'
          : requiresPayment && price > 0
            ? `$${price}`
            : peak
              ? 'Horario peak'
              : 'Disponible'}
      </span>
    </button>
  )
}

function SummaryLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-open-muted">{label}</span>
      <span className="text-right font-black text-open-ink">{value}</span>
    </div>
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
  const courtName = res.courts?.name || 'Cancha'
  const dateStr = formatDate(res.reservation_date)
  const timeStr = `${res.start_time?.slice(0, 5)} - ${res.end_time?.slice(0, 5)}`
  const image = res.courts?.photo_url || COURT_FALLBACK_IMAGE

  return (
    <article className="overflow-hidden rounded-[1.5rem] border border-open-light bg-open-surface shadow-sm">
      <div className="grid gap-0 sm:grid-cols-[7rem_1fr]">
        <div className="relative h-24 bg-open-ink sm:h-full sm:min-h-24">
          <img src={image} alt={courtName} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/24" />
        </div>
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-black text-open-ink">{courtName}</span>
              <span
                className={[
                  'rounded-full px-2 py-0.5 text-[11px] font-black',
                  STATUS_COLORS[res.status] || 'bg-open-light text-open-muted',
                ].join(' ')}
              >
                {STATUS_LABELS[res.status] || res.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-open-muted">
              <span className="flex items-center gap-1">
                <CalendarDays size={12} />
                {dateStr}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {timeStr}
              </span>
              {res.total_price > 0 ? (
                <span className="font-black text-open-ink">${res.total_price}</span>
              ) : null}
              {res.payment_status ? (
                <span>{PAYMENT_LABELS[res.payment_status] || ''}</span>
              ) : null}
            </div>
            {res.notes ? <p className="text-xs italic text-open-muted">{res.notes}</p> : null}
          </div>
          {canCancel ? (
            <button
              type="button"
              onClick={() => onCancel(res.id)}
              className="h-10 shrink-0 rounded-full border border-open-light px-4 text-xs font-black text-open-muted transition hover:border-red-400 hover:text-red-500"
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}
