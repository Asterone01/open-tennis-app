import { useEffect, useMemo, useState } from 'react'
import { Check, ClipboardList, Swords, Trophy, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import usePlayerProfile from '../profile/usePlayerProfile'

const matchStatFields = [
  { key: 'aces', label: 'Aces' },
  { key: 'double_faults', label: 'Dobles faltas' },
  { key: 'winners', label: 'Winners' },
  { key: 'unforced_errors', label: 'Errores no forzados' },
  { key: 'forced_errors', label: 'Errores forzados' },
  { key: 'match_points', label: 'Puntos de partido' },
  { key: 'points_against', label: 'Puntos en contra' },
]

function FriendlyMatchesView() {
  const { player: currentPlayer, profile, isLoading: isProfileLoading } =
    usePlayerProfile()
  const [players, setPlayers] = useState([])
  const [matches, setMatches] = useState([])
  const [form, setForm] = useState(createDefaultForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const opponent = useMemo(
    () => players.find((player) => String(player.id) === form.opponentId),
    [form.opponentId, players],
  )

  useEffect(() => {
    let isMounted = true

    const loadBase = async () => {
      if (isProfileLoading) return

      setIsLoading(true)
      setError('')

      if (!currentPlayer?.id || !profile.clubId) {
        setPlayers([])
        setMatches([])
        setIsLoading(false)
        return
      }

      const [playersResponse, matchesResponse] = await Promise.all([
        supabase
          .from('players')
          .select('id, user_id, full_name, email, xp, level, club_id, current_category, suggested_category, is_coach, club_membership_status')
          .eq('club_id', profile.clubId)
          .or('is_coach.is.null,is_coach.eq.false')
          .neq('club_membership_status', 'rejected')
          .order('full_name', { ascending: true }),
        supabase
          .from('friendly_matches')
          .select('*')
          .or(
            `created_by_player_id.eq.${currentPlayer.id},opponent_player_id.eq.${currentPlayer.id}`,
          )
          .order('match_date', { ascending: false })
          .limit(30),
      ])

      if (!isMounted) return

      if (playersResponse.error) {
        setError(playersResponse.error.message)
      } else if (matchesResponse.error) {
        setError(matchesResponse.error.message)
      } else {
        setPlayers(
          (playersResponse.data || []).filter(
            (player) => String(player.id) !== String(currentPlayer.id),
          ),
        )
        setMatches(matchesResponse.data || [])
      }

      setIsLoading(false)
    }

    loadBase()

    return () => {
      isMounted = false
    }
  }, [currentPlayer?.id, isProfileLoading, profile.clubId])

  const handleField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleOpponent = (value) => {
    setForm((current) => ({
      ...current,
      opponentId: value,
      winnerId:
        current.winnerId && current.winnerId !== value
          ? current.winnerId
          : String(currentPlayer?.id || ''),
    }))
  }

  const handleCreateMatch = async () => {
    if (!currentPlayer?.id || !profile.clubId) {
      setError('Necesitas pertenecer a un club para registrar partidos.')
      return
    }

    const score = formatScore(form.scoreSets)

    if (!opponent || !score || !form.winnerId) {
      setError('Selecciona rival, marcador y ganador.')
      return
    }

    setIsSaving(true)
    setError('')
    setToast('')

    const { data, error: insertError } = await supabase
      .from('friendly_matches')
      .insert({
        club_id: profile.clubId,
        created_by_player_id: String(currentPlayer.id),
        created_by_user_id: currentPlayer.user_id,
        opponent_player_id: String(opponent.id),
        opponent_user_id: opponent.user_id || null,
        winner_player_id: String(form.winnerId),
        match_type: 'singles',
        match_date: form.matchDate,
        court: form.court.trim() || null,
        score,
        score_sets: form.scoreSets,
        has_live_judge: form.isLiveMatch,
        is_live_match: form.isLiveMatch,
        creator_stats: form.creatorStats,
        opponent_stats: form.opponentStats,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
    } else {
      setMatches((current) => [data, ...current])
      setForm(createDefaultForm())
      setToast('Partido registrado. El rival debe confirmarlo para acreditar XP.')
    }

    setIsSaving(false)
  }

  const handleConfirmMatch = async (match) => {
    setIsSaving(true)
    setError('')
    setToast('')

    const { data, error: updateError } = await supabase.rpc(
      'open_confirm_friendly_match',
      { match_id: match.id },
    )

    if (updateError) {
      setError(updateError.message)
    } else {
      setMatches((current) =>
        current.map((item) => (item.id === data.id ? data : item)),
      )
      setToast('Partido confirmado. XP acreditado a ambos jugadores.')
    }

    setIsSaving(false)
  }

  const handleRejectMatch = async (match) => {
    setIsSaving(true)
    setError('')
    setToast('')

    const { data, error: updateError } = await supabase
      .from('friendly_matches')
      .update({ status: 'rejected', rejected_at: new Date().toISOString() })
      .eq('id', match.id)
      .select()
      .single()

    if (updateError) {
      setError(updateError.message)
    } else {
      setMatches((current) =>
        current.map((item) => (item.id === data.id ? data : item)),
      )
      setToast('Partido rechazado. No se acredito XP.')
    }

    setIsSaving(false)
  }

  return (
    <section className="grid gap-6 bg-open-bg">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
            Competencia
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-open-ink md:text-5xl">
            Partidos amistosos
          </h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-open-muted">
          Registra singles, confirma resultados y acredita XP automaticamente.
        </p>
      </div>

      {error ? (
        <p className="border border-open-light bg-open-surface px-4 py-3 text-sm text-open-muted">
          {error}
        </p>
      ) : null}

      {toast ? (
        <p className="border border-open-light bg-open-surface px-4 py-3 text-sm font-semibold text-open-ink">
          {toast}
        </p>
      ) : null}

      {!profile.clubId && !isProfileLoading ? (
        <p className="border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
          Unete a un club para registrar partidos amistosos.
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <CreateMatchForm
          currentPlayer={currentPlayer}
          form={form}
          isSaving={isSaving}
          opponent={opponent}
          players={players}
          onCreate={handleCreateMatch}
          onField={handleField}
          onOpponent={handleOpponent}
          onSetScore={(setIndex, side, value) =>
            setForm((current) => ({
              ...current,
              scoreSets: current.scoreSets.map((set, index) =>
                index === setIndex ? { ...set, [side]: value } : set,
              ),
            }))
          }
          onStat={(side, key, value) =>
            setForm((current) => ({
              ...current,
              [side]: {
                ...current[side],
                [key]: Math.max(Number(value) || 0, 0),
              },
            }))
          }
        />

        <MatchHistory
          currentPlayer={currentPlayer}
          isSaving={isSaving}
          matches={matches}
          players={players}
          onConfirm={handleConfirmMatch}
          onReject={handleRejectMatch}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-open-muted">Cargando partidos...</p>
      ) : null}
    </section>
  )
}

function CreateMatchForm({
  currentPlayer,
  form,
  isSaving,
  opponent,
  players,
  onCreate,
  onField,
  onOpponent,
  onSetScore,
  onStat,
}) {
  const score = formatScore(form.scoreSets)

  return (
    <article className="grid gap-4 border border-open-light bg-open-surface p-5">
      <div className="flex items-center gap-3">
        <Swords size={18} strokeWidth={1.8} />
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-open-muted">
          Registro rapido
        </h2>
      </div>

      <select
        value={form.opponentId}
        onChange={(event) => onOpponent(event.target.value)}
        className="h-11 border border-open-light bg-open-bg px-3 text-sm text-open-ink outline-none focus:border-open-primary"
      >
        <option value="">Selecciona rival</option>
        {players.map((player) => (
          <option key={player.id} value={player.id}>
            {player.full_name || player.email}
          </option>
        ))}
      </select>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="date"
          value={form.matchDate}
          onChange={(event) => onField('matchDate', event.target.value)}
          className="h-11 border border-open-light bg-open-bg px-3 text-sm text-open-ink outline-none focus:border-open-primary"
        />
        <input
          value={form.court}
          onChange={(event) => onField('court', event.target.value)}
          placeholder="Cancha"
          className="h-11 border border-open-light bg-open-bg px-3 text-sm text-open-ink outline-none focus:border-open-primary"
        />
      </div>

      <ScoreDial
        opponent={opponent}
        scoreSets={form.scoreSets}
        onSetScore={onSetScore}
      />

      {score ? (
        <p className="border border-open-light bg-open-bg px-3 py-2 text-sm font-semibold text-open-ink">
          Marcador: {score}
        </p>
      ) : null}

      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
          Ganador
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <WinnerButton
            isSelected={form.winnerId === String(currentPlayer?.id || '')}
            label="Yo gane"
            onClick={() => onField('winnerId', String(currentPlayer?.id || ''))}
          />
          <WinnerButton
            isSelected={form.winnerId === String(opponent?.id || '')}
            label={opponent ? `${opponent.full_name || 'Rival'} gano` : 'Rival gano'}
            onClick={() => onField('winnerId', String(opponent?.id || ''))}
            disabled={!opponent}
          />
        </div>
      </div>

      <label className="flex items-center justify-between gap-3 border border-open-light bg-open-bg px-3 py-3 text-sm font-semibold text-open-ink">
        <span>
          <span className="block">Partido en vivo</span>
          <span className="mt-1 block text-xs font-normal text-open-muted">
            Una tercera persona registra marcador y estadisticas.
          </span>
        </span>
        <input
          type="checkbox"
          checked={form.isLiveMatch}
          onChange={(event) => onField('isLiveMatch', event.target.checked)}
          className="h-4 w-4 accent-black"
        />
      </label>

      <MatchStatsEditor
        currentPlayer={currentPlayer}
        creatorStats={form.creatorStats}
        opponent={opponent}
        opponentStats={form.opponentStats}
        onStat={onStat}
      />

      <button
        type="button"
        onClick={onCreate}
        disabled={isSaving}
        className="inline-flex h-11 items-center justify-center gap-2 bg-open-primary px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-open-muted"
      >
        <ClipboardList size={16} strokeWidth={1.8} />
        {isSaving ? 'Guardando...' : 'Registrar partido'}
      </button>
    </article>
  )
}

function ScoreDial({ opponent, scoreSets, onSetScore }) {
  return (
    <div className="grid gap-3 border border-open-light bg-open-bg p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
        Marcador por sets
      </p>
      <div className="grid gap-2">
        {scoreSets.map((set, index) => (
          <div
            key={index}
            className="grid grid-cols-[56px_1fr_1fr] items-center gap-2"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-open-muted">
              Set {index + 1}
            </span>
            <ScoreStepper
              label="Yo"
              value={set.player}
              onChange={(value) => onSetScore(index, 'player', value)}
            />
            <ScoreStepper
              label={opponent?.full_name || 'Rival'}
              value={set.opponent}
              onChange={(value) => onSetScore(index, 'opponent', value)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function ScoreStepper({ label, value, onChange }) {
  return (
    <div className="grid grid-cols-[32px_1fr_32px] items-center border border-open-light bg-open-surface">
      <button
        type="button"
        onClick={() => onChange(Math.max(value - 1, 0))}
        className="h-10 text-lg font-semibold text-open-muted"
      >
        -
      </button>
      <div className="text-center">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-open-muted">
          {label}
        </span>
        <span className="block text-lg font-semibold text-open-ink">{value}</span>
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(value + 1, 99))}
        className="h-10 text-lg font-semibold text-open-ink"
      >
        +
      </button>
    </div>
  )
}

function MatchStatsEditor({
  currentPlayer,
  creatorStats,
  opponent,
  opponentStats,
  onStat,
}) {
  return (
    <div className="grid gap-3 border border-open-light bg-open-bg p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
        Estadisticas finales
      </p>
      <div className="grid gap-3 lg:grid-cols-2">
        <PlayerStatsColumn
          label={currentPlayer?.full_name || 'Yo'}
          side="creatorStats"
          stats={creatorStats}
          onStat={onStat}
        />
        <PlayerStatsColumn
          label={opponent?.full_name || 'Rival'}
          side="opponentStats"
          stats={opponentStats}
          onStat={onStat}
        />
      </div>
    </div>
  )
}

function PlayerStatsColumn({ label, side, stats, onStat }) {
  return (
    <div className="grid gap-2">
      <h3 className="text-sm font-semibold text-open-ink">{label}</h3>
      {matchStatFields.map((field) => (
        <div
          key={field.key}
          className="grid grid-cols-[1fr_32px_38px_32px] items-center gap-2 border border-open-light bg-open-surface px-2 py-2"
        >
          <span className="text-xs font-semibold text-open-muted">
            {field.label}
          </span>
          <button
            type="button"
            onClick={() => onStat(side, field.key, (stats[field.key] || 0) - 1)}
            className="h-8 border border-open-light bg-open-bg text-sm font-semibold"
          >
            -
          </button>
          <span className="text-center text-sm font-semibold text-open-ink">
            {stats[field.key] || 0}
          </span>
          <button
            type="button"
            onClick={() => onStat(side, field.key, (stats[field.key] || 0) + 1)}
            className="h-8 border border-open-light bg-open-bg text-sm font-semibold"
          >
            +
          </button>
        </div>
      ))}
    </div>
  )
}

function WinnerButton({ disabled = false, isSelected, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'h-10 border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
        isSelected
          ? 'border-open-ink bg-open-ink text-white'
          : 'border-open-light bg-open-bg text-open-muted',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

function MatchHistory({
  currentPlayer,
  isSaving,
  matches,
  players,
  onConfirm,
  onReject,
}) {
  return (
    <article className="grid gap-4 border border-open-light bg-open-surface p-5">
      <div className="flex items-center gap-3">
        <Trophy size={18} strokeWidth={1.8} />
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-open-muted">
          Historial y confirmacion
        </h2>
      </div>

      <div className="grid gap-3">
        {matches.map((match) => (
          <MatchRow
            key={match.id}
            currentPlayer={currentPlayer}
            isSaving={isSaving}
            match={match}
            players={players}
            onConfirm={() => onConfirm(match)}
            onReject={() => onReject(match)}
          />
        ))}
      </div>

      {matches.length === 0 ? (
        <p className="border border-open-light bg-open-bg px-4 py-8 text-center text-sm text-open-muted">
          Todavia no tienes partidos amistosos.
        </p>
      ) : null}
    </article>
  )
}

function MatchRow({
  currentPlayer,
  isSaving,
  match,
  players,
  onConfirm,
  onReject,
}) {
  const opponent = resolveOpponent(match, currentPlayer, players)
  const canConfirm =
    match.status === 'pending' &&
    String(match.opponent_player_id) === String(currentPlayer?.id)
  const winnerName =
    String(match.winner_player_id) === String(currentPlayer?.id)
      ? 'Tu'
      : opponent?.full_name || 'Rival'

  return (
    <article className="grid gap-3 border border-open-light bg-open-bg p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-open-ink">
            vs {opponent?.full_name || 'Jugador OPEN'}
          </h3>
          <p className="mt-1 text-xs text-open-muted">
            {match.match_date} - {match.score} - Ganador: {winnerName}
          </p>
          <p className="mt-1 text-xs text-open-muted">
            {match.court || 'Cancha pendiente'} - {formatStatus(match.status)}
          </p>
        </div>
        <span className="border border-open-light bg-open-surface px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-open-muted">
          {match.is_live_match || match.has_live_judge ? 'En vivo' : 'Manual'}
        </span>
      </div>

      {canConfirm ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="inline-flex h-10 items-center gap-2 bg-open-ink px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-open-muted"
          >
            <Check size={16} strokeWidth={1.8} />
            Confirmar
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={isSaving}
            className="inline-flex h-10 items-center gap-2 border border-open-light bg-open-surface px-3 text-sm font-semibold text-open-ink disabled:opacity-50"
          >
            <X size={16} strokeWidth={1.8} />
            Rechazar
          </button>
        </div>
      ) : null}
    </article>
  )
}

function resolveOpponent(match, currentPlayer, players) {
  const opponentId =
    String(match.created_by_player_id) === String(currentPlayer?.id)
      ? match.opponent_player_id
      : match.created_by_player_id

  return players.find((player) => String(player.id) === String(opponentId))
}

function formatStatus(status) {
  const labels = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    rejected: 'Rechazado',
    expired: 'Expirado',
  }

  return labels[status] || status
}

function createDefaultForm() {
  return {
    opponentId: '',
    matchDate: new Date().toISOString().slice(0, 10),
    court: '',
    scoreSets: [
      { player: 0, opponent: 0 },
      { player: 0, opponent: 0 },
      { player: 0, opponent: 0 },
    ],
    winnerId: '',
    isLiveMatch: false,
    creatorStats: createEmptyStats(),
    opponentStats: createEmptyStats(),
  }
}

function createEmptyStats() {
  return {
    aces: 0,
    double_faults: 0,
    winners: 0,
    unforced_errors: 0,
    forced_errors: 0,
    match_points: 0,
    points_against: 0,
  }
}

function formatScore(scoreSets) {
  return scoreSets
    .filter((set) => Number(set.player) > 0 || Number(set.opponent) > 0)
    .map((set) => `${Number(set.player) || 0}-${Number(set.opponent) || 0}`)
    .join(' ')
}

export default FriendlyMatchesView
