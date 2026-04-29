import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CircleDot,
  Plus,
  Trophy,
  Users,
} from 'lucide-react'
import useActiveRole from '../../hooks/useActiveRole'
import { supabase } from '../../lib/supabase'
import usePlayerProfile from '../profile/usePlayerProfile'

const categoryOptions = ['D', 'C', 'B', 'A', 'Pro']
const ageGroupOptions = ['junior', 'juvenil', 'adulto', 'senior']
const tournamentTypes = [
  { value: 'internal', label: 'Interno', multiplier: 1 },
  { value: 'open', label: 'Abierto', multiplier: 1.5 },
  { value: 'special', label: 'Especial', multiplier: 2 },
]
const tournamentPresets = [
  {
    key: 'single_elimination',
    label: 'Eliminacion directa',
    modality: 'single_elimination',
    format: 'singles',
    tournamentType: 'internal',
    scoringFormat: 'best_of_3_sets',
    maxPlayers: '16',
    rankingMultiplier: '1',
    description:
      'Bracket clasico. Pierdes y quedas eliminado. Ideal para torneos cortos de fin de semana.',
    pointsConfig: { champion: 120, runner_up: 80, semifinal: 50, quarterfinal: 25 },
    xpConfig: { participation: 80, round_win: 40, runner_up: 100, champion: 200 },
  },
  {
    key: 'round_robin',
    label: 'Round robin',
    modality: 'round_robin',
    format: 'singles',
    tournamentType: 'internal',
    scoringFormat: 'pro_set_8',
    maxPlayers: '8',
    rankingMultiplier: '1',
    description:
      'Todos juegan contra todos en grupos. Gana quien acumula mas partidos, sets o games.',
    pointsConfig: { win: 3, loss: 0, set_won: 1, game_difference: 1 },
    xpConfig: { participation: 80, match_played: 30, match_win: 20 },
  },
  {
    key: 'league',
    label: 'Liga de tenis',
    modality: 'league',
    format: 'singles',
    tournamentType: 'special',
    scoringFormat: 'best_of_3_sets',
    maxPlayers: '32',
    rankingMultiplier: '2',
    description:
      'Temporada por jornadas con tabla de posiciones, puntos, XP y playoffs opcionales.',
    pointsConfig: { win: 3, loss: 1, walkover: 0, bonus_clean_win: 1 },
    xpConfig: { participation: 80, match_played: 30, match_win: 20, playoff: 80 },
  },
  {
    key: 'ladder',
    label: 'Ranking ladder',
    modality: 'ladder',
    format: 'singles',
    tournamentType: 'open',
    scoringFormat: 'challenge_match',
    maxPlayers: '64',
    rankingMultiplier: '1.5',
    description:
      'Escalera competitiva. Los jugadores retan posiciones y suben si ganan.',
    pointsConfig: { challenge_win: 10, defend_win: 5, upset_bonus: 5 },
    xpConfig: { match_played: 30, match_win: 20, live_judge_bonus: 15 },
  },
  {
    key: 'americano',
    label: 'Americano / Mix',
    modality: 'americano',
    format: 'doubles',
    tournamentType: 'internal',
    scoringFormat: 'timed_games',
    maxPlayers: '16',
    rankingMultiplier: '1',
    description:
      'Rondas cortas con parejas rotativas. Ideal para convivencia y ranking social.',
    pointsConfig: { game_won: 1, round_win: 2, participation: 1 },
    xpConfig: { participation: 60, round_played: 20, winner_bonus: 60 },
  },
]
const tournamentViews = [
  { id: 'overview', label: 'Overview' },
  { id: 'bracket', label: 'Bracket/Draw' },
  { id: 'standings', label: 'Tabla' },
  { id: 'groups', label: 'Grupos' },
  { id: 'calendar', label: 'Calendario' },
  { id: 'results', label: 'Resultados' },
  { id: 'stats', label: 'Estadisticas' },
  { id: 'participation', label: 'Mi Participacion' },
]

