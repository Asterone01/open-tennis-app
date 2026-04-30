import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function monthKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function monthLabel(key) {
  const [, m] = key.split('-')
  return MONTHS_ES[parseInt(m, 10) - 1]
}

export default function PlayerStatsSection({ player }) {
  const [matches, setMatches] = useState([])
  const [xpEvents, setXpEvents] = useState([])
  const [trophies, setTrophies] = useState([])
  const [tournamentEntries, setTournamentEntries] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!player?.id) {
      const timer = window.setTimeout(() => setIsLoading(false), 0)
      return () => window.clearTimeout(timer)
    }
    const pid = String(player.id)

    Promise.all([
      supabase
        .from('friendly_matches')
        .select('id, match_date, status, winner_player_id, created_by_player_id, opponent_player_id, score')
        .or(`created_by_player_id.eq.${pid},opponent_player_id.eq.${pid}`)
        .eq('status', 'confirmed')
        .order('match_date', { ascending: false })
        .limit(60),
      supabase
        .from('xp_events')
        .select('amount, source, created_at')
        .eq('player_id', pid)
        .order('created_at', { ascending: false })
        .limit(60),
      supabase
        .from('tournament_trophies')
        .select('id, tournament_title, won_at, category, age_group')
        .eq('player_id', pid)
        .order('won_at', { ascending: false }),
      supabase
        .from('tournament_entries')
        .select('status, final_position, xp_awarded, tournament_id')
        .eq('player_id', pid)
        .neq('status', 'withdrawn')
        .order('created_at', { ascending: false })
        .limit(20),
    ]).then(([m, xp, tr, te]) => {
      setMatches(m.data || [])
      setXpEvents(xp.data || [])
      setTrophies(tr.data || [])
      setTournamentEntries(te.data || [])
      setIsLoading(false)
    })
  }, [player?.id])

  const pid = String(player?.id || '')

  const { wins, losses, winPct } = useMemo(() => {
    const w = matches.filter((m) => m.winner_player_id && String(m.winner_player_id) === pid).length
    const l = matches.filter((m) => m.winner_player_id && String(m.winner_player_id) !== pid).length
    const pct = w + l > 0 ? Math.round((w / (w + l)) * 100) : 0
    return { wins: w, losses: l, winPct: pct }
  }, [matches, pid])

  // Last 20 matches as W/L array (newest last for left-to-right reading)
  const last20 = useMemo(() => {
    return [...matches].slice(0, 20).reverse().map((m) => ({
      id: m.id,
      won: m.winner_player_id ? String(m.winner_player_id) === pid : null,
      date: m.match_date,
    }))
  }, [matches, pid])

  // Win% trend by month (last 6 months with data)
  const monthlyTrend = useMemo(() => {
    const byMonth = new Map()
    matches.forEach((m) => {
      if (!m.match_date || !m.winner_player_id) return
      const key = monthKey(m.match_date)
      if (!byMonth.has(key)) byMonth.set(key, { w: 0, l: 0 })
      const row = byMonth.get(key)
      if (String(m.winner_player_id) === pid) row.w++ ; else row.l++
    })
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, { w, l }]) => ({
        label: monthLabel(key),
        pct: w + l > 0 ? Math.round((w / (w + l)) * 100) : 0,
        total: w + l,
      }))
  }, [matches, pid])

  // XP by source
  const xpBySource = useMemo(() => {
    const map = new Map()
    xpEvents.forEach(({ source, amount }) => {
      map.set(source, (map.get(source) || 0) + amount)
    })
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0)
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([source, amount]) => ({ source, amount, pct: total > 0 ? Math.round((amount / total) * 100) : 0 }))
  }, [xpEvents])

  const totalXP = xpEvents.reduce((s, e) => s + e.amount, 0)

  const entryStatusMap = {
    champion: { label: 'Campeón', color: 'text-amber-600' },
    runner_up: { label: 'Finalista', color: 'text-open-ink' },
    eliminated: { label: 'Eliminado', color: 'text-open-muted' },
    registered: { label: 'Inscrito', color: 'text-open-muted' },
  }

  if (isLoading) return null

  return (
    <div className="grid gap-5">
      {/* Record & sparkline */}
      <section className="border border-open-light bg-open-surface p-5">
        <SectionTitle title="Rendimiento en partidos" />
        <div className="mt-5 grid gap-5 md:grid-cols-[auto_1fr]">
          {/* Record */}
          <div className="flex items-center gap-6">
            <RecordBlock label="Victorias" value={wins} accent />
            <RecordBlock label="Derrotas" value={losses} />
            <RecordBlock label="Win %" value={`${winPct}%`} accent={winPct >= 50} />
          </div>

          {/* Win% ring */}
          <div className="flex items-center gap-4">
            <RingChart pct={winPct} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-open-muted">Efectividad</p>
              <p className="mt-1 text-sm text-open-muted">{matches.length} partidos confirmados</p>
            </div>
          </div>
        </div>

        {last20.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-open-muted">
              Últimos {last20.length} partidos
            </p>
            <div className="flex flex-wrap gap-1.5">
              {last20.map((m) => (
                <div
                  key={m.id}
                  title={m.won === null ? 'Sin resultado' : m.won ? 'Victoria' : 'Derrota'}
                  className={[
                    'h-4 w-4 rounded-sm',
                    m.won === null ? 'bg-open-light' :
                    m.won ? 'bg-open-primary' : 'bg-open-light/80 border border-open-light',
                  ].join(' ')}
                />
              ))}
              <span className="ml-2 self-center text-xs text-open-muted">
                ■ Victoria &nbsp; □ Derrota
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Monthly win% trend */}
      {monthlyTrend.length >= 2 && (
        <section className="border border-open-light bg-open-surface p-5">
          <SectionTitle title="Win % por mes" />
          <div className="mt-5">
            <BarChart
              data={monthlyTrend.map((m) => ({ label: m.label, value: m.pct, sub: `${m.total}p` }))}
              maxValue={100}
              color="bg-open-primary"
              unit="%"
            />
          </div>
        </section>
      )}

      {/* XP breakdown */}
      {xpBySource.length > 0 && (
        <section className="border border-open-light bg-open-surface p-5">
          <SectionTitle title="XP acumulado" />
          <div className="mt-4 flex items-center gap-4">
            <p className="text-4xl font-bold text-open-ink">{totalXP.toLocaleString('es')}</p>
            <p className="text-sm text-open-muted">XP total</p>
          </div>
          <div className="mt-4 grid gap-2">
            {xpBySource.map(({ source, amount, pct }) => (
              <div key={source} className="grid gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-open-ink capitalize">{sourceLabel(source)}</span>
                  <span className="text-open-muted">+{amount} XP · {pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-open-light">
                  <div className="h-full bg-open-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trophies + tournament history */}
      {(trophies.length > 0 || tournamentEntries.length > 0) && (
        <section className="border border-open-light bg-open-surface p-5">
          <SectionTitle title="Torneos" />
          {trophies.length > 0 && (
            <div className="mt-4 grid gap-2">
              {trophies.map((t, i) => (
                <Link
                  key={t.id || i}
                  to={`/trophies/${t.id}`}
                  className="flex items-center gap-3 border border-amber-200 bg-amber-50 px-3 py-2 transition hover:border-open-primary dark:border-amber-800 dark:bg-amber-900/20"
                >
                  <span className="text-lg">🏆</span>
                  <div>
                    <p className="text-sm font-semibold text-open-ink">{t.tournament_title}</p>
                    <p className="text-xs text-open-muted">
                      {t.won_at}
                      {t.category ? ` · Cat. ${t.category}` : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {tournamentEntries.length > 0 && (
            <div className="mt-3 grid gap-1.5">
              {tournamentEntries.slice(0, 8).map((e, i) => {
                const { label, color } = entryStatusMap[e.status] || { label: e.status, color: 'text-open-muted' }
                return (
                  <div key={i} className="flex items-center justify-between border border-open-light bg-open-bg px-3 py-2 text-xs">
                    <span className={`font-semibold ${color}`}>{label}</span>
                    {e.xp_awarded > 0 && <span className="text-open-muted">+{e.xp_awarded} XP</span>}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function RecordBlock({ label, value, accent }) {
  return (
    <div className="text-center">
      <p className={['text-3xl font-bold', accent ? 'text-open-ink' : 'text-open-muted'].join(' ')}>{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-open-muted">{label}</p>
    </div>
  )
}

function RingChart({ pct }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg viewBox="0 0 72 72" className="h-16 w-16 shrink-0">
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

function BarChart({ data, maxValue, color, unit = '' }) {
  return (
    <div className="flex items-end gap-2">
      {data.map((item, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-semibold text-open-muted">
            {item.value}{unit}
          </span>
          <div className="w-full bg-open-light" style={{ height: '3rem' }}>
            <div
              className={`w-full ${color} transition-all`}
              style={{ height: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[10px] text-open-muted">{item.label}</span>
          {item.sub && <span className="text-[9px] text-open-muted">{item.sub}</span>}
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

function sourceLabel(source) {
  const map = {
    match: 'Partidos',
    match_win: 'Victorias',
    tournament: 'Torneos',
    training_attendance: 'Entrenamientos',
    achievement: 'Logros',
    daily_quest: 'Misiones',
    onboarding: 'Registro',
  }
  return map[source] || source.replace(/_/g, ' ')
}
