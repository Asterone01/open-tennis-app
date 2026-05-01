import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Check, ChevronDown, ChevronUp, UserRound } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import useManagerClub from '../../hooks/useManagerClub'

const PLANS = ['standard', 'premium', 'student', 'courtesy']
const PAYMENT_STATUSES = ['pending', 'paid', 'overdue', 'waived']
const MEMBERSHIP_STATUSES = ['pending', 'approved', 'rejected', 'unassigned']
const ROLE_FILTERS = ['player', 'coach', 'admin']

const PLAN_LABELS = { standard: 'Estándar', premium: 'Premium', student: 'Estudiante', courtesy: 'Cortesía' }
const STATUS_LABELS = { pending: 'Pendiente', paid: 'Pagado', overdue: 'Vencido', waived: 'Exento', unknown: 'Pendiente' }
const MEMBERSHIP_LABELS = { pending: 'Por aprobar', approved: 'Aprobada', rejected: 'Rechazada', unassigned: 'Sin club' }
const ROLE_LABELS = { player: 'Player', coach: 'Coach', admin: 'Admin' }
const STATUS_STYLES = {
  paid: 'border-open-primary text-open-primary',
  overdue: 'border-red-500 text-red-500',
  pending: 'border-open-light text-open-muted',
  waived: 'border-open-light text-open-muted',
  unknown: 'border-open-light text-open-muted',
}