function TournamentsView() {
  const { player, profile, user } = usePlayerProfile()
  const [club, setClub] = useState(null)
  const [players, setPlayers] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [entries, setEntries] = useState([])
  const [matches, setMatches] = useState([])
  const [selectedTournamentId, setSelectedTournamentId] = useState('')
  const [form, setForm] = useState(createDefaultForm())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [activeTournamentView, setActiveTournamentView] = useState('overview')
  const [activeRole] = useActiveRole(user?.user_metadata?.role || 'player')

  const isCoach = activeRole === 'coach' && Boolean(profile.isCoach)
  const isManager = user?.user_metadata?.role === 'manager'
  const playerId = player?.id
  const canCreateTournament = isCoach && !isManager
  const canRegister = Boolean(
      player?.id &&
      !canCreateTournament &&
      !isManager &&
      activeRole !== 'coach' &&
      profile.clubId &&
      hasClubAccess(profile.clubMembershipStatus),
  )
  const registerBlockReason = getRegisterBlockReason({
    activeRole,
    canCreateTournament,
    clubMembershipStatus: profile.clubMembershipStatus,
    hasClub: Boolean(profile.clubId),
    hasPlayer: Boolean(player?.id),
    isManager,
  })

  const selectedTournament = useMemo(
    () => tournaments.find((tournament) => tournament.id === selectedTournamentId),
    [selectedTournamentId, tournaments],
  )

  const selectedEntries = useMemo(
    () =>
      entries
        .filter((entry) => entry.tournament_id === selectedTournamentId)
        .sort((a, b) => (a.seed || 999) - (b.seed || 999)),
    [entries, selectedTournamentId],
  )

  const myEntries = useMemo(
    () =>
      playerId
        ? entries.filter((entry) => String(entry.player_id) === String(playerId))
        : [],
    [entries, playerId],
  )

  const activeEntry = useMemo(() => {
    const activeStatuses = new Set(['planning', 'open', 'in_progress'])

    return myEntries.find((entry) => {
      const tournament = tournaments.find(
        (item) => item.id === entry.tournament_id,
      )

      return tournament && activeStatuses.has(tournament.status)
    })
  }, [myEntries, tournaments])

  const bracketPairs = useMemo(
    () => buildBracketPairs(selectedEntries, players),
    [players, selectedEntries],
  )
  const selectedMatches = useMemo(
    () =>
      matches
        .filter((match) => match.tournament_id === selectedTournamentId)
        .sort(
          (a, b) =>
            (a.round_number || 1) - (b.round_number || 1) ||
            (a.match_order || 1) - (b.match_order || 1),
        ),
    [matches, selectedTournamentId],
  )

  useEffect(() => {
    let isMounted = true

    const loadBase = async () => {
      setIsLoading(true)
      setError('')

      const nextClubId = profile.clubId

      if (!nextClubId) {
        setClub(null)
        setPlayers([])
        setTournaments([])
        setEntries([])
        setIsLoading(false)
        return
      }

      const [
        clubResult,
        playersResult,
        tournamentsResult,
        entriesResult,
        matchesResult,
      ] =
        await Promise.all([
          fetchClub(nextClubId),
          fetchClubPlayers(nextClubId),
          fetchTournaments(nextClubId),
          fetchTournamentEntries(nextClubId),
          fetchTournamentMatches(nextClubId),
        ])

      if (!isMounted) return

      if (
        clubResult.error ||
        playersResult.error ||
        tournamentsResult.error ||
        entriesResult.error ||
        matchesResult.error
      ) {
        setError(
          clubResult.error?.message ||
            playersResult.error?.message ||
            tournamentsResult.error?.message ||
            entriesResult.error?.message ||
            matchesResult.error?.message,
        )
      } else {
        setClub(clubResult.data)
        setPlayers(playersResult.data)
        setTournaments(tournamentsResult.data)
        setEntries(entriesResult.data)
        setMatches(matchesResult.data)
        setSelectedTournamentId((current) => {
          if (current && tournamentsResult.data.some((item) => item.id === current)) {
            return current
          }

          return tournamentsResult.data[0]?.id || ''
        })
      }

      setIsLoading(false)
    }

    loadBase()

    return () => {
      isMounted = false
    }
  }, [profile.clubId])

  const handleField = (key, value) => {
    setForm((current) => {
      if (key === 'tournamentType') {
        const type = tournamentTypes.find((item) => item.value === value)

        return {
          ...current,
          tournamentType: value,
          rankingMultiplier: String(type?.multiplier || 1),
        }
      }

      if (key === 'presetKey') {
        const preset = tournamentPresets.find((item) => item.key === value)

        if (!preset) return { ...current, presetKey: value }

        return {
          ...current,
          presetKey: preset.key,
          modality: preset.modality,
          format: preset.format,
          tournamentType: preset.tournamentType,
          scoringFormat: preset.scoringFormat,
          maxPlayers: preset.maxPlayers,
          rankingMultiplier: preset.rankingMultiplier,
          description: current.description || preset.description,
          pointsConfig: preset.pointsConfig,
          xpConfig: preset.xpConfig,
        }
      }

      return { ...current, [key]: value }
    })
  }

  const handleCreateTournament = async () => {
    if (!canCreateTournament || !profile.clubId) {
      setError('Solo un coach vinculado a un club puede crear torneos.')
      return
    }

    if (!form.title.trim() || !form.startDate) {
      setError('Agrega nombre y fecha de inicio para crear el torneo.')
      return
    }

    setIsSaving(true)
    setError('')
    setToast('')

    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .insert({
        club_id: profile.clubId,
        created_by_user_id: user?.id || null,
        created_by_player_id: player?.id ? String(player.id) : null,
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category || null,
        age_group: form.ageGroup || null,
        format: form.format,
        modality: form.modality,
        preset_key: form.presetKey || null,
        scoring_format: form.scoringFormat,
        points_config: form.pointsConfig || {},
        xp_config: form.xpConfig || {},
        tournament_type: form.tournamentType,
        status: form.status,
        start_date: form.startDate,
        registration_deadline: form.registrationDeadline || null,
        court: form.court.trim() || null,
        max_players: Number(form.maxPlayers) || 16,
        ranking_multiplier: Number(form.rankingMultiplier) || 1,
      })
      .select()
      .single()

    if (tournamentError) {
      setError(tournamentError.message)
      setIsSaving(false)
      return
    }

    setTournaments((current) => [tournament, ...current])
    setSelectedTournamentId(tournament.id)
    setForm(createDefaultForm())
    setToast('Torneo publicado. Los jugadores ya pueden inscribirse.')
    setIsSaving(false)
  }

  const handleRegister = async (tournament) => {
    if (!canRegister || !player?.id) {
      setError('Necesitas ser jugador aprobado del club para inscribirte.')
      return
    }

    if (isRegistered(tournament.id, player.id, entries)) {
      setError('Ya estas inscrito en este torneo.')
      return
    }

    setIsSaving(true)
    setError('')
    setToast('')

    const nextSeed =
      entries.filter((entry) => entry.tournament_id === tournament.id).length + 1
    const { data, error: entryError } = await supabase
      .from('tournament_entries')
      .insert({
        tournament_id: tournament.id,
        club_id: tournament.club_id,
        player_id: String(player.id),
        user_id: player.user_id || user?.id || null,
        seed: nextSeed,
        status: 'registered',
      })
      .select()
      .single()

    if (entryError) {
      setError(entryError.message)
    } else {
      setEntries((current) => [data, ...current])
      setSelectedTournamentId(tournament.id)
      setToast(`Inscripcion confirmada para ${tournament.title}.`)
    }

    setIsSaving(false)
  }

  if (isLoading) {
    return <p className="text-sm text-open-muted">Cargando torneos...</p>
  }

  return (
    <section className="grid gap-6">
      <TournamentHeader
        canCreateTournament={canCreateTournament}
        clubName={club?.name}
        tournamentCount={tournaments.length}
      />

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

      {!profile.clubId ? (
        <p className="border border-open-light bg-open-surface px-4 py-6 text-sm text-open-muted">
          Vincula tu cuenta a un club para ver o crear torneos.
        </p>
      ) : null}

      {profile.clubId && profile.isCoach && activeRole !== 'coach' ? (
        <p className="border border-open-light bg-open-surface px-4 py-3 text-sm text-open-muted">
          Cambia a vista Coach para crear torneos. En vista jugador puedes ver
          torneos e inscripciones.
        </p>
      ) : null}

      {profile.clubId ? (
        <div className="grid gap-5 2xl:grid-cols-[0.92fr_1.08fr]">
          {canCreateTournament ? (
            <CreateTournamentForm
              form={form}
              isSaving={isSaving}
              onCreate={handleCreateTournament}
              onField={handleField}
            />
          ) : (
            <PlayerTournamentPanel
              activeEntry={activeEntry}
              canRegister={canRegister}
              entries={entries}
              isSaving={isSaving}
              myEntries={myEntries}
              player={player}
              registerBlockReason={registerBlockReason}
              tournaments={tournaments}
              onRegister={handleRegister}
              onSelectTournament={setSelectedTournamentId}
            />
          )}

          <div className="grid gap-5 xl:grid-cols-[0.86fr_1.14fr] 2xl:grid-cols-1">
            <TournamentList
              entries={entries}
              selectedTournamentId={selectedTournamentId}
              tournaments={tournaments}
              onSelectTournament={setSelectedTournamentId}
            />
            <BracketPreview
              activeView={activeTournamentView}
              bracketPairs={bracketPairs}
              entries={selectedEntries}
              matches={selectedMatches}
              myEntries={myEntries}
              player={player}
              players={players}
              tournament={selectedTournament}
              onViewChange={setActiveTournamentView}
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}

function TournamentHeader({ canCreateTournament, clubName, tournamentCount }) {
  return (
    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
          Torneos
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-open-ink md:text-5xl">
          {canCreateTournament ? 'Creador de torneo' : 'Torneos del club'}
        </h1>
        <p className="mt-2 text-sm font-semibold text-open-muted">
          {clubName || 'Club pendiente'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="border border-open-light bg-open-surface px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
          {tournamentCount} torneos
        </span>
        <div className="grid h-11 w-11 place-items-center border border-open-light bg-open-surface">
          <Trophy size={20} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  )
}

function CreateTournamentForm({ form, isSaving, onCreate, onField }) {
  return (
    <article className="grid gap-4 border border-open-light bg-open-surface p-5 md:p-6">
      <div className="flex items-center gap-3">
        <Plus size={18} strokeWidth={1.8} />
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-open-muted">
          Publicar torneo
        </h2>
      </div>

      <select
        value={form.presetKey}
        onChange={(event) => onField('presetKey', event.target.value)}
        className="h-11 border border-open-light bg-open-bg px-3 text-sm text-open-ink outline-none focus:border-open-primary"
      >
        {tournamentPresets.map((preset) => (
          <option key={preset.key} value={preset.key}>
            {preset.label}
          </option>
        ))}
      </select>

      <PresetSummary form={form} />

      <input
        value={form.title}
        onChange={(event) => onField('title', event.target.value)}
        placeholder="Nombre del torneo"
        className="h-11 border border-open-light bg-open-bg px-3 text-sm text-open-ink outline-none focus:border-open-primary"
      />

      <div className="grid gap-3 md:grid-cols-2">
        <input
          type="date"
          value={form.startDate}
          onChange={(event) => onField('startDate', event.target.value)}
          className="h-11 border border-open-light bg-open-bg px-3 text-sm text-open-ink outline-none focus:border-open-primary"
        />
        <input
          type="date"
          value={form.registrationDeadline}
          onChange={(event) =>
            onField('registrationDeadline', event.target.value)
          }
          className="h-11 border border-open-light bg-open-bg px-3 text-sm text-open-ink outline-none focus:border-open-primary"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <select
          value={form.modality}
          onChange={(event) => onField('modality', event.target.value)}
          className="h-11 border border-open-light bg-open-bg px-3 text-sm text-open-ink outline-none focus:border-open-primary"
        >
          <option value="single_elimination">Eliminacion directa</option>
          <option value="round_robin">Round robin</option>
          <option value="league">Liga</option>
          <option value="ladder">Ranking ladder</option>
          <option value="americano">Americano</option>
        </select>
        <select
          value={form.format}
          onChange={(event) => onField('format', event.target.value)}
          className="h-11 border border-open-light bg-open-bg px-3 text-sm text-open-ink outline-none focus:border-open-primary"
        >
          <option value="singles">Singles</option>
          <option value="doubles">Dobles</option>
        </select>
        <select
          value={form.scoringFormat}
          onChange={(event) => onField('scoringFormat', event.target.value)}
          className="h-11 border border-open-light bg-open-bg px-3 text-sm text-open-ink outline-none focus:border-open-primary"
        >
          <option value="best_of_3_sets">Mejor de 3 sets</option>
          <option value="pro_set_8">Pro set a 8</option>
          <option value="super_tiebreak">Super tie-break</option>
          <option value="timed_games">Por tiempo/games</option>
          <option value="challenge_match">Challenge match</option>
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <select
          value={form.category}
          onChange={(event) => onField('category', event.target.value)}
          className="h-11 border border-open-light bg-open-bg px-3 text-sm text-open-ink outline-none focus:border-open-primary"
        >
          <option value="">Todas las categorias</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              Cat. {category}
            </option>
          ))}
        </select>
        <select
          value={form.ageGroup}
          onChange={(event) => onField('ageGroup', event.target.value)}
          className="h-11 border border-open-light bg-open-bg px-3 text-sm text-open-ink outline-none focus:border-open-primary"
        >
          <option value="">Todas las edades</option>
          {ageGroupOptions.map((ageGroup) => (
            <option key={ageGroup} value={ageGroup}>
              {formatAgeGroup(ageGroup)}
            </option>
          ))}
        </select>
        <select
          value={form.tournamentType}
          onChange={(event) => onField('tournamentType', event.target.value)}
          className="h-11 border border-open-light bg-open-bg px-3 text-sm text-open-ink outline-none focus:border-open-primary"
        >
          {tournamentTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label} x{type.multiplier}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input
          type="number"
          min="2"
          max="128"
          value={form.maxPlayers}
          onChange={(event) => onField('maxPlayers', event.target.value)}
          className="h-11 border border-open-light bg-open-bg px-3 text-sm text-open-ink outline-none focus:border-open-primary"
        />
        <input
          value={form.court}
          onChange={(event) => onField('court', event.target.value)}
          placeholder="Cancha o sede"
          className="h-11 border border-open-light bg-open-bg px-3 text-sm text-open-ink outline-none focus:border-open-primary"
        />
        <select
          value={form.status}
          onChange={(event) => onField('status', event.target.value)}
          className="h-11 border border-open-light bg-open-bg px-3 text-sm text-open-ink outline-none focus:border-open-primary"
        >
          <option value="planning">Planeacion</option>
          <option value="open">Inscripciones abiertas</option>
        </select>
      </div>

      <textarea
        value={form.description}
        onChange={(event) => onField('description', event.target.value)}
        placeholder="Descripcion breve, reglas o notas para jugadores"
        rows={3}
        className="resize-none border border-open-light bg-open-bg px-3 py-3 text-sm text-open-ink outline-none focus:border-open-primary"
      />

      <div className="border border-open-light bg-open-bg p-4 text-sm leading-6 text-open-muted">
        El coach publica el torneo. Los jugadores se inscriben desde su propia
        cuenta y el bracket se alimenta con esas inscripciones.
      </div>

      <button
        type="button"
        onClick={onCreate}
        disabled={isSaving}
        className="inline-flex h-11 items-center justify-center gap-2 bg-open-primary px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-open-muted"
      >
        <Trophy size={16} strokeWidth={1.8} />
        {isSaving ? 'Creando...' : 'Publicar torneo'}
      </button>
    </article>
  )
}

function PresetSummary({ form }) {
  const preset = tournamentPresets.find((item) => item.key === form.presetKey)
  const points = form.pointsConfig || preset?.pointsConfig || {}
  const xp = form.xpConfig || preset?.xpConfig || {}

  return (
    <div className="grid gap-3 border border-open-light bg-open-bg p-4 text-sm text-open-muted">
      <p className="font-semibold text-open-ink">
        {preset?.label || 'Preset personalizado'}
      </p>
      <p className="leading-6">
        {preset?.description || form.description || 'Configura modalidad y reglas.'}
      </p>
      <div className="grid gap-2 md:grid-cols-2">
        <RulePreview title="Puntos" config={points} />
        <RulePreview title="XP" config={xp} />
      </div>
    </div>
  )
}

function RulePreview({ config, title }) {
  const entries = Object.entries(config || {})

  return (
    <div className="border border-open-light bg-open-surface p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
        {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {entries.map(([key, value]) => (
          <span
            key={key}
            className="border border-open-light bg-open-bg px-2 py-1 text-xs font-semibold text-open-muted"
          >
            {formatRuleKey(key)}: {value}
          </span>
        ))}
        {entries.length === 0 ? (
          <span className="text-xs text-open-muted">Sin reglas definidas</span>
        ) : null}
      </div>
    </div>
  )
}

function PlayerTournamentPanel({
  activeEntry,
  canRegister,
  entries,
  isSaving,
  myEntries,
  player,
  registerBlockReason,
  tournaments,
  onRegister,
  onSelectTournament,
}) {
  const activeTournament = activeEntry
    ? tournaments.find((tournament) => tournament.id === activeEntry.tournament_id)
    : null

  return (
    <article className="grid gap-4 border border-open-light bg-open-surface p-5 md:p-6">
      <div className="flex items-center gap-3">
        <Users size={18} strokeWidth={1.8} />
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-open-muted">
          Mi participacion
        </h2>
      </div>

      {activeTournament ? (
        <button
          type="button"
          onClick={() => onSelectTournament(activeTournament.id)}
          className="grid gap-3 border border-open-ink bg-open-bg p-4 text-left"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
            Torneo activo
          </span>
          <span className="text-xl font-semibold text-open-ink">
            {activeTournament.title}
          </span>
          <span className="text-sm text-open-muted">
            {formatStatus(activeTournament.status)} · Seed{' '}
            {activeEntry.seed || '--'} · {formatEntryStatus(activeEntry.status)}
          </span>
        </button>
      ) : (
        <p className="border border-open-light bg-open-bg px-4 py-5 text-sm text-open-muted">
          Todavia no estas inscrito en un torneo activo.
        </p>
      )}

      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
          Disponibles para inscripcion
        </p>
        {!canRegister && registerBlockReason ? (
          <p className="border border-open-light bg-open-bg px-3 py-2 text-xs text-open-muted">
            {registerBlockReason}
          </p>
        ) : null}
        {tournaments
          .filter((tournament) => tournament.status === 'open')
          .map((tournament) => {
            const entryCount = entries.filter(
              (entry) => entry.tournament_id === tournament.id,
            ).length
            const registered = player?.id
              ? isRegistered(tournament.id, player.id, entries)
              : false
            const isFull = entryCount >= Number(tournament.max_players || 16)

            return (
              <div
                key={tournament.id}
                className="grid gap-3 border border-open-light bg-open-bg p-3"
              >
                <button
                  type="button"
                  onClick={() => onSelectTournament(tournament.id)}
                  className="text-left"
                >
                  <span className="block text-sm font-semibold text-open-ink">
                    {tournament.title}
                  </span>
                  <span className="mt-1 block text-xs text-open-muted">
                    {formatDate(tournament.start_date)} · {entryCount}/
                    {tournament.max_players} inscritos
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onRegister(tournament)}
                  disabled={!canRegister || registered || isFull || isSaving}
                  className="h-10 border border-open-light bg-open-surface px-3 text-xs font-semibold text-open-ink transition hover:border-open-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {registered
                    ? 'Ya inscrito'
                    : isFull
                      ? 'Cupo lleno'
                      : !canRegister && registerBlockReason
                        ? registerBlockReason
                        : 'Inscribirme'}
                </button>
              </div>
            )
          })}

        {tournaments.filter((tournament) => tournament.status === 'open').length ===
        0 ? (
          <p className="border border-open-light bg-open-bg px-4 py-5 text-sm text-open-muted">
            No hay torneos abiertos por ahora.
          </p>
        ) : null}
      </div>

      <div className="border-t border-open-light pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
          Mi historial de torneos
        </p>
        <p className="mt-2 text-2xl font-semibold text-open-ink">
          {myEntries.length}
        </p>
      </div>
    </article>
  )
}

