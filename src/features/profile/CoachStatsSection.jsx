import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const FOCUS_LABELS = {
  saque_y_devolucion: 'Saque',
  consistencia_fondo: 'Fondo',
  volea_y_red: 'Volea',
  movilidad_defensa: 'Movilidad',
  slice_variacion: 'Slice',
  match_play: 'Match play',
}

function monthKey(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function monthLabel(key) {
  const [, m] = key.split('-')
  return MONTHS_ES[parseInt(m, 10) - 1]
}

export default function CoachStatsSection({ coachUserId }) {
  const [sessions, setSessions] = useState([])
  const [attendance, setAttendance] = useState([])
  const [players, setPlayers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!coachUserId) { setIsLoading(false); return }

    const load = async () => {
      // Load all sessions by this coach
      const { data: sessData } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('coach_user_id', coachUserId)
        .order('session_date', { ascending: false })
        .limit(120)

      const sess = sessData || []
      setSessions(sess)

      if (sess.length === 0) { setIsLoading(false); return }

      const sessionIds = sess.map((s) => s.id)

      // Load attendance for those sessions
      const { data: attData } = await supabase
        .from('training_attendance')
        .select('*')
        .in('session_id', sessionIds)

      const att = attData || []
      setAttendance(att)

      // Load player names from club
      if (sess[0]?.club_id) {
        const { data: pData } = await supabase
          .from('players')
          .select('id, full_name, email, level, xp')
          .eq('club_id', sess[0].club_id)
        setPlayers(pData || [])
      }

      setIsLoading(false)
    }

    load()
  }, [coachUserId])

  const closedSessions = useMemo(() => sessions.filter((s) => s.status === 'closed'), [sessions])
  const plannedSessions = useMemo(() => sessions.filter((s) => s.status === 'planned'), [sessions])

  // Overall attendance rate (closed sessions only)
  const { totalInvited, totalPresent, attendancePct } = useMemo(() => {
    const closedIds = new Set(closedSessions.map((s) => s.id))
    const relevant = attendance.filter((a) => closedIds.has(a.session_id))
    const inv = relevant.length
    const pres = relevant.filter((a) => a.status === 'present').length
    return {
      totalInvited: inv,
      totalPresent: pres,
      attendancePct: inv > 0 ? Math.round((pres / inv) * 100) : 0,
    }
  }, [attendance, closedSessions])

  // Sessions per month (last 6)
  const monthlyData = useMemo(() => {
    const byMonth = new Map()
    sessions.forEach((s) => {
      if (!s.session_date) return
      const key = monthKey(s.session_date)
      byMonth.set(key, (byMonth.get(key) || 0) + 1)
    })
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, count]) => ({ label: monthLabel(key), value: count }))
  }, [sessions])

  // Focus area breakdown
  const focusBreakdown = useMemo(() => {
    const map = new Map()
    sessions.forEach((s) => {
      const key = s.drill_preset || s.focus_area || 'Otro'
      map.set(key, (map.get(key) || 0) + 1)
    })
    const total = sessions.length || 1
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([key, count]) => ({
        label: FOCUS_LABELS[key] || key,
        count,
        pct: Math.round((count / total) * 100),
      }))
  }, [sessions])

  // Top attendees
  const topAttendees = useMemo(() => {
    const map = new Map()
    attendance.filter((a) => a.status === 'present').forEach((a) => {
      map.set(a.player_id, (map.get(a.player_id) || 0) + 1)
    })
    const playerById = new Map(players.map((p) => [String(p.id), p]))
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([pid, count]) => {
        const p = playerById.get(pid)
        return { name: p?.full_name || p?.email || 'Jugador', count }
      })
  }, [attendance, players])

  // Least attending (invited but absent most)
  const absentees = useMemo(() => {
    const presMap = new Map()
    const invMap = new Map()
    attendance.forEach((a) => {
      invMap.set(a.player_id, (invMap.get(a.player_id) || 0) + 1)
      if (a.status === 'present') {
        presMap.set(a.player_id, (presMap.get(a.player_id) || 0) + 1)
      }
    })
    const playerById = new Map(players.map((p) => [String(p.id), p]))
    return Array.from(invMap.entries())
      .filter(([, inv]) => inv >= 3)
      .map(([pid, inv]) => {
        const pres = presMap.get(pid) || 0
        const pct = Math.round((pres / inv) * 100)
        const p = playerById.get(pid)
        return { name: p?.full_name || p?.email || 'Jugador', pct, pres, inv }
      })
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 5)
  }, [attendance, players])

  const totalXpAwarded = attendance
    .filter((a) => a.status === 'present')
    .reduce((s, a) => s + (a.xp_awarded || 0), 0)

  if (isLoading) return null
  if (sessions.length === 0) {
    return (
      <section className="border border-open-light bg-open-surface p-5">
        <SectionTitle title="Estadísticas de Coach" />
        <p className="mt-4 text-sm text-open-muted">Aún no tienes sesiones registradas.</p>
      </section>
    )
  }

  return (
    <div className="grid gap-5">
      {/* KPIs */}
      <section className="border border-open-light bg-open-surface p-5">
        <SectionTitle title="Resumen de Coach" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Sesiones total" value={sessions.length} />
          <KpiCard label="Cerradas" value={closedSessions.length} />
          <KpiCard label="Próximas" value={plannedSessions.length} />
          <KpiCard label="XP otorgado" value={`+${totalXpAwarded.toLocaleString('es')}`} />
        </div>
      </section>

      {/* Attendance rate */}
      <section className="border border-open-light bg-open-surface p-5">
        <SectionTitle title="Asistencia" />
        <div className="mt-5 flex items-center gap-8">
          <RingChart pct={attendancePct} />
          <div className="grid gap-2">
            <div>
              <p className="text-3xl font-bold text-open-ink">{totalPresent}</p>
              <p className="text-xs text-open-muted">presentes de {totalInvited} convocados</p>
            </div>
            <p className="text-sm font-semibold text-open-muted">
              {attendancePct}% de asistencia general
            </p>
          </div>
        </div>
      </section>

      {/* Sessions per month */}
      {monthlyData.length >= 2 && (
        <section className="border border-open-light bg-open-surface p-5">
          <SectionTitle title="Sesiones por mes" />
          <div className="mt-5">
            <BarChart
              data={monthlyData}
              maxValue={Math.max(...monthlyData.map((d) => d.value), 1)}
              color="bg-open-primary"
            />
          </div>
        </section>
      )}

      {/* Focus area breakdown */}
      {focusBreakdown.length > 0 && (
        <section className="border border-open-light bg-open-surface p-5">
          <SectionTitle title="Áreas de enfoque" />
          <div className="mt-4 grid gap-2">
            {focusBreakdown.map(({ label, count, pct }) => (
              <div key={label} className="grid gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-open-ink">{label}</span>
                  <span className="text-open-muted">{count} sesiones · {pct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-open-light">
                  <div className="h-full rounded-full bg-open-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top attendees + absentees */}
      <div className="grid gap-5 md:grid-cols-2">
        {topAttendees.length > 0 && (
          <section className="border border-open-light bg-open-surface p-5">
            <SectionTitle title="Más presentes" />
            <div className="mt-4 grid gap-2">
              {topAttendees.map(({ name, count }, i) => (
                <div key={i} className="flex items-center justify-between border border-open-light bg-open-bg px-3 py-2 text-sm">
                  <span className="font-semibold text-open-ink truncate">{name}</span>
                  <span className="shrink-0 font-bold text-open-primary ml-2">{count}×</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {absentees.length > 0 && (
          <section className="border border-open-light bg-open-surface p-5">
            <SectionTitle title="Menor asistencia" />
            <div className="mt-4 grid gap-2">
              {absentees.map(({ name, pct, pres, inv }, i) => (
                <div key={i} className="flex items-center justify-between border border-open-light bg-open-bg px-3 py-2 text-sm">
                  <span className="truncate font-semibold text-open-ink">{name}</span>
                  <span className={['shrink-0 ml-2 text-xs font-bold', pct < 50 ? 'text-red-500' : 'text-open-muted'].join(' ')}>
                    {pres}/{inv} ({pct}%)
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function KpiCard({ label, value }) {
  return (
    <div className="border border-open-light bg-open-bg p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-open-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-open-ink">{value}</p>
    </div>
  )
}

function RingChart({ pct }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg viewBox="0 0 72 72" className="h-20 w-20 shrink-0">
      <circle cx="36" cy="36" r={r} fill="none" strokeWidth="7" className="stroke-open-light" />
      <circle
        cx="36" cy="36" r={r} fill="none" strokeWidth="7"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        className="stroke-open-primary transition-all"
      />
      <text x="36" y="40" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-open-ink">{pct}%</text>
    </svg>
  )
}

function BarChart({ data, maxValue, color }) {
  return (
    <div className="flex items-end gap-2">
      {data.map((item, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-semibold text-open-muted">{item.value}</span>
          <div className="w-full bg-open-light" style={{ height: '3rem' }}>
            <div
              className={`w-full ${color} transition-all`}
              style={{ height: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[10px] text-open-muted">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function SectionTitle({ title }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-open-muted">{title}</p>
  )
}
