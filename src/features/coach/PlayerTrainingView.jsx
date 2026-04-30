import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Check, Clock, Dumbbell, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const STATUS_LABELS = { invited: 'Confirmada', present: 'Asististe', absent: 'Faltaste' }
const STATUS_COLORS = {
  invited: 'border-open-light bg-open-surface text-open-muted',
  present: 'border-green-400 bg-green-50 text-green-700',
  absent: 'border-red-300 bg-red-50 text-red-600',
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(d) {
  if (!d) return '—'
  return new Intl.DateTimeFormat('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }).format(
    new Date(d + 'T00:00:00'),
  )
}

export default function PlayerTrainingView() {
  const [rows, setRows] = useState([])       // { session, attendance }
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('upcoming') // upcoming | past | all

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id
      if (!uid) { setIsLoading(false); return }

      // Load attendance rows + linked session
      const { data, error } = await supabase
        .from('training_attendance')
        .select('*, training_sessions(*)')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(60)

      if (!error && data) {
        setRows(
          data
            .filter((r) => r.training_sessions)
            .map((r) => ({ attendance: r, session: r.training_sessions }))
            .sort((a, b) => b.session.session_date.localeCompare(a.session.session_date)),
        )
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const today = todayStr()

  const filtered = useMemo(() => {
    return rows.filter(({ session }) => {
      if (filter === 'upcoming') return session.session_date >= today && session.status !== 'cancelled'
      if (filter === 'past') return session.session_date < today || session.status === 'closed'
      return true
    })
  }, [rows, filter, today])

  const upcomingCount = rows.filter(({ session }) => session.session_date >= today && session.status !== 'cancelled').length
  const presentCount = rows.filter(({ attendance }) => attendance.status === 'present').length
  const totalClosed = rows.filter(({ session }) => session.status === 'closed').length
  const attendanceRate = totalClosed > 0 ? Math.round((presentCount / totalClosed) * 100) : null
  const totalXp = rows.reduce((sum, { attendance }) => sum + (attendance.xp_awarded || 0), 0)

  if (isLoading) {
    return <p className="text-sm text-open-muted">Cargando entrenamientos…</p>
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">Entrenamientos</p>
          <h1 className="mt-2 text-3xl font-semibold text-open-ink md:text-4xl">Mis Sesiones</h1>
        </div>
        <div className="grid h-11 w-11 place-items-center border border-open-light bg-open-surface">
          <Dumbbell size={20} strokeWidth={1.8} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Próximas sesiones" value={upcomingCount} />
        <KpiCard label="Asistencias" value={presentCount} />
        <KpiCard
          label={attendanceRate !== null ? `${attendanceRate}% asistencia` : 'Asistencia'}
          value={totalXp > 0 ? `+${totalXp} XP` : '—'}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { id: 'upcoming', label: 'Próximas' },
          { id: 'past', label: 'Historial' },
          { id: 'all', label: 'Todas' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={[
              'h-9 border px-4 text-xs font-semibold uppercase tracking-widest transition',
              filter === tab.id
                ? 'border-open-ink bg-open-ink text-white'
                : 'border-open-light bg-open-surface text-open-muted hover:border-open-ink',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Session list */}
      {filtered.length === 0 ? (
        <p className="border border-open-light bg-open-surface px-4 py-8 text-sm text-open-muted">
          {filter === 'upcoming'
            ? 'No tienes sesiones próximas. Tu coach las publicará pronto.'
            : 'Sin sesiones en esta categoría.'}
        </p>
      ) : (
        <div className="grid gap-3">
          {filtered.map(({ session, attendance }) => (
            <SessionCard key={attendance.id} session={session} attendance={attendance} today={today} />
          ))}
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value }) {
  return (
    <div className="border border-open-light bg-open-surface p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-open-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-open-ink">{value}</p>
    </div>
  )
}

function SessionCard({ session, attendance, today }) {
  const isPast = session.session_date < today || session.status === 'closed'
  const statusKey = isPast ? (attendance.status === 'invited' ? 'absent' : attendance.status) : 'invited'

  return (
    <div className={[
      'grid gap-3 border p-4',
      !isPast ? 'border-open-light bg-open-surface' : 'border-open-light bg-open-surface opacity-80',
    ].join(' ')}>
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <span className="font-semibold text-open-ink">{session.title}</span>
          {session.focus_area && (
            <span className="text-xs font-semibold uppercase tracking-widest text-open-muted">
              {session.focus_area}
            </span>
          )}
        </div>
        <span className={[
          'shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
          STATUS_COLORS[statusKey],
        ].join(' ')}>
          {STATUS_LABELS[statusKey]}
        </span>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-open-muted">
        <span className="flex items-center gap-1">
          <CalendarDays size={12} />
          {formatDate(session.session_date)}
        </span>
        {session.session_time && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {session.session_time.slice(0, 5)}
            {session.duration_minutes ? ` · ${session.duration_minutes} min` : ''}
          </span>
        )}
        {session.court && (
          <span className="border border-open-light bg-open-bg px-2 py-0.5">{session.court}</span>
        )}
        {attendance.xp_awarded > 0 && (
          <span className="font-semibold text-open-ink">+{attendance.xp_awarded} XP</span>
        )}
      </div>

      {session.session_plan && (
        <p className="border-t border-open-light pt-2 text-xs leading-5 text-open-muted">
          {session.session_plan}
        </p>
      )}

      {/* Attendance indicator */}
      {isPast && (
        <div className="flex items-center gap-2">
          {statusKey === 'present' ? (
            <Check size={14} className="text-green-600" strokeWidth={2} />
          ) : (
            <X size={14} className="text-red-400" strokeWidth={2} />
          )}
          <span className="text-xs font-semibold text-open-muted">
            {statusKey === 'present' ? 'Asististe a esta sesión' : 'No asististe'}
          </span>
        </div>
      )}
    </div>
  )
}