function TournamentList({
  entries,
  selectedTournamentId,
  tournaments,
  onSelectTournament,
}) {
  return (
    <article className="grid gap-4 border border-open-light bg-open-surface p-5 md:p-6">
      <div className="flex items-center gap-3">
        <CalendarDays size={18} strokeWidth={1.8} />
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-open-muted">
          Torneos
        </h2>
      </div>

      <div className="grid gap-2">
        {tournaments.map((tournament) => {
          const entryCount = entries.filter(
            (entry) => entry.tournament_id === tournament.id,
          ).length

          return (
            <button
              key={tournament.id}
              type="button"
              onClick={() => onSelectTournament(tournament.id)}
              className={[
                'flex items-start justify-between gap-3 border p-3 text-left',
                selectedTournamentId === tournament.id
                  ? 'border-open-ink bg-open-bg'
                  : 'border-open-light bg-open-bg',
              ].join(' ')}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-open-ink">
                  {tournament.title}
                </span>
                <span className="mt-1 block text-xs text-open-muted">
                  {formatDate(tournament.start_date)} · {entryCount}/
                  {tournament.max_players} inscritos
                </span>
              </span>
              <span className="shrink-0 border border-open-light bg-open-surface px-2 py-1 text-xs font-semibold text-open-muted">
                {formatStatus(tournament.status)}
              </span>
            </button>
          )
        })}

        {tournaments.length === 0 ? (
          <p className="border border-open-light bg-open-bg px-4 py-5 text-sm text-open-muted">
            No hay torneos creados todavia.
          </p>
        ) : null}
      </div>
    </article>
  )
}