function MembershipsView({ embedded = false }) {
  const { clubId, isLoading: isClubLoading } = useManagerClub()
  const [players, setPlayers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMembership, setFilterMembership] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [saving, setSaving] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadMemberships = async () => {
      if (!clubId) {
        if (isMounted) {
          setPlayers([])
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      setError('')

      const { data, error: loadError } = await supabase
        .from('players')
        .select(
          'id, full_name, email, avatar_url, level, role, current_category, club_membership_status, is_coach, membership_id, membership_since, membership_plan, membership_payment_status, membership_next_payment_date, membership_last_payment_date, membership_notes',
        )
        .eq('club_id', clubId)
        .order('full_name', { ascending: true })

      if (!isMounted) return
      if (loadError) setError(loadError.message)
      else setPlayers(data || [])
      setIsLoading(false)
    }

    loadMemberships()

    return () => {
      isMounted = false
    }
  }, [clubId])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return players.filter((p) => {
      if (filterStatus) {
        const st = p.membership_payment_status || 'unknown'
        if (st !== filterStatus) return false
      }
      if (filterMembership) {
        const st = p.club_membership_status || 'unassigned'
        if (st !== filterMembership) return false
      }
      if (filterRole && resolveMemberRole(p) !== filterRole) return false
      if (q) {
        const name = (p.full_name || p.email || '').toLowerCase()
        if (!name.includes(q)) return false
      }
      return true
    })
  }, [players, search, filterStatus, filterMembership, filterRole])

  const kpis = useMemo(() => {
    const total = players.length
    const paid = players.filter((p) => p.membership_payment_status === 'paid').length
    const overdue = players.filter((p) => p.membership_payment_status === 'overdue').length
    const pending = players.filter((p) => p.club_membership_status === 'pending').length
    const coaches = players.filter((p) => resolveMemberRole(p) === 'coach').length
    const admins = players.filter((p) => resolveMemberRole(p) === 'admin').length
    return { total, paid, overdue, pending, coaches, admins }
  }, [players])

  const overdueList = useMemo(
    () => players.filter((p) => p.membership_payment_status === 'overdue'),
    [players],
  )

  const update = async (playerId, fields) => {
    setSaving(playerId)
    setMessage('')

    const { data, error: updateError } = await supabase
      .from('players')
      .update(fields)
      .eq('id', playerId)
      .select(
        'id, full_name, email, avatar_url, level, role, current_category, club_membership_status, is_coach, membership_id, membership_since, membership_plan, membership_payment_status, membership_next_payment_date, membership_last_payment_date, membership_notes',
      )
      .single()

    if (updateError) {
      setMessage(updateError.message)
    } else {
      setPlayers((curr) => curr.map((p) => (p.id === data.id ? data : p)))
      setMessage('Guardado.')
      setTimeout(() => setMessage(''), 2500)
    }

    setSaving('')
  }

  const handleMarkPaid = (playerId) =>
    update(playerId, {
      membership_payment_status: 'paid',
      membership_last_payment_date: todayIso(),
    })

  const handleMarkOverdue = (playerId) =>
    update(playerId, { membership_payment_status: 'overdue' })

  const handleApproveMembership = (player) =>
    update(player.id, {
      club_membership_status: 'approved',
      membership_id: player.membership_id || buildMembershipId(player.id),
      membership_since: player.membership_since || todayIso(),
      membership_payment_status:
        resolveMemberRole(player) === 'admin'
          ? 'waived'
          : player.membership_payment_status === 'unknown'
          ? 'pending'
          : player.membership_payment_status || 'pending',
      membership_plan:
        resolveMemberRole(player) === 'admin'
          ? 'courtesy'
          : player.membership_plan || 'standard',
    })

  const handleRejectMembership = (player) =>
    update(player.id, { club_membership_status: 'rejected' })

  if (isClubLoading) {
    return <p className="text-sm text-open-muted">Cargando club...</p>
  }

  if (!clubId) {
    return (
      <p className="border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
        No se encontró un club asociado a este manager.
      </p>
    )
  }

  return (
    <section className="grid gap-6">
      {/* Header — hidden when embedded inside a tab */}
      {!embedded && (
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
              Manager
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-open-ink md:text-5xl">
              Membresías
            </h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-open-muted">
            Estado de aprobacion, pagos, planes y fechas de vencimiento para players, coaches y admins.
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <KpiCard label="Miembros" value={kpis.total} />
        <KpiCard label="Coaches" value={kpis.coaches} />
        <KpiCard label="Admins" value={kpis.admins} />
        <KpiCard label="Por aprobar" value={kpis.pending} accent={kpis.pending > 0 ? 'primary' : undefined} />
        <KpiCard label="Al corriente" value={kpis.paid} accent="primary" />
        <KpiCard label="Vencidos" value={kpis.overdue} accent={kpis.overdue > 0 ? 'danger' : undefined} />
      </div>

      {/* Alerta vencidos */}
      {overdueList.length > 0 && (
        <div className="flex items-start gap-3 border border-red-400 bg-red-50 px-4 py-3 dark:bg-open-surface">
          <AlertTriangle size={18} strokeWidth={1.8} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-600">
              {overdueList.length} jugador{overdueList.length > 1 ? 'es' : ''} con pago vencido
            </p>
            <p className="mt-0.5 text-xs text-red-500">
              {overdueList.map((p) => p.full_name || p.email).join(', ')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFilterStatus('overdue')}
            className="ml-auto shrink-0 text-xs font-semibold text-red-600 transition hover:opacity-70"
          >
            Filtrar
          </button>
        </div>
      )}

      {message && (
        <p className="border border-open-light bg-open-surface px-4 py-3 text-sm font-semibold text-open-ink">
          {message}
        </p>
      )}

      {error && (
        <p className="border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      {/* Filtros */}
      <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar miembro..."
          className="h-11 border border-open-light bg-open-surface px-3 text-sm text-open-ink outline-none focus:border-open-primary"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="h-11 border border-open-light bg-open-surface px-3 text-sm text-open-ink outline-none focus:border-open-primary"
        >
          <option value="">Todos los roles</option>
          {ROLE_FILTERS.map((role) => (
            <option key={role} value={role}>{ROLE_LABELS[role]}</option>
          ))}
        </select>
        <select
          value={filterMembership}
          onChange={(e) => setFilterMembership(e.target.value)}
          className="h-11 border border-open-light bg-open-surface px-3 text-sm text-open-ink outline-none focus:border-open-primary"
        >
          <option value="">Todas las membresias</option>
          {MEMBERSHIP_STATUSES.map((s) => (
            <option key={s} value={s}>{MEMBERSHIP_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-11 border border-open-light bg-open-surface px-3 text-sm text-open-ink outline-none focus:border-open-primary"
        >
          <option value="">Todos los estados</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {filterStatus || filterMembership || filterRole || search ? (
        <div className="flex items-center gap-3">
          <p className="text-sm text-open-muted">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </p>
          <button
            type="button"
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterMembership(''); setFilterRole('') }}
            className="text-xs font-semibold text-open-primary transition hover:opacity-70"
          >
            Limpiar
          </button>
        </div>
      ) : null}

      {/* Lista */}
      <div className="grid divide-y divide-open-light border border-open-light bg-open-surface">
        {filtered.map((player) => (
          <MemberRow
            key={player.id}
            player={player}
            isExpanded={expandedId === player.id}
            isSaving={saving === player.id}
            onToggle={() => setExpandedId(expandedId === player.id ? null : player.id)}
            onMarkPaid={() => handleMarkPaid(player.id)}
            onMarkOverdue={() => handleMarkOverdue(player.id)}
            onApprove={() => handleApproveMembership(player)}
            onReject={() => handleRejectMembership(player)}
            onUpdate={(fields) => update(player.id, fields)}
          />
        ))}

        {!isLoading && filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-open-muted">
            No hay miembros con esos filtros.
          </p>
        )}
      </div>

      {isLoading && (
        <p className="text-sm text-open-muted">Cargando membresías...</p>
      )}
    </section>
  )
}

function MemberRow({ player, isExpanded, isSaving, onToggle, onMarkPaid, onMarkOverdue, onApprove, onReject, onUpdate }) {
  const [nextDate, setNextDate] = useState(player.membership_next_payment_date || '')
  const [plan, setPlan] = useState(player.membership_plan || 'standard')
  const [notes, setNotes] = useState(player.membership_notes || '')

  const status = player.membership_payment_status || 'unknown'
  const membershipStatus = player.club_membership_status || 'unassigned'
  const memberRole = resolveMemberRole(player)
  const initials = getInitials(player.full_name || player.email || 'OPEN')
  const isOverdue = status === 'overdue'
  const nextPaymentSoon =
    player.membership_next_payment_date &&
    daysBetween(new Date(), new Date(player.membership_next_payment_date)) <= 7 &&
    status !== 'paid'

  return (
    <article className={isOverdue ? 'bg-red-50/40 dark:bg-open-bg' : ''}>
      {/* Main row */}
      <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden border border-open-light bg-open-bg text-sm font-semibold text-open-ink">
            {player.avatar_url ? (
              <img src={player.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : initials ? (
              initials
            ) : (
              <UserRound size={16} strokeWidth={1.8} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-open-ink">
                {player.full_name || player.email}
              </p>
              <span
                className={[
                  'border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]',
                  STATUS_STYLES[status] || STATUS_STYLES.unknown,
                ].join(' ')}
              >
                {STATUS_LABELS[status]}
              </span>
              <span className="border border-open-light px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-open-muted">
                {ROLE_LABELS[memberRole]}
              </span>
              <span className="border border-open-light px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-open-muted">
                {MEMBERSHIP_LABELS[membershipStatus] || membershipStatus}
              </span>
              {nextPaymentSoon && (
                <span className="border border-yellow-400 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-600">
                  Vence pronto
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-open-muted">
              {player.membership_id || '—'} ·{' '}
              {PLAN_LABELS[player.membership_plan] || 'Estándar'} ·{' '}
              Desde {formatDate(player.membership_since)}
            </p>
            <p className="mt-0.5 text-xs text-open-muted">
              Próximo pago: {formatDate(player.membership_next_payment_date)} ·{' '}
              Último pago: {formatDate(player.membership_last_payment_date)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="grid h-9 w-9 shrink-0 place-items-center border border-open-light bg-open-bg text-open-muted transition hover:border-open-ink"
        >
          {isExpanded ? <ChevronUp size={16} strokeWidth={1.8} /> : <ChevronDown size={16} strokeWidth={1.8} />}
        </button>
      </div>

      {/* Expanded controls */}
      {isExpanded && (
        <div className="grid gap-4 border-t border-open-light bg-open-bg px-4 py-4">
          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            {membershipStatus !== 'approved' ? (
              <button
                type="button"
                onClick={onApprove}
                disabled={isSaving}
                className="inline-flex h-9 items-center gap-1.5 bg-open-primary px-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check size={13} strokeWidth={2} />
                Aprobar membresia
              </button>
            ) : null}
            {membershipStatus !== 'rejected' ? (
              <button
                type="button"
                onClick={onReject}
                disabled={isSaving}
                className="inline-flex h-9 items-center gap-1.5 border border-open-light bg-open-surface px-3 text-xs font-semibold text-open-muted transition hover:border-red-400 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Rechazar
              </button>
            ) : null}
            <button
              type="button"
              onClick={onMarkPaid}
              disabled={isSaving || status === 'paid'}
              className="inline-flex h-9 items-center gap-1.5 bg-open-ink px-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={13} strokeWidth={2} />
              Marcar como pagado
            </button>
            <button
              type="button"
              onClick={onMarkOverdue}
              disabled={isSaving || status === 'overdue'}
              className="inline-flex h-9 items-center gap-1.5 border border-red-400 bg-open-surface px-3 text-xs font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Marcar como vencido
            </button>
            <Link
              to={`/players/${player.id}`}
              className="inline-flex h-9 items-center border border-open-light bg-open-surface px-3 text-xs font-semibold text-open-ink transition hover:border-open-primary"
            >
              Ver perfil
            </Link>
          </div>

          {/* Edit fields */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-open-muted">
                Plan
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="h-10 border border-open-light bg-open-surface px-3 text-sm text-open-ink outline-none focus:border-open-primary"
              >
                {PLANS.map((p) => (
                  <option key={p} value={p}>{PLAN_LABELS[p]}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-open-muted">
                Próximo pago
              </label>
              <input
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                className="h-10 border border-open-light bg-open-surface px-3 text-sm text-open-ink outline-none focus:border-open-primary"
              />
            </div>

            <div className="grid gap-1.5 sm:col-span-1">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-open-muted">
                Notas
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: beca, descuento, etc."
                className="h-10 border border-open-light bg-open-surface px-3 text-sm text-open-ink outline-none focus:border-open-primary"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={() =>
              onUpdate({
                membership_plan: plan,
                membership_next_payment_date: nextDate || null,
                membership_notes: notes || null,
              })
            }
            className="h-10 justify-self-start border border-open-light bg-open-surface px-4 text-sm font-semibold text-open-ink transition hover:border-open-primary disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      )}
    </article>
  )
}

function KpiCard({ label, value, accent }) {
  const borderClass =
    accent === 'primary'
      ? 'border-open-primary'
      : accent === 'danger'
      ? 'border-red-400'
      : 'border-open-light'

  return (
    <article className={`border bg-open-surface p-5 ${borderClass}`}>
      <p className="text-sm font-semibold text-open-muted">{label}</p>
      <p className="mt-4 text-4xl font-semibold text-open-ink">{value}</p>
    </article>
  )
}

function getInitials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

function resolveMemberRole(player) {
  if (player.role === 'manager') return 'admin'
  if (player.is_coach) return 'coach'
  return 'player'
}

function buildMembershipId(playerId) {
  return `OPEN-${String(playerId || '').replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()}`
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(`${value}T00:00:00`),
  )
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

export default MembershipsView
