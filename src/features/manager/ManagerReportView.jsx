import { useEffect, useState } from 'react'
import { AlertCircle, BarChart2, Calendar, DollarSign, TrendingUp, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import useManagerClub from '../../hooks/useManagerClub'

// ─── Date helpers ─────────────────────────────────────────────────────────────

function periodStart(period) {
  const now = new Date()
  if (period === 'week')  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
  if (period === 'year')  return new Date(now.getFullYear(), 0, 1)
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function isoDate(d) {
  return d.toISOString().split('T')[0]
}

function getWeekLabel(dateStr) {
  const d = new Date(dateStr)
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return monday.toISOString().split('T')[0]
}

function buildWeeklyRevenue(reservations) {
  const map = {}
  reservations.forEach((r) => {
    const key = getWeekLabel(r.reservation_date)
    map[key] = (map[key] || 0) + (r.total_price || 0)
  })
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([weekKey, revenue]) => {
      const d = new Date(weekKey)
      const label = d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
      return { label, revenue }
    })
}

function buildOccupancy(courts, reservations) {
  const now = new Date()
  const dow = now.getDay()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - ((dow + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  return courts.map((court) => {
    const openH  = parseInt((court.open_time  || '07:00').split(':')[0], 10)
    const closeH = parseInt((court.close_time || '22:00').split(':')[0], 10)
    const dailyH = Math.max(closeH - openH, 1)
    const available = dailyH * 7

    const booked = reservations
      .filter((r) => {
        const d = new Date(r.reservation_date)
        return (
          r.court_id === court.id &&
          d >= weekStart &&
          d < weekEnd &&
          ['confirmed', 'pending'].includes(r.status)
        )
      })
      .reduce((s, r) => s + (r.duration_hours || 1), 0)

    return {
      name: court.name,
      booked,
      available,
      pct: Math.min(Math.round((booked / available) * 100), 100),
    }
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ManagerReportView() {
  const { clubId } = useManagerClub()
  const [period, setPeriod]     = useState('month')
  const [reservations, setRes]  = useState([])
  const [allRes, setAllRes]     = useState([])
  const [players, setPlayers]   = useState([])
  const [courts, setCourts]     = useState([])
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    if (!clubId) return
    load()
  }, [clubId, period])

  async function load() {
    setLoading(true)
    const start = isoDate(periodStart(period))

    const [{ data: res }, { data: pl }, { data: ct }, { data: all }] =
      await Promise.all([
        supabase
          .from('court_reservations')
          .select('id, reservation_date, total_price, duration_hours, court_id, status, courts(name)')
          .eq('club_id', clubId)
          .gte('reservation_date', start),
        supabase
          .from('players')
          .select('id, full_name, club_membership_status, next_payment_date, membership_plan, email, phone')
          .eq('club_id', clubId),
        supabase
          .from('courts')
          .select('id, name, open_time, close_time')
          .eq('club_id', clubId)
          .eq('status', 'active'),
        supabase
          .from('court_reservations')
          .select('court_id, reservation_date, duration_hours, status')
          .eq('club_id', clubId),
      ])

    setRes(res || [])
    setAllRes(all || [])
    setPlayers(pl || [])
    setCourts(ct || [])
    setLoading(false)
  }

  const confirmed    = reservations.filter((r) => r.status === 'confirmed')
  const totalRevenue = confirmed.reduce((s, r) => s + (r.total_price || 0), 0)
  const totalCount   = reservations.length
  const activeCount  = players.filter((p) => p.club_membership_status === 'approved').length
  const expiredList  = players.filter(
    (p) => p.next_payment_date && new Date(p.next_payment_date) < new Date(),
  )

  const weeklyData   = buildWeeklyRevenue(confirmed)
  const occupancy    = buildOccupancy(courts, allRes)
  const maxRevenue   = Math.max(...weeklyData.map((w) => w.revenue), 1)

  const PERIODS = [
    { key: 'week',  label: 'Esta semana' },
    { key: 'month', label: 'Este mes' },
    { key: 'year',  label: 'Este año' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-open-ink">Reporte</h1>
          <p className="mt-0.5 text-sm text-open-muted">Ingresos, membresías y ocupación</p>
        </div>
        <div className="flex gap-1 border border-open-light bg-open-surface">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={[
                'px-3 py-2 text-xs font-semibold transition',
                period === p.key
                  ? 'bg-open-ink text-white'
                  : 'text-open-muted hover:text-open-ink',
              ].join(' ')}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-open-muted">Cargando reporte…</p>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard
              icon={DollarSign}
              label="Ingresos"
              value={`$${totalRevenue.toLocaleString()}`}
              sub={`${confirmed.length} confirmadas`}
            />
            <KpiCard
              icon={Calendar}
              label="Reservas totales"
              value={totalCount}
              sub="Confirmadas + pendientes"
            />
            <KpiCard
              icon={Users}
              label="Miembros activos"
              value={activeCount}
              sub={`de ${players.length} registrados`}
            />
            <KpiCard
              icon={AlertCircle}
              label="Membresías vencidas"
              value={expiredList.length}
              sub="Pago atrasado"
              alert={expiredList.length > 0}
            />
          </div>

          {/* Revenue by week */}
          <Section title="Ingresos por semana" icon={TrendingUp}>
            {weeklyData.length === 0 ? (
              <p className="py-8 text-center text-sm text-open-muted">Sin datos para el período</p>
            ) : (
              <div className="mt-4 space-y-2">
                {weeklyData.map((w) => (
                  <div key={w.label} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 text-right text-[11px] text-open-muted">{w.label}</span>
                    <div className="flex-1 overflow-hidden rounded-sm bg-open-light">
                      <div
                        className="h-6 bg-open-primary transition-all duration-500"
                        style={{ width: `${(w.revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                    <span className="w-20 shrink-0 text-right text-xs font-semibold text-open-ink">
                      ${w.revenue.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Court occupancy */}
          <Section title="Ocupación esta semana" icon={BarChart2}>
            {occupancy.length === 0 ? (
              <p className="py-8 text-center text-sm text-open-muted">Sin canchas activas</p>
            ) : (
              <div className="mt-4 space-y-3">
                {occupancy.map((c) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 truncate text-sm font-medium text-open-ink">{c.name}</span>
                    <div className="flex-1 overflow-hidden rounded-sm bg-open-light">
                      <div
                        className={[
                          'h-5 transition-all duration-500',
                          c.pct >= 80
                            ? 'bg-red-400'
                            : c.pct >= 50
                            ? 'bg-amber-400'
                            : 'bg-open-primary',
                        ].join(' ')}
                        style={{ width: `${c.pct}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right text-xs font-semibold text-open-ink">
                      {c.pct}% · {c.booked}h/{c.available}h
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Expired memberships */}
          {expiredList.length > 0 && (
            <Section title="Membresías vencidas" icon={AlertCircle}>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-open-light text-left text-[11px] font-bold uppercase tracking-widest text-open-muted">
                      <th className="pb-2 pr-4">Jugador</th>
                      <th className="pb-2 pr-4">Plan</th>
                      <th className="pb-2 pr-4">Vencida</th>
                      <th className="pb-2">Días</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-open-light">
                    {expiredList.map((p) => {
                      const daysOverdue = Math.floor(
                        (Date.now() - new Date(p.next_payment_date).getTime()) / 86_400_000,
                      )
                      return (
                        <tr key={p.id} className="hover:bg-open-surface">
                          <td className="py-2.5 pr-4 font-medium text-open-ink">{p.full_name || '—'}</td>
                          <td className="py-2.5 pr-4 text-open-muted">{p.membership_plan || '—'}</td>
                          <td className="py-2.5 pr-4 text-open-muted">
                            {new Date(p.next_payment_date).toLocaleDateString('es')}
                          </td>
                          <td className="py-2.5">
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                              {daysOverdue}d
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, sub, alert = false }) {
  return (
    <div className={[
      'border p-4',
      alert ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-open-light bg-open-surface',
    ].join(' ')}>
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-open-muted">{label}</p>
        <Icon size={14} strokeWidth={1.8} className={alert ? 'text-red-400' : 'text-open-muted'} />
      </div>
      <p className={[
        'mt-2 text-2xl font-black tracking-tight',
        alert ? 'text-red-600' : 'text-open-ink',
      ].join(' ')}>{value}</p>
      <p className="mt-1 text-[11px] text-open-muted">{sub}</p>
    </div>
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="border border-open-light bg-open-surface p-5">
      <div className="flex items-center gap-2">
        <Icon size={15} strokeWidth={1.8} className="text-open-muted" />
        <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-open-muted">{title}</h2>
      </div>
      {children}
    </div>
  )
}