function BracketPreview({
  activeView,
  bracketPairs,
  entries,
  matches,
  myEntries,
  player,
  players,
  tournament,
  onViewChange,
}) {
  const playerMap = useMemo(
    () =>
      new Map(
        players.map((player) => [
          String(player.id),
          player.full_name || player.email || 'Jugador OPEN',
        ]),
      ),
    [players],
  )
  const standings = useMemo(
    () => buildStandings(entries, matches, playerMap),
    [entries, matches, playerMap],
  )
  const groups = useMemo(() => buildGroups(entries, playerMap), [entries, playerMap])

  return (
    <article className="grid gap-4 border border-open-light bg-open-surface p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Users size={18} strokeWidth={1.8} />
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-open-muted">
            Centro del torneo
          </h2>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
          {entries.length} jugadores
        </span>
      </div>

      {tournament ? (
        <div className="grid gap-4">
          <TournamentViewTabs activeView={activeView} onViewChange={onViewChange} />
          <TournamentWorkspaceView
            activeView={activeView}
            bracketPairs={bracketPairs}
            entries={entries}
            groups={groups}
            matches={matches}
            myEntries={myEntries}
            player={player}
            playerMap={playerMap}
            players={players}
            standings={standings}
            tournament={tournament}
          />
        </div>
      ) : (
        <p className="border border-open-light bg-open-bg px-4 py-5 text-sm text-open-muted">
          Selecciona un torneo para ver bracket, puntajes y posiciones.
        </p>
      )}
    </article>
  )
}

