import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Eye, Link as LinkIcon, Unlink, UserRound } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import JoinClubModal from '../profile/JoinClubModal'
import { ensurePlayerProfile } from '../profile/profileConnections'

const playerSelect =
  'id, full_name, email, level, xp, club_id, is_coach, club_membership_status, current_category, suggested_category, age_group, membership_id, membership_since, membership_plan, membership_payment_status, membership_next_payment_date, membership_last_payment_date'

function ClubPlayersManager({ mode = 'manager' }) {
  const [club, setClub] = useState(null)
  const [currentPlayer, setCurrentPlayer] = useState(null)
  const [players, setPlayers] = useState([])
  const [filter, setFilter] = useState('all')
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setIsLoading(true)
      setError('')

      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (!isMounted) return

      if (userError || !userData.user) {
        setError(userError?.message || 'No se pudo cargar el manager.')
        setIsLoading(false)
        return
      }

      let clubData = null
      let clubError = null

      if (mode === 'coach') {
        const { data: coachProfileData, error: coachError } = await supabase
          .from('players')
          .select(
            'id, user_id, email, full_name, role, club_id, is_coach, club_membership_status',
          )
          .eq('user_id', userData.user.id)
          .maybeSingle()

        let coachProfile = coachProfileData

        if (coachError) {
          clubError = coachError
        } else if (!coachProfile) {
          const { data: ensuredProfile, error: ensureError } =
            await ensurePlayerProfile(userData.user, {
              role: 'coach',
              is_coach: true,
              force: true,
            })

          if (ensureError) {
            clubError = ensureError
          } else {
            coachProfile = ensuredProfile
          }
        }

        if (!clubError) {
          setCurrentPlayer(coachProfile || null)
        }

        if (coachProfile?.club_id) {
          const response = await supabase
            .from('clubs')
            .select('id, name')
            .eq('id', coachProfile.club_id)
            .maybeSingle()

          clubData = response.data
          clubError = response.error
        }
      } else {
        const response = await supabase
          .from('clubs')
          .select('id, name')
          .eq('manager_id', userData.user.id)
          .maybeSingle()

        clubData = response.data
        clubError = response.error
      }

      if (!isMounted) return

      if (clubError || !clubData) {
        setError(
          clubError?.message ||
            (mode === 'coach'
              ? 'Primero vincula tu perfil de coach a un club.'
              : 'Primero crea o guarda tu club.'),
        )
        setIsLoading(false)
        return
      }

      setClub(clubData)

      let playersQuery = supabase
        .from('players')
        .select(playerSelect)
        .order('full_name', { ascending: true })

      if (mode === 'coach') {
        playersQuery = playersQuery.or(`club_id.is.null,club_id.eq.${clubData.id}`)
      }

      const { data: playersData, error: playersError } = await playersQuery

      if (!isMounted) return

      if (playersError) {
        setError(playersError.message)
      } else {
        setPlayers(playersData || [])
      }

      setIsLoading(false)
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [mode])

  const handleCoachJoined = async (joinedClub) => {
    setClub(joinedClub)
    setMessage(`Tu perfil de coach fue vinculado a ${joinedClub.name}.`)
    setError('')

    const { data: userData } = await supabase.auth.getUser()

    if (userData.user) {
      const { data } = await supabase
        .from('players')
        .select(
          'id, user_id, email, full_name, club_id, is_coach, club_membership_status',
        )
        .eq('user_id', userData.user.id)
        .maybeSingle()

      setCurrentPlayer(data || null)
    }

    const { data: playersData, error: playersError } = await supabase
      .from('players')
      .select(playerSelect)
      .or(`club_id.is.null,club_id.eq.${joinedClub.id}`)
      .order('full_name', { ascending: true })

    if (playersError) {
      setError(playersError.message)
    } else {
      setPlayers(playersData || [])
    }
  }

  const visiblePlayers = useMemo(() => {
    if (!club) return []

    const managedPlayers =
      mode === 'coach'
        ? players.filter((player) => !player.is_coach)
        : players

    if (filter === 'club') {
      return managedPlayers.filter((player) => player.club_id === club.id)
    }

    if (filter === 'available') {
      return managedPlayers.filter((player) => !player.club_id)
    }

    return managedPlayers
  }, [club, filter, mode, players])

  const linkPlayer = async (player) => {
    if (!club) return

    setUpdatingId(player.id)
    setError('')
    setMessage('')

    const { data, error: updateError } = await supabase
      .from('players')
      .update({
        club_id: club.id,
        club_membership_status: 'approved',
        membership_since: player.membership_since || todayIsoDate(),
        membership_payment_status:
          player.membership_payment_status === 'unknown'
            ? 'pending'
            : player.membership_payment_status || 'pending',
      })
      .eq('id', player.id)
      .select(playerSelect)
      .single()

    if (updateError) {
      setError(updateError.message)
    } else {
      setPlayers((current) =>
        current.map((item) => (item.id === data.id ? data : item)),
      )
      setMessage(`${data.full_name || data.email} fue vinculado al club.`)
    }

    setUpdatingId('')
  }

  const unlinkPlayer = async (player) => {
    setUpdatingId(player.id)
    setError('')
    setMessage('')

    const { data, error: updateError } = await supabase
      .from('players')
      .update({ club_id: null, club_membership_status: 'unassigned' })
      .eq('id', player.id)
      .select(playerSelect)
      .single()

    if (updateError) {
      setError(updateError.message)
    } else {
      setPlayers((current) =>
        current.map((item) => (item.id === data.id ? data : item)),
      )
      setMessage(`${data.full_name || data.email} fue removido del club.`)
    }

    setUpdatingId('')
  }

  return (
    <section className="grid gap-5 border border-open-light bg-open-surface p-5 md:p-6">
      <JoinClubModal
        isOpen={isJoinOpen}
        player={currentPlayer}
        onClose={() => setIsJoinOpen(false)}
        onJoined={handleCoachJoined}
      />

      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-open-muted">Jugadores OPEN</p>
          <h2 className="mt-2 text-2xl font-semibold text-open-ink">
            {mode === 'coach'
              ? 'Agregar alumnos al club'
              : 'Vincular jugadores al club'}
          </h2>
        </div>
        <div className="grid grid-cols-3 border border-open-light bg-open-bg p-1 text-sm font-semibold">
          {[
            ['all', 'Todos'],
            ['available', 'Sin club'],
            ['club', 'Mi club'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={[
                'h-9 px-3 transition',
                filter === value ? 'bg-black text-white' : 'text-open-muted',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="grid gap-3 border border-open-light bg-open-bg px-4 py-3 text-sm text-open-muted">
          <p>{error}</p>
          {mode === 'coach' ? (
            <button
              type="button"
              onClick={() => setIsJoinOpen(true)}
              className="h-10 justify-self-start bg-open-primary px-4 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Vincular mi coach a un club
            </button>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <p className="border border-open-light bg-open-bg px-4 py-3 text-sm text-open-ink">
          {message}
        </p>
      ) : null}

      <div className="grid gap-2">
        {visiblePlayers.map((player) => {
          const belongsToClub = player.club_id === club?.id
          const belongsElsewhere = player.club_id && !belongsToClub
          const category =
            player.current_category || player.suggested_category || 'pendiente'
          const membership = belongsToClub
            ? formatMembership(player.club_membership_status, true)
            : formatMembership(player.club_membership_status)
          const isPendingApproval =
            belongsToClub && player.club_membership_status === 'pending'

          return (
            <article
              key={player.id}
              className="grid gap-3 border border-open-light bg-open-bg p-4 md:grid-cols-[1fr_auto] md:items-center"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center border border-open-light bg-open-surface">
                  <UserRound size={18} strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-open-ink">
                    {player.full_name || 'Jugador OPEN'}
                  </h3>
                  <p className="mt-1 text-xs text-open-muted">
                    {player.email} - LVL {player.level || 1} -{' '}
                    {(player.xp || 0).toLocaleString()} XP
                  </p>
                  <p className="mt-1 text-xs text-open-muted">
                    Cat. {category} - {membership}
                  </p>
                  {belongsToClub ? (
                    <div className="mt-3 grid gap-2 text-xs text-open-muted sm:grid-cols-2 lg:grid-cols-4">
                      <MembershipDatum
                        label="ID"
                        value={player.membership_id || 'Pendiente'}
                      />
                      <MembershipDatum
                        label="Miembro desde"
                        value={formatDate(player.membership_since)}
                      />
                      <MembershipDatum
                        label="Proximo pago"
                        value={formatDate(player.membership_next_payment_date)}
                      />
                      <MembershipDatum
                        label="Pago"
                        value={formatPayment(player.membership_payment_status)}
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 md:justify-end">
                <RouterLink
                  to={`/players/${player.id}`}
                  className="inline-flex h-10 items-center justify-center gap-2 border border-open-light bg-open-surface px-3 text-sm font-semibold text-open-ink transition hover:border-open-primary"
                >
                  <Eye size={16} strokeWidth={1.8} />
                  Ver perfil
                </RouterLink>

                {belongsToClub ? (
                  <>
                    {isPendingApproval ? (
                      <button
                        type="button"
                        onClick={() => linkPlayer(player)}
                        disabled={updatingId === player.id}
                        className="inline-flex h-10 items-center justify-center gap-2 bg-black px-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-open-muted"
                      >
                        <LinkIcon size={16} strokeWidth={1.8} />
                        Aprobar
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => unlinkPlayer(player)}
                      disabled={updatingId === player.id}
                      className="inline-flex h-10 items-center justify-center gap-2 border border-open-light bg-open-surface px-3 text-sm font-semibold text-open-ink transition hover:border-open-primary disabled:opacity-50"
                    >
                      <Unlink size={16} strokeWidth={1.8} />
                      Quitar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => linkPlayer(player)}
                    disabled={updatingId === player.id || belongsElsewhere}
                    className="inline-flex h-10 items-center justify-center gap-2 bg-black px-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-open-muted"
                  >
                    <LinkIcon size={16} strokeWidth={1.8} />
                    {belongsElsewhere ? 'En otro club' : 'Agregar'}
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {!isLoading && visiblePlayers.length === 0 ? (
        <p className="border border-open-light bg-open-bg px-4 py-8 text-center text-sm text-open-muted">
          No hay jugadores en esta vista.
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-open-muted">Cargando jugadores...</p>
      ) : null}
    </section>
  )
}

function formatMembership(value, belongsToClub = false) {
  const labels = {
    unassigned: 'Sin club',
    pending: 'Pendiente',
    approved: 'Aprobada',
    rejected: 'Rechazada',
  }

  if (belongsToClub && (!value || value === 'unassigned')) {
    return 'Aprobada'
  }

  return labels[value] || 'Sin club'
}

function MembershipDatum({ label, value }) {
  return (
    <span className="border border-open-light bg-open-surface px-2 py-1">
      <span className="font-semibold text-open-ink">{label}:</span> {value}
    </span>
  )
}

function formatDate(value) {
  if (!value) return 'Pendiente'

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function formatPayment(value) {
  const labels = {
    unknown: 'Pendiente',
    pending: 'Pendiente',
    paid: 'Pagado',
    overdue: 'Vencido',
    waived: 'Exento',
  }

  return labels[value] || 'Pendiente'
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

export default ClubPlayersManager
