import { useEffect, useMemo, useState } from 'react'
import { Check, ClipboardList, ExternalLink, Swords, Trophy, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { checkAndUnlockAchievements } from '../gamification/achievementsLedger'
import usePlayerProfile from '../profile/usePlayerProfile'

async function buildMatchContext(playerId) {
  const [playerRes, streaksRes, matchesRes] = await Promise.all([
    supabase.from('players').select('id, user_id, club_id, match_aces').eq('id', String(playerId)).maybeSingle(),
    supabase.from('streaks').select('streak_type, current_count').eq('player_id', String(playerId)),
    supabase
      .from('friendly_matches')
      .select('id, winner_player_id, created_by_player_id, opponent_player_id, match_date')
      .or(`created_by_player_id.eq.${playerId},opponent_player_id.eq.${playerId}`)
      .eq('status', 'confirmed')
      .order('match_date', { ascending: false })
      .limit(20),
  ])

  const player = playerRes.data
  const streaks = streaksRes.data || []
  const matches = matchesRes.data || []

  const winStreak = streaks.find((s) => s.streak_type === 'wins')?.current_count || 0
  const totalConfirmedMatches = matches.length

  const opponentIds = new Set(
    matches.map((m) =>
      String(m.created_by_player_id) === String(playerId)
        ? String(m.opponent_player_id)
        : String(m.created_by_player_id),
    ),
  )

  // Perseverante: second-most-recent confirmed match was a loss, and most recent is the just-confirmed one
  const prevMatch = matches[1]
  const hadRecentLoss =
    prevMatch &&
    String(prevMatch.winner_player_id) !== String(playerId)

  // Resiliencia: win streak >= 5 (implies a prior loss before the streak)
  const winStreakAfterLoss = winStreak

  return {
    player,
    context: {
      matchConfirmed: {
        totalConfirmedMatches,
        winStreak,
        distinctOpponentCount: opponentIds.size,
        hadRecentLoss,
        winStreakAfterLoss,
        totalAces: player?.match_aces || 0,
      },
    },
  }
}

async function checkMatchAchievements(confirmedMatch) {
  const playerIds = [
    confirmedMatch.created_by_player_id,
    confirmedMatch.opponent_player_id,
  ].filter(Boolean)

  for (const playerId of playerIds) {
    const { player, context } = await buildMatchContext(playerId)
    if (!player) continue

    await checkAndUnlockAchievements({
      player,
      userId: player.user_id,
      context,
    })
  }
}

const matchStatFields = [
  { key: 'aces', label: 'Aces' },
  { key: 'double_faults', label: 'Dobles faltas' },
  { key: 'winners', label: 'Winners' },
  { key: 'unforced_errors', label: 'Errores no forzados' },
  { key: 'forced_errors', label: 'Errores forzados' },
  { key: 'match_points', label: 'Puntos de partido' },
  { key: 'points_against', label: 'Puntos en contra' },
]

const MATCHES_HERO_IMAGE =
  'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1800&q=80'

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
          .select('id, user_id, full_name, email, avatar_url, xp, level, club_id, current_category, suggested_category, is_coach, club_membership_status')
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

    if (!opponent) {
      setError('Selecciona rival.')
      return
    }

    const isQuickResult = form.matchMode === 'completed'
    const isScheduledMatch = form.matchMode === 'scheduled' || form.matchMode === 'live'
    const isLiveMatch = form.matchMode === 'live'

    if (isQuickResult && (!score || !form.winnerId)) {
      setError('Selecciona marcador y ganador.')
      return
    }

    if (isScheduledMatch && (!form.matchDate || !form.matchTime || !form.court.trim())) {
      setError('Para programar partido necesitas fecha, hora y cancha.')
      return
    }

    if (isLiveMatch && !form.judgePlayerId) {
      setError('Selecciona juez para el partido live.')
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
        winner_player_id: isQuickResult ? String(form.winnerId) : null,
        match_type: form.matchType,
        match_date: form.matchDate,
        match_time: form.matchTime || null,
        court: form.court.trim() || null,
        score: isQuickResult ? score : null,
        score_sets: isQuickResult ? form.scoreSets : [],
        has_live_judge: isLiveMatch,
        is_live_match: isLiveMatch,
        judge_player_id: isLiveMatch && form.judgePlayerId ? String(form.judgePlayerId) : null,
        judge_user_id: isLiveMatch && form.judgePlayerId
          ? (players.find((p) => String(p.id) === form.judgePlayerId)?.user_id || null)
          : null,
        creator_stats: form.creatorStats,
        opponent_stats: form.opponentStats,
        status: isQuickResult ? 'pending' : 'scheduled',
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
    } else {
      setMatches((current) => [data, ...current])
      setForm(createDefaultForm())
      setToast(
        isQuickResult
          ? 'Resultado registrado. El rival debe confirmarlo para acreditar XP.'
          : 'Partido programado. Los jugadores recibiran notificacion.'
      )
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

      // Check achievements for both players involved in this match
      await checkMatchAchievements(data)
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

  const pendingMatches = matches.filter((match) => match.status === 'pending').length
  const liveMatches = matches.filter((match) => match.is_live_match || match.has_live_judge).length

  return (
    <section className="grid gap-5 bg-open-bg">
      <article className="relative overflow-hidden rounded-[2rem] border border-open-light bg-open-ink text-white shadow-xl shadow-black/5">
        <img src={MATCHES_HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/78 to-black/20" />
        <div className="relative grid gap-8 p-7 sm:p-9 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">Competencia</p>
            <h1 className="mt-5 max-w-2xl text-5xl font-black leading-[0.92] md:text-7xl">
              Partidos amistosos.
            </h1>
            <p className="mt-5 max-w-xl text-sm font-semibold leading-6 text-white/72">
              Registra singles, confirma resultados y acredita XP automaticamente.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <HeroMetric label="Rivales" value={players.length} />
            <HeroMetric label="Historial" value={matches.length} />
            <HeroMetric label="Pendientes" value={pendingMatches} />
            <HeroMetric label="En vivo" value={liveMatches} />
          </div>
        </div>
      </article>

      {error ? (
        <p className="rounded-[1.4rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}

      {toast ? (
        <p className="rounded-[1.4rem] border border-open-light bg-open-surface px-4 py-3 text-sm font-semibold text-open-ink">
          {toast}
        </p>
      ) : null}

      {!profile.clubId && !isProfileLoading ? (
        <p className="rounded-[2rem] border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
          Unete a un club para registrar partidos amistosos.
        </p>
      ) : null}

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

      {isLoading ? (
        <p className="text-sm text-open-muted">Cargando partidos...</p>
      ) : null}
    </section>
  )
}

function HeroMetric({ label, value }) {
  return (
    <article className="rounded-[1.4rem] border border-white/10 bg-white/15 p-4 text-white backdrop-blur-md">
      <p className="text-3xl font-black leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">{label}</p>
    </article>
  )
}

function MobileStepNav({ step, onStep, matchMode }) {
  const finalLabel =
    matchMode === 'scheduled'
      ? 'Agenda'
      : matchMode === 'live'
        ? 'Juez'
        : 'Marcador'
  const steps = [
    [1, 'Tipo'],
    [2, 'Rival'],
    [3, 'Registro'],
    [4, finalLabel],
  ]

  return (
    <div className="grid gap-2 md:hidden">
      <div className="grid grid-cols-4 gap-1 rounded-full border border-open-light bg-open-bg p-1">
        {steps.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onStep(value)}
            className={[
              'h-9 rounded-full text-[11px] font-black',
              step === value ? 'bg-open-ink text-white' : 'text-open-muted',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

function stepClassName(currentStep, targetStep) {
  return currentStep === targetStep ? 'grid gap-3' : 'hidden gap-3 md:grid'
}

function RivalPicker({ currentPlayer, matchType, opponent, players, value, onOpponent }) {
  const [isPicking, setIsPicking] = useState(false)
  const rivalLabel = matchType === 'doubles' ? 'Rival principal' : 'Rival'

  return (
    <section className="grid gap-3 rounded-[1.7rem] border border-open-light bg-open-bg p-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 sm:gap-3">
        <FacePlayerCard player={currentPlayer} label="Yo" />
        <div className="grid place-items-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-open-ink text-sm font-black text-white shadow-lg">
            VS
          </span>
        </div>
        <button type="button" onClick={() => setIsPicking((value) => !value)} className="text-left">
          <FacePlayerCard player={opponent} label={rivalLabel} muted={!opponent} />
        </button>
      </div>
      {isPicking ? (
        <div className="grid gap-2 rounded-[1.4rem] border border-open-light bg-open-surface p-2">
          <p className="px-2 text-xs font-black uppercase tracking-[0.16em] text-open-muted">
            {matchType === 'doubles' ? 'Selecciona rival principal de dobles' : 'Selecciona rival'}
          </p>
          <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {players.map((player) => (
              <button
                key={player.id}
                type="button"
                onClick={() => {
                  onOpponent(String(player.id))
                  setIsPicking(false)
                }}
                className={[
                  'flex items-center gap-3 rounded-[1.1rem] border px-3 py-3 text-left transition',
                  String(value) === String(player.id)
                    ? 'border-open-ink bg-open-ink text-white'
                    : 'border-open-light bg-open-bg text-open-ink hover:border-open-ink',
                ].join(' ')}
              >
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-open-light">
                  {player.avatar_url ? <img src={player.avatar_url} alt="" className="h-full w-full object-cover" /> : null}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black">{player.full_name || player.email}</span>
                  <span className="block text-[11px] font-bold opacity-60">Nivel {player.level || 1}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

function FacePlayerCard({ player, label, muted = false }) {
  const name = player?.full_name || player?.email || (muted ? 'Selecciona rival' : 'Jugador OPEN')
  const image = player?.avatar_url

  return (
    <article className={[
      'relative min-h-44 overflow-hidden rounded-[1.5rem] border border-open-light bg-open-ink text-white',
      muted ? 'opacity-75' : '',
    ].join(' ')}>
      {image ? (
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />
      <div className="relative flex h-full min-h-44 flex-col justify-between p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/65">{label}</p>
        <div>
          <p className="text-xl font-black leading-tight text-white">{name}</p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">
            Nivel {player?.level || 1}
          </p>
        </div>
      </div>
    </article>
  )
}

function ScoreCategory({
  currentPlayer,
  opponent,
  score,
  scoreSets,
  winnerId,
  onField,
  onSetScore,
}) {
  return (
    <section className="grid gap-3 rounded-[1.7rem] border border-open-light bg-open-bg p-3">
      <CategoryBanner
        kicker="Marcador"
        title="Resultado final"
        detail="Captura sets y ganador. Esta categoria es la minima para confirmar XP."
        image="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=80"
      />
      <ScoreDial
        opponent={opponent}
        scoreSets={scoreSets}
        onSetScore={onSetScore}
      />
      {score ? (
        <p className="rounded-[1.2rem] border border-open-light bg-open-surface px-4 py-3 text-sm font-black text-open-ink">
          Marcador: {score}
        </p>
      ) : null}
      <div className="grid gap-2">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-open-muted">
          Ganador
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <WinnerButton
            isSelected={winnerId === String(currentPlayer?.id || '')}
            label="Yo gane"
            onClick={() => onField('winnerId', String(currentPlayer?.id || ''))}
          />
          <WinnerButton
            isSelected={winnerId === String(opponent?.id || '')}
            label={opponent ? `${opponent.full_name || 'Rival'} gano` : 'Rival gano'}
            onClick={() => onField('winnerId', String(opponent?.id || ''))}
            disabled={!opponent}
          />
        </div>
      </div>
    </section>
  )
}

function ScheduleDetailsCategory({ form, onField, title = 'Fecha, hora y cancha', detail = 'El rival recibira notificacion con fecha, hora y cancha.' }) {
  return (
    <section className="grid gap-3 rounded-[1.7rem] border border-open-light bg-open-bg p-3">
      <CategoryBanner
        kicker="Agenda"
        title={title}
        detail={detail}
        image="https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=1200&q=80"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          type="date"
          value={form.matchDate}
          onChange={(event) => onField('matchDate', event.target.value)}
          className={inputClassName}
        />
        <input
          type="time"
          value={form.matchTime}
          onChange={(event) => onField('matchTime', event.target.value)}
          className={inputClassName}
        />
        <input
          value={form.court}
          onChange={(event) => onField('court', event.target.value)}
          placeholder="Cancha fisica"
          className={inputClassName}
        />
      </div>
    </section>
  )
}

function LiveJudgeCategory({ form, players, onField }) {
  return (
    <section className="grid gap-3 rounded-[1.7rem] border border-open-light bg-open-bg p-3">
      <CategoryBanner
        kicker="Live match"
        title="Juez y control live"
        detail="El juez abre una pantalla separada para llevar marcador, ritmo y estadistica compleja."
        image="https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1200&q=80"
      />
      <select
        value={form.judgePlayerId}
        onChange={(event) => onField('judgePlayerId', event.target.value)}
        className={inputClassName}
      >
        <option value="">Selecciona juez</option>
        {players.map((player) => (
          <option key={player.id} value={player.id}>
            {player.full_name || player.email}
          </option>
        ))}
      </select>
    </section>
  )
}

function SegmentedControl({ label, value, options, onChange }) {
  return (
    <div className="grid gap-2">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-open-muted">{label}</p>
      <div className="grid grid-cols-2 gap-1 rounded-full border border-open-light bg-open-surface p-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              'h-10 rounded-full text-xs font-black transition',
              value === option.value ? 'bg-open-ink text-white' : 'text-open-muted hover:bg-open-bg hover:text-open-ink',
            ].join(' ')}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function MatchTypeCategory({ value, onField }) {
  return (
    <section className="grid gap-3 rounded-[1.7rem] border border-open-light bg-open-bg p-3">
      <CategoryBanner
        kicker="Paso 1"
        title="Tipo de partido"
        detail="Primero define si jugaras singles o dobles. Despues eliges rival o rivales."
        image="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=80"
      />
      <SegmentedControl
        label="Formato"
        value={value}
        options={[
          { value: 'singles', label: 'Singles' },
          { value: 'doubles', label: 'Dobles' },
        ]}
        onChange={(nextValue) => onField('matchType', nextValue)}
      />
    </section>
  )
}

function RegistrationModeCategory({ value, onField }) {
  return (
    <section className="grid gap-3 rounded-[1.7rem] border border-open-light bg-open-bg p-3">
      <CategoryBanner
        kicker="Sistema"
        title="Como se registrara"
        detail="Resultado rapido para capturar marcador; programado para notificar fecha, hora y cancha; live para marcador en vivo con juez."
        image="https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1200&q=80"
      />
      <div className="grid gap-2 md:grid-cols-3">
        {[
          ['completed', 'Resultado rapido', 'Solo marcador o estadistica final.'],
          ['scheduled', 'Partido programado', 'Notifica a ambos jugadores.'],
          ['live', 'Partido live', 'Elige juez y marcador en vivo.'],
        ].map(([mode, label, detail]) => (
          <button
            key={mode}
            type="button"
            onClick={() => onField('matchMode', mode)}
            className={[
              'rounded-[1.35rem] border p-4 text-left transition',
              value === mode
                ? 'border-open-ink bg-open-ink text-white'
                : 'border-open-light bg-open-surface text-open-ink hover:border-open-ink',
            ].join(' ')}
          >
            <span className="block text-base font-black">{label}</span>
            <span className="mt-1 block text-xs font-semibold opacity-65">{detail}</span>
          </button>
        ))}
      </div>
    </section>
  )
}

function modeLabel(mode) {
  const labels = {
    completed: 'Resultado rapido',
    scheduled: 'Programado',
    live: 'Live',
  }

  return labels[mode] || 'Resultado rapido'
}

function submitLabel(mode) {
  const labels = {
    completed: 'Registrar resultado',
    scheduled: 'Programar partido',
    live: 'Programar live match',
  }

  return labels[mode] || 'Registrar partido'
}

function CategoryBanner({ kicker, title, detail, image }) {
  return (
    <div className="relative overflow-hidden rounded-[1.45rem] bg-open-ink p-4 text-white">
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/72 to-black/20" />
      <div className="relative">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-200/90">{kicker}</p>
        <h3 className="mt-2 text-3xl font-black leading-none">{title}</h3>
        <p className="mt-2 max-w-xl text-xs font-semibold leading-5 text-white/68">{detail}</p>
      </div>
    </div>
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
  const [showStats, setShowStats] = useState(false)
  const [mobileStep, setMobileStep] = useState(1)

  return (
    <article className="grid gap-5 rounded-[2rem] border border-open-light bg-open-surface p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-open-ink text-white">
            <Swords size={19} strokeWidth={2} />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-open-muted">Nuevo partido</p>
            <h2 className="text-2xl font-black text-open-ink">Crear partido</h2>
          </div>
        </div>
        <span className="rounded-full border border-open-light bg-open-bg px-3 py-1 text-xs font-bold text-open-muted">
          {form.matchType === 'doubles' ? 'Dobles' : 'Singles'} - {modeLabel(form.matchMode)}
        </span>
      </div>

      <MobileStepNav step={mobileStep} onStep={setMobileStep} matchMode={form.matchMode} />

      <div className={stepClassName(mobileStep, 1)}>
        <MatchTypeCategory value={form.matchType} onField={onField} />
      </div>

      <div className={stepClassName(mobileStep, 2)}>
        <RivalPicker
          currentPlayer={currentPlayer}
          matchType={form.matchType}
          opponent={opponent}
          players={players}
          value={form.opponentId}
          onOpponent={onOpponent}
        />
      </div>

      <div className={stepClassName(mobileStep, 3)}>
        <RegistrationModeCategory value={form.matchMode} onField={onField} />
      </div>

      {form.matchMode === 'completed' ? (
        <div className={stepClassName(mobileStep, 4)}>
          <ScoreCategory
            currentPlayer={currentPlayer}
            opponent={opponent}
            score={score}
            scoreSets={form.scoreSets}
            winnerId={form.winnerId}
            onField={onField}
            onSetScore={onSetScore}
          />
        </div>
      ) : null}

      {false ? <div className={[stepClassName(mobileStep, form.matchMode === 'scheduled' ? 3 : 4), 'overflow-hidden rounded-[1.7rem] border border-open-light bg-open-bg p-3'].join(' ')}>
        <CategoryBanner
          kicker="Live match"
          title="Juez en vivo"
          detail="Activa una vista separada para que otra persona lleve marcador y estadisticas."
          image="https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1200&q=80"
        />

      <label className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-open-light bg-open-bg px-4 py-4 text-sm font-semibold text-open-ink">
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

      {form.isLiveMatch && (
        <select
          value={form.judgePlayerId}
          onChange={(event) => onField('judgePlayerId', event.target.value)}
          className={inputClassName}
        >
          <option value="">Juez (opcional — cualquiera puede juzgar)</option>
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.full_name || player.email}
            </option>
          ))}
        </select>
      )}
      </div> : null}

      {form.matchMode === 'scheduled' ? (
        <div className={stepClassName(mobileStep, 4)}>
          <ScheduleDetailsCategory
            form={form}
            onField={onField}
            title="Partido programado"
            detail="Define fecha, hora y cancha fisica. Se avisara a ambos jugadores."
          />
        </div>
      ) : null}

      {form.matchMode === 'live' ? (
        <div className={stepClassName(mobileStep, 4)}>
          <ScheduleDetailsCategory
            form={form}
            onField={onField}
            title="Agenda live"
            detail="Programa el encuentro para que el juez llegue a la pantalla live correcta."
          />
          <LiveJudgeCategory form={form} players={players} onField={onField} />
        </div>
      ) : null}

      {form.matchMode !== 'scheduled' ? (
      <div className={[stepClassName(mobileStep, 4), 'rounded-[1.4rem] border border-open-light bg-open-bg p-3'].join(' ')}>
        <button
          type="button"
          onClick={() => setShowStats((value) => !value)}
          className="flex h-11 items-center justify-between rounded-full bg-open-surface px-4 text-sm font-black text-open-ink"
        >
          Estadisticas avanzadas
          <span className="text-xs text-open-muted">{showStats ? 'Ocultar' : 'Opcional'}</span>
        </button>
        {showStats ? (
          <MatchStatsEditor
            currentPlayer={currentPlayer}
            creatorStats={form.creatorStats}
            opponent={opponent}
            opponentStats={form.opponentStats}
            onStat={onStat}
          />
        ) : null}
      </div>
      ) : null}

      <button
        type="button"
        onClick={onCreate}
        disabled={isSaving}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-open-primary px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-open-muted"
      >
        <ClipboardList size={16} strokeWidth={1.8} />
        {isSaving ? 'Guardando...' : submitLabel(form.matchMode)}
      </button>
    </article>
  )
}

function ScoreDial({ opponent, scoreSets, onSetScore }) {
  return (
    <div className="grid gap-3 rounded-[1.5rem] border border-open-light bg-open-bg p-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-open-muted">
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
    <div className="grid grid-cols-[38px_1fr_38px] items-center rounded-[1.2rem] border border-open-light bg-open-surface">
      <button
        type="button"
        onClick={() => onChange(Math.max(value - 1, 0))}
        className="h-12 text-lg font-black text-open-muted"
      >
        -
      </button>
      <div className="text-center">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-open-muted">
          {label}
        </span>
        <span className="block text-xl font-black text-open-ink">{value}</span>
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(value + 1, 99))}
        className="h-12 text-lg font-black text-open-ink"
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
    <div className="grid gap-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-open-muted">
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
      <h3 className="text-sm font-black text-open-ink">{label}</h3>
      {matchStatFields.map((field) => (
        <div
          key={field.key}
          className="grid grid-cols-[1fr_34px_38px_34px] items-center gap-2 rounded-[1rem] border border-open-light bg-open-surface px-2 py-2"
        >
          <span className="text-xs font-semibold text-open-muted">
            {field.label}
          </span>
          <button
            type="button"
            onClick={() => onStat(side, field.key, (stats[field.key] || 0) - 1)}
            className="h-8 rounded-full border border-open-light bg-open-bg text-sm font-black"
          >
            -
          </button>
          <span className="text-center text-sm font-semibold text-open-ink">
            {stats[field.key] || 0}
          </span>
          <button
            type="button"
            onClick={() => onStat(side, field.key, (stats[field.key] || 0) + 1)}
            className="h-8 rounded-full border border-open-light bg-open-bg text-sm font-black"
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
        'h-11 rounded-full border px-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50',
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
  const [isOpen, setIsOpen] = useState(false)

  return (
    <article className="grid gap-4 rounded-[2rem] border border-open-light bg-open-surface p-4 shadow-sm sm:p-5">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex flex-wrap items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-open-ink text-white">
            <Trophy size={18} strokeWidth={2} />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-open-muted">Historial</p>
            <h2 className="text-2xl font-black text-open-ink">Confirmaciones</h2>
          </div>
        </div>
        <span className="rounded-full border border-open-light bg-open-bg px-3 py-1 text-xs font-bold text-open-muted">
          {isOpen ? 'Ocultar' : `${matches.length} partidos`}
        </span>
      </button>

      {isOpen ? (
        <>
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
            <p className="rounded-[1.4rem] border border-open-light bg-open-bg px-4 py-8 text-center text-sm text-open-muted">
              Todavia no tienes partidos amistosos.
            </p>
          ) : null}
        </>
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
  const canJudge =
    match.is_live_match &&
    (match.status === 'pending' || match.status === 'scheduled') &&
    (!match.judge_player_id || String(match.judge_player_id) === String(currentPlayer?.id))
  const winnerName =
    !match.winner_player_id
      ? 'Pendiente'
      : String(match.winner_player_id) === String(currentPlayer?.id)
      ? 'Tu'
      : opponent?.full_name || 'Rival'

  return (
    <article className="grid gap-4 rounded-[1.6rem] border border-open-light bg-open-bg p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-open-ink">
            vs {opponent?.full_name || 'Jugador OPEN'}
          </h3>
          <p className="mt-1 text-xs font-semibold text-open-muted">
            {match.match_date}
            {match.match_time ? ` ${String(match.match_time).slice(0, 5)}` : ''}
            {match.score ? ` - ${match.score}` : ''}
            {' '} - Ganador: {winnerName}
          </p>
          <p className="mt-1 text-xs text-open-muted">
            {match.court || 'Cancha pendiente'} - {formatStatus(match.status)}
          </p>
        </div>
        <span className="rounded-full border border-open-light bg-open-surface px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-open-muted">
          {match.match_type === 'doubles' ? 'Dobles' : match.is_live_match || match.has_live_judge ? 'En vivo' : 'Manual'}
        </span>
      </div>

      {canConfirm || canJudge ? (
        <div className="flex flex-wrap gap-2">
          {canConfirm && (
            <>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isSaving}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-open-ink px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-open-muted"
              >
                <Check size={16} strokeWidth={1.8} />
                Confirmar
              </button>
              <button
                type="button"
                onClick={onReject}
                disabled={isSaving}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-open-light bg-open-surface px-4 text-sm font-black text-open-ink disabled:opacity-50"
              >
                <X size={16} strokeWidth={1.8} />
                Rechazar
              </button>
            </>
          )}
          {canJudge && (
            <Link
              to={`/live-match/${match.id}`}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-open-light bg-open-surface px-4 text-sm font-black text-open-ink transition hover:border-open-primary"
            >
              <ExternalLink size={16} strokeWidth={1.8} />
              Abrir como Juez
            </Link>
          )}
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
    scheduled: 'Programado',
    confirmed: 'Confirmado',
    rejected: 'Rechazado',
    expired: 'Expirado',
  }

  return labels[status] || status
}

function createDefaultForm() {
  return {
    opponentId: '',
    matchMode: 'completed',
    matchType: 'singles',
    matchDate: new Date().toISOString().slice(0, 10),
    matchTime: '',
    court: '',
    scoreSets: [
      { player: 0, opponent: 0 },
      { player: 0, opponent: 0 },
      { player: 0, opponent: 0 },
    ],
    winnerId: '',
    isLiveMatch: false,
    judgePlayerId: '',
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

const inputClassName =
  'h-12 w-full rounded-[1.1rem] border border-open-light bg-open-bg px-3 text-sm font-semibold text-open-ink outline-none focus:border-open-primary'

export default FriendlyMatchesView