function TournamentViewTabs({ activeView, onViewChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tournamentViews.map((view) => (
        <button
          key={view.id}
          type="button"
          onClick={() => onViewChange(view.id)}
          className={[
            'h-10 shrink-0 border px-3 text-xs font-semibold uppercase tracking-[0.12em] transition',
            activeView === view.id
              ? 'border-open-ink bg-open-ink text-open-surface'
              : 'border-open-light bg-open-bg text-open-muted hover:border-open-ink hover:text-open-ink',
          ].join(' ')}
        >
          {view.label}
        </button>
      ))}
    </div>
  )
}

function TournamentWorkspaceView({
  activeView,
  bracketPairs,
  entries,
  groups,
  matches,
  myEntries,
  player,
  playerMap,
  players,
  standings,
  tournament,
}) {
  if (activeView === 'bracket') {
    return (
      <BracketDrawView
        bracketPairs={bracketPairs}
        matches={matches}
        playerMap={playerMap}
      />
    )
  }

  if (activeView === 'standings') {
    return <StandingsView standings={standings} tournament={tournament} />
  }

  if (activeView === 'groups') {
    return <GroupsView groups={groups} tournament={tournament} />
  }

  if (activeView === 'calendar') {
    return <CalendarView bracketPairs={bracketPairs} matches={matches} playerMap={playerMap} />
  }

  if (activeView === 'results') {
    return <ResultsView matches={matches} playerMap={playerMap} />
  }

  if (activeView === 'stats') {
    return <TournamentStatsView players={players} standings={standings} />
  }

  if (activeView === 'participation') {
    return (
      <MyParticipationView
        matches={matches}
        myEntries={myEntries}
        player={player}
        playerMap={playerMap}
        tournament={tournament}
      />
    )
  }

  return (
    <TournamentOverviewView
      entries={entries}
      matches={matches}
      standings={standings}
      tournament={tournament}
    />
  )
}

function TournamentOverviewView({ entries, matches, standings, tournament }) {
  const finishedMatches = matches.filter((match) => match.status === 'finished')
  const nextMatch = matches.find((match) =>
    ['scheduled', 'in_progress'].includes(match.status),
  )

  return (
    <div className="grid gap-4">
      <TournamentSummary tournament={tournament} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Inscritos" value={`${entries.length}/${tournament.max_players}`} />
        <MetricCard label="Partidos" value={matches.length || entries.length ? Math.max(matches.length, Math.ceil(entries.length / 2)) : 0} />
        <MetricCard label="Jugados" value={finishedMatches.length} />
        <MetricCard label="Lider" value={standings[0]?.name || 'Pendiente'} />
      </div>
      <div className="grid gap-3 border border-open-light bg-open-bg p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
          Proximo partido
        </p>
        {nextMatch ? (
          <TournamentMatchRow match={nextMatch} playerMap={new Map()} />
        ) : (
          <p className="text-sm text-open-muted">
            El calendario se mostrara cuando el coach genere los partidos.
          </p>
        )}
      </div>
    </div>
  )
}

