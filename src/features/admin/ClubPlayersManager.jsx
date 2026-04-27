import { useEffect, useMemo, useState } from 'react'
import { Link, Unlink, UserRound } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function ClubPlayersManager({ mode = 'manager' }) {
  const [club, setClub] = useState(null)
  const [players, setPlayers] = useState([])
  const [filter, setFilter] = useState('all')
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
        const { data: coachProfile, error: coachError } = await supabase
          .from('players')
          .select('club_id')
          .eq('user_id', userData.user.id)
          .maybeSingle()

        if (coachError) {
          clubError = coachError
        } else if (coachProfile?.club_id) {
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

      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('id, full_name, email, level, xp, club_id, is_coach')
        .order('full_name', { ascending: true })

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

  const visiblePlayers = useMemo(() => {
    if (!club) return []

    if (filter === 'club') {
      return players.filter((player) => player.club_id === club.id)
    }

    if (filter === 'available') {
      return players.filter((player) => !player.club_id)
    }

    return players
  }, [club, filter, players])

  const linkPlayer = async (player) => {
    if (!club) return

    setUpdatingId(player.id)
    setError('')
    setMessage('')

    const { data, error: updateError } = await supabase
      .from('players')
      .update({ club_id: club.id })
      .eq('id', player.id)
      .select('id, full_name, email, level, xp, club_id, is_coach')
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
      .update({ club_id: null })
      .eq('id', player.id)
      .select('id, full_name, email, level, xp, club_id, is_coach')
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
        <p className="border border-open-light bg-open-bg px-4 py-3 text-sm text-open-muted">
          {error}
        </p>
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
                    {player.email} · LVL {player.level || 1} ·{' '}
                    {(player.xp || 0).toLocaleString()} XP
                  </p>
                </div>
              </div>

              {belongsToClub ? (
                <button
                  type="button"
                  onClick={() => unlinkPlayer(player)}
                  disabled={updatingId === player.id}
                  className="inline-flex h-10 items-center justify-center gap-2 border border-open-light bg-open-surface px-3 text-sm font-semibold text-open-ink transition hover:border-open-primary disabled:opacity-50"
                >
                  <Unlink size={16} strokeWidth={1.8} />
                  Quitar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => linkPlayer(player)}
                  disabled={updatingId === player.id || belongsElsewhere}
                  className="inline-flex h-10 items-center justify-center gap-2 bg-black px-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-open-muted"
                >
                  <Link size={16} strokeWidth={1.8} />
                  {belongsElsewhere ? 'En otro club' : 'Agregar'}
                </button>
              )}
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

export default ClubPlayersManager