function BracketDrawView({ bracketPairs, matches, playerMap }) {
  if (matches.length) {
    const rounds = groupMatchesByRound(matches)

    return (
      <div className="grid gap-4 overflow-x-auto md:grid-flow-col md:auto-cols-[minmax(18rem,1fr)]">
        {rounds.map(([round, roundMatches]) => (
          <div key={round} className="grid content-start gap-3 border border-open-light bg-open-bg p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
              Ronda {round}
            </p>
            {roundMatches.map((match) => (
              <TournamentMatchRow key={match.id} match={match} playerMap={playerMap} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {bracketPairs.map((pair, index) => (
        <div
          key={`${pair.seedOne?.id || 'bye'}-${pair.seedTwo?.id || 'bye'}-${index}`}
          className="grid gap-2 border border-open-light bg-open-bg p-3"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
            Partido {index + 1}
          </p>
          <BracketPlayer entry={pair.seedOne} />
          <BracketPlayer entry={pair.seedTwo} />
        </div>
      ))}
      {bracketPairs.length === 0 ? (
        <EmptyTournamentState text="Aun no hay jugadores para armar el bracket." />
      ) : null}
    </div>
  )
}

function StandingsView({ standings, tournament }) {
  return (
    <div className="grid gap-3 border border-open-light bg-open-bg p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
        Tabla de puntos - {formatModality(tournament.modality)}
      </p>
      <div className="grid gap-2">
        {standings.map((row, index) => (
          <StandingRow key={row.playerId} index={index} row={row} />
        ))}
        {standings.length === 0 ? (
          <EmptyTournamentState text="La tabla aparecera cuando existan inscritos." />
        ) : null}
      </div>
    </div>
  )
}

function GroupsView({ groups, tournament }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {groups.map((group) => (
        <div key={group.name} className="grid gap-3 border border-open-light bg-open-bg p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
            {group.name}
          </p>
          {group.entries.map((entry) => (
            <BracketPlayer key={entry.id} entry={entry} />
          ))}
        </div>
      ))}
      {groups.length === 0 ? (
        <EmptyTournamentState
          text={`Los grupos se formaran para ${formatModality(tournament.modality)} cuando haya inscritos.`}
        />
      ) : null}
    </div>
  )
}

function CalendarView({ bracketPairs, matches, playerMap }) {
  const scheduledMatches = matches.filter((match) => match.status !== 'finished')

  return (
    <div className="grid gap-3">
      {scheduledMatches.map((match) => (
        <TournamentMatchRow key={match.id} match={match} playerMap={playerMap} />
      ))}
      {!scheduledMatches.length && bracketPairs.map((pair, index) => (
        <div key={index} className="grid gap-2 border border-open-light bg-open-bg p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
            Fecha por confirmar - Partido {index + 1}
          </p>
          <BracketPlayer entry={pair.seedOne} />
          <BracketPlayer entry={pair.seedTwo} />
        </div>
      ))}
      {!scheduledMatches.length && !bracketPairs.length ? (
        <EmptyTournamentState text="El cronograma aparecera cuando existan partidos." />
      ) : null}
    </div>
  )
}

function ResultsView({ matches, playerMap }) {
  const finishedMatches = matches.filter((match) => match.status === 'finished')

  return (
    <div className="grid gap-3">
      {finishedMatches.map((match) => (
        <TournamentMatchRow key={match.id} match={match} playerMap={playerMap} />
      ))}
      {finishedMatches.length === 0 ? (
        <EmptyTournamentState text="Todavia no hay resultados capturados." />
      ) : null}
    </div>
  )
}

function TournamentStatsView({ players, standings }) {
  const playerById = new Map(players.map((item) => [String(item.id), item]))

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {standings.map((row) => {
        const player = playerById.get(String(row.playerId)) || {}

        return (
          <div key={row.playerId} className="grid gap-3 border border-open-light bg-open-bg p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-open-ink">{row.name}</p>
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-open-muted">
                {row.points} pts
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <MetricCard label="Aces" value={player.match_aces || 0} />
              <MetricCard label="Winners" value={player.match_winners || 0} />
              <MetricCard label="XP" value={row.xp} />
            </div>
          </div>
        )
      })}
      {standings.length === 0 ? (
        <EmptyTournamentState text="Las estadisticas se llenaran con jugadores y resultados." />
      ) : null}
    </div>
  )
}

function MyParticipationView({ matches, myEntries, player, playerMap, tournament }) {
  const myEntry = player?.id
    ? myEntries.find((entry) => entry.tournament_id === tournament.id)
    : null
  const myMatches = player?.id
    ? matches.filter(
        (match) =>
          String(match.player1_id) === String(player.id) ||
          String(match.player2_id) === String(player.id),
      )
    : []

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 border border-open-light bg-open-bg p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
          Mi participacion
        </p>
        <p className="text-2xl font-semibold text-open-ink">
          {myEntry ? formatEntryStatus(myEntry.status) : 'No inscrito'}
        </p>
        <p className="text-sm text-open-muted">
          {myEntry
            ? `Seed ${myEntry.seed || '--'} - XP ${myEntry.xp_awarded || 0}`
            : 'Inscribete para ver tu camino, rivales y puntos en vivo.'}
        </p>
      </div>
      <div className="grid gap-3">
        {myMatches.map((match) => (
          <TournamentMatchRow key={match.id} match={match} playerMap={playerMap} />
        ))}
        {myEntry && myMatches.length === 0 ? (
          <EmptyTournamentState text="Tus partidos apareceran cuando el draw este generado." />
        ) : null}
      </div>
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="border border-open-light bg-open-surface p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-open-muted">
        {label}
      </p>
      <p className="mt-2 truncate font-display text-2xl text-open-ink">{value}</p>
    </div>
  )
}

function StandingRow({ index, row }) {
  return (
    <div className="grid grid-cols-[2rem_1fr_repeat(4,2.8rem)] items-center gap-2 border border-open-light bg-open-surface px-3 py-2 text-sm">
      <span className="font-semibold text-open-muted">#{index + 1}</span>
      <span className="truncate font-semibold text-open-ink">{row.name}</span>
      <span className="text-center text-open-muted">{row.played}</span>
      <span className="text-center text-open-muted">{row.wins}</span>
      <span className="text-center text-open-muted">{row.losses}</span>
      <span className="text-center font-semibold text-open-ink">{row.points}</span>
    </div>
  )
}

function EmptyTournamentState({ text }) {
  return (
    <p className="border border-open-light bg-open-bg px-4 py-5 text-sm text-open-muted">
      {text}
    </p>
  )
}

function TournamentMatchRow({ match, playerMap }) {
  return (
    <div className="grid gap-2 border border-open-light bg-open-bg p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
          Ronda {match.round_number} · Partido {match.match_order}
        </p>
        <span className="text-xs font-semibold text-open-muted">
          {formatMatchStatus(match.status)}
        </span>
      </div>
      <MatchPlayer
        isWinner={match.winner_player_id === match.player1_id}
        name={playerMap.get(String(match.player1_id)) || 'Jugador pendiente'}
      />
      <MatchPlayer
        isWinner={match.winner_player_id === match.player2_id}
        name={playerMap.get(String(match.player2_id)) || 'Jugador pendiente'}
      />
      <p className="border-t border-open-light pt-2 text-sm font-semibold text-open-ink">
        Score: {match.score || 'Pendiente'}
      </p>
    </div>
  )
}

function MatchPlayer({ isWinner, name }) {
  return (
    <div className="flex items-center justify-between gap-3 border border-open-light bg-open-surface px-3 py-2">
      <span className="truncate text-sm font-semibold text-open-ink">{name}</span>
      {isWinner ? (
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-open-muted">
          Ganador
        </span>
      ) : null}
    </div>
  )
}

function TournamentSummary({ tournament }) {
  return (
    <div className="grid gap-3 border border-open-light bg-open-bg p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-open-ink">
            {tournament.title}
          </h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-open-muted">
            {formatType(tournament.tournament_type)} · x
            {Number(tournament.ranking_multiplier || 1)}
          </p>
        </div>
        <span className="border border-open-light bg-open-surface px-2 py-1 text-xs font-semibold text-open-muted">
          {formatStatus(tournament.status)}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 text-xs font-semibold text-open-muted">
        <span className="border border-open-light bg-open-surface px-2 py-1">
          {formatDate(tournament.start_date)}
        </span>
        <span className="border border-open-light bg-open-surface px-2 py-1">
          Cat. {tournament.category || 'Todas'}
        </span>
        <span className="border border-open-light bg-open-surface px-2 py-1">
          {formatAgeGroup(tournament.age_group)}
        </span>
        <span className="border border-open-light bg-open-surface px-2 py-1">
          {formatModality(tournament.modality)}
        </span>
        <span className="border border-open-light bg-open-surface px-2 py-1">
          {formatScoring(tournament.scoring_format)}
        </span>
        <span className="border border-open-light bg-open-surface px-2 py-1">
          {tournament.court || 'Sede pendiente'}
        </span>
      </div>
      {tournament.description ? (
        <p className="text-sm leading-6 text-open-muted">
          {tournament.description}
        </p>
      ) : null}
    </div>
  )
}

function BracketPlayer({ entry }) {
  return (
    <div className="flex items-center justify-between gap-3 border border-open-light bg-open-surface px-3 py-2">
      <span className="flex min-w-0 items-center gap-2">
        <CircleDot size={14} strokeWidth={1.8} className="shrink-0" />
        <span className="truncate text-sm font-semibold text-open-ink">
          {entry?.playerName || 'BYE'}
        </span>
      </span>
      <span className="shrink-0 text-xs font-semibold text-open-muted">
        {entry?.seed ? `Seed ${entry.seed}` : 'Pase'}
      </span>
    </div>
  )
}

async function fetchClub(clubId) {
  const { data, error } = await supabase
    .from('clubs')
    .select('id, name, manager_id')
    .eq('id', clubId)
    .maybeSingle()

  return { data, error }
}

async function fetchClubPlayers(clubId) {
  const { data, error } = await supabase
    .from('players')
    .select('id, user_id, full_name, email, club_id, is_coach, club_membership_status, current_category, suggested_category, age_group, match_aces, match_winners')
    .eq('club_id', clubId)
    .or('is_coach.is.null,is_coach.eq.false')
    .eq('club_membership_status', 'approved')
    .order('full_name', { ascending: true })

  return { data: data || [], error }
}

async function fetchTournaments(clubId) {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('club_id', clubId)
    .order('start_date', { ascending: false })
    .limit(30)

  return { data: data || [], error }
}

async function fetchTournamentEntries(clubId) {
  const { data, error } = await supabase
    .from('tournament_entries')
    .select('*')
    .eq('club_id', clubId)
    .order('seed', { ascending: true })

  return { data: data || [], error }
}

async function fetchTournamentMatches(clubId) {
  const { data, error } = await supabase
    .from('tournament_matches')
    .select('*')
    .eq('club_id', clubId)
    .order('round_number', { ascending: true })
    .order('match_order', { ascending: true })

  return { data: data || [], error }
}

function buildBracketPairs(entries, players) {
  const playerMap = new Map(
    players.map((player) => [
      String(player.id),
      player.full_name || player.email || 'Jugador OPEN',
    ]),
  )
  const seeded = entries.map((entry) => ({
    ...entry,
    playerName: playerMap.get(String(entry.player_id)) || 'Jugador OPEN',
  }))
  const pairs = []

  for (let index = 0; index < seeded.length; index += 2) {
    pairs.push({
      seedOne: seeded[index],
      seedTwo: seeded[index + 1] || null,
    })
  }

  return pairs
}

function buildStandings(entries, matches, playerMap) {
  const rows = new Map()

  entries.forEach((entry) => {
    const playerId = String(entry.player_id)

    rows.set(playerId, {
      playerId,
      name: playerMap.get(playerId) || 'Jugador OPEN',
      played: 0,
      wins: 0,
      losses: 0,
      points: 0,
      xp: entry.xp_awarded || 0,
    })
  })

  matches.forEach((match) => {
    if (match.status !== 'finished') return

    const playerIds = [match.player1_id, match.player2_id]
      .filter(Boolean)
      .map((id) => String(id))

    playerIds.forEach((playerId) => {
      if (!rows.has(playerId)) {
        rows.set(playerId, {
          playerId,
          name: playerMap.get(playerId) || 'Jugador OPEN',
          played: 0,
          wins: 0,
          losses: 0,
          points: 0,
          xp: 0,
        })
      }

      const row = rows.get(playerId)
      const won = String(match.winner_player_id) === playerId

      row.played += 1
      row.wins += won ? 1 : 0
      row.losses += won ? 0 : 1
      row.points += won ? 3 : 0
      row.xp += won ? 40 : 20
    })
  })

  return Array.from(rows.values()).sort(
    (a, b) => b.points - a.points || b.wins - a.wins || a.name.localeCompare(b.name),
  )
}

function buildGroups(entries, playerMap) {
  const seededEntries = entries.map((entry) => ({
    ...entry,
    playerName: playerMap.get(String(entry.player_id)) || 'Jugador OPEN',
  }))
  const groupCount = seededEntries.length > 12 ? 4 : seededEntries.length > 6 ? 3 : 2

  if (seededEntries.length < 3) return []

  return Array.from({ length: groupCount }, (_, index) => ({
    name: `Grupo ${String.fromCharCode(65 + index)}`,
    entries: seededEntries.filter((_, entryIndex) => entryIndex % groupCount === index),
  })).filter((group) => group.entries.length)
}

function groupMatchesByRound(matches) {
  const rounds = new Map()

  matches.forEach((match) => {
    const round = match.round_number || 1

    if (!rounds.has(round)) {
      rounds.set(round, [])
    }

    rounds.get(round).push(match)
  })

  return Array.from(rounds.entries()).sort(([roundA], [roundB]) => roundA - roundB)
}

function isRegistered(tournamentId, playerId, entries) {
  return entries.some(
    (entry) =>
      entry.tournament_id === tournamentId &&
      String(entry.player_id) === String(playerId) &&
      entry.status !== 'withdrawn',
  )
}

function getRegisterBlockReason({
  activeRole,
  canCreateTournament,
  clubMembershipStatus,
  hasClub,
  hasPlayer,
  isManager,
}) {
  if (!hasPlayer) return 'Falta crear tu perfil de jugador.'
  if (!hasClub) return 'Primero unite a un club.'
  if (!hasClubAccess(clubMembershipStatus)) {
    return 'Tu acceso al club esta pendiente de aprobacion.'
  }
  if (isManager) return 'Manager no puede inscribirse como jugador.'
  if (canCreateTournament || activeRole === 'coach') {
    return 'Cambia a vista Jugador para inscribirte.'
  }

  return ''
}

function hasClubAccess(status) {
  return status === 'approved' || status === 'unassigned' || !status
}

function createDefaultForm() {
  const preset = tournamentPresets[0]

  return {
    title: '',
    description: preset.description,
    category: '',
    ageGroup: '',
    presetKey: preset.key,
    modality: preset.modality,
    format: preset.format,
    scoringFormat: preset.scoringFormat,
    tournamentType: preset.tournamentType,
    status: 'open',
    startDate: todayIsoDate(),
    registrationDeadline: todayIsoDate(),
    court: '',
    maxPlayers: preset.maxPlayers,
    rankingMultiplier: preset.rankingMultiplier,
    pointsConfig: preset.pointsConfig,
    xpConfig: preset.xpConfig,
  }
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(value) {
  if (!value) return 'Fecha pendiente'

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function formatAgeGroup(value) {
  const labels = {
    junior: 'Junior',
    juvenil: 'Juvenil',
    adulto: 'Adulto',
    senior: 'Senior',
  }

  return labels[value] || 'Todas las edades'
}

function formatStatus(value) {
  const labels = {
    planning: 'Planeacion',
    open: 'Abierto',
    in_progress: 'En curso',
    finished: 'Finalizado',
    cancelled: 'Cancelado',
    archived: 'Archivado',
  }

  return labels[value] || value
}

function formatMatchStatus(value) {
  const labels = {
    scheduled: 'Programado',
    in_progress: 'En vivo',
    finished: 'Finalizado',
    walkover: 'Walkover',
    cancelled: 'Cancelado',
  }

  return labels[value] || value
}

function formatEntryStatus(value) {
  const labels = {
    registered: 'Inscrito',
    waitlisted: 'Lista de espera',
    withdrawn: 'Retirado',
    eliminated: 'Eliminado',
    runner_up: 'Finalista',
    champion: 'Campeon',
  }

  return labels[value] || value
}

function formatType(value) {
  const labels = {
    internal: 'Interno',
    open: 'Abierto',
    special: 'Especial',
  }

  return labels[value] || value
}

function formatModality(value) {
  const labels = {
    single_elimination: 'Eliminacion directa',
    round_robin: 'Round robin',
    league: 'Liga',
    ladder: 'Ladder',
    americano: 'Americano',
  }

  return labels[value] || value || 'Eliminacion directa'
}

function formatScoring(value) {
  const labels = {
    best_of_3_sets: 'Mejor de 3 sets',
    pro_set_8: 'Pro set a 8',
    super_tiebreak: 'Super tie-break',
    timed_games: 'Por tiempo',
    challenge_match: 'Challenge match',
  }

  return labels[value] || value || 'Mejor de 3 sets'
}

function formatRuleKey(value) {
  return String(value).replaceAll('_', ' ')
}

export default TournamentsView
