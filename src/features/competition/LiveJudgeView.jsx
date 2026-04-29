import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Wifi } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import usePlayerProfile from '../profile/usePlayerProfile'

// ─── Tennis scoring engine ───────────────────────────────────────────────────

const POINT_LABELS = ['0', '15', '30', '40']

function createInitialState() {
  return {
    sets: [],           // [{ a: number, b: number }]
    games: { a: 0, b: 0 },
    points: { a: 0, b: 0 },  // 0-3 indices; 4 = Ad-A, 5 = Ad-B (deuce state)
    isDeuce: false,
    adPlayer: null,     // 'a' | 'b' | null
    isTiebreak: false,
    tiePoints: { a: 0, b: 0 },
    stats: {
      a: { aces: 0, doubleFaults: 0, winners: 0, unforcedErrors: 0, forcedErrors: 0 },
      b: { aces: 0, doubleFaults: 0, winners: 0, unforcedErrors: 0, forcedErrors: 0 },
    },
    history: [],        // stack of snapshots for undo
    winner: null,       // 'a' | 'b' when match ends
  }
}

function snapshot(state) {
  return JSON.parse(JSON.stringify({
    sets: state.sets,
    games: state.games,
    points: state.points,
    isDeuce: state.isDeuce,
    adPlayer: state.adPlayer,
    isTiebreak: state.isTiebreak,
    tiePoints: state.tiePoints,
    stats: state.stats,
    winner: state.winner,
  }))
}

function awardGame(state, winner) {
  const loser = winner === 'a' ? 'b' : 'a'
  const newGames = { ...state.games, [winner]: state.games[winner] + 1 }

  // Check set win: 6 games and 2 ahead, or 7-5, or tie-break reached 7-6
  const w = newGames[winner]
  const l = newGames[loser]

  const wonSet = (w >= 6 && w - l >= 2) || w === 7

  if (wonSet) {
    const newSets = [...state.sets, { a: newGames.a, b: newGames.b }]
    const setsWon = { a: 0, b: 0 }
    for (const s of newSets) {
      if (s.a > s.b) setsWon.a++
      else setsWon.b++
    }
    const matchWinner = setsWon.a >= 2 ? 'a' : setsWon.b >= 2 ? 'b' : null
    return {
      ...state,
      sets: newSets,
      games: { a: 0, b: 0 },
      points: { a: 0, b: 0 },
      isDeuce: false,
      adPlayer: null,
      isTiebreak: false,
      tiePoints: { a: 0, b: 0 },
      winner: matchWinner,
    }
  }

  // Tie-break at 6-6
  const isTiebreak = newGames.a === 6 && newGames.b === 6

  return {
    ...state,
    games: newGames,
    points: { a: 0, b: 0 },
    isDeuce: false,
    adPlayer: null,
    isTiebreak,
    tiePoints: { a: 0, b: 0 },
  }
}

function awardPoint(state, player) {
  if (state.winner) return state

  // Tie-break scoring
  if (state.isTiebreak) {
    const newTie = { ...state.tiePoints, [player]: state.tiePoints[player] + 1 }
    const opp = player === 'a' ? 'b' : 'a'
    const wonTiebreak =
      newTie[player] >= 7 && newTie[player] - newTie[opp] >= 2

    if (wonTiebreak) {
      const withTieScore = {
        ...state,
        tiePoints: newTie,
        games: { ...state.games, [player]: state.games[player] + 1 },
      }
      return awardGame(withTieScore, player)
    }

    return { ...state, tiePoints: newTie }
  }

  // Regular scoring
  if (state.isDeuce) {
    if (state.adPlayer === player) {
      return awardGame({ ...state, adPlayer: null, isDeuce: false }, player)
    } else if (state.adPlayer === null) {
      return { ...state, adPlayer: player }
    } else {
      return { ...state, adPlayer: null }
    }
  }

  const opp = player === 'a' ? 'b' : 'a'
  const newPoints = { ...state.points, [player]: state.points[player] + 1 }

  if (newPoints[player] >= 3 && newPoints[opp] >= 3) {
    return { ...state, points: { a: 3, b: 3 }, isDeuce: true, adPlayer: null }
  }

  if (newPoints[player] >= 4) {
    return awardGame({ ...state, points: { a: 0, b: 0 } }, player)
  }

  return { ...state, points: newPoints }
}

function scoreReducer(state, action) {
  switch (action.type) {
    case 'POINT': {
      const prev = snapshot(state)
      const next = awardPoint(state, action.player)
      return {
        ...next,
        history: [...state.history, prev],
      }
    }
    case 'STAT': {
      return {
        ...state,
        stats: {
          ...state.stats,
          [action.player]: {
            ...state.stats[action.player],
            [action.stat]: state.stats[action.player][action.stat] + 1,
          },
        },
      }
    }
    case 'UNDO': {
      if (!state.history.length) return state
      const prev = state.history[state.history.length - 1]
      return {
        ...prev,
        history: state.history.slice(0, -1),
      }
    }
    case 'LOAD':
      return { ...action.state, history: [] }
    default:
      return state
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPointLabel(state, player) {
  if (state.isTiebreak) return String(state.tiePoints[player])
  if (state.isDeuce) {
    if (state.adPlayer === player) return 'AD'
    if (state.adPlayer === null) return '40'
    return '40'
  }
  return POINT_LABELS[state.points[player]] ?? '0'
}

function buildScoreString(sets) {
  return sets.map((s) => `${s.a}-${s.b}`).join(' ')
}

function buildWinnerId(winner, playerA, playerB) {
  return winner === 'a' ? String(playerA?.id || '') : String(playerB?.id || '')
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LiveJudgeView() {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { player: currentPlayer, user } = usePlayerProfile()
  const [match, setMatch] = useState(null)
  const [playerA, setPlayerA] = useState(null)
  const [playerB, setPlayerB] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isClosing, setIsClosing] = useState(false)
  const [score, dispatch] = useReducer(scoreReducer, null, createInitialState)

  const saveRef = useRef(null)

  // Load match data
  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setIsLoading(true)
      const { data, error: matchError } = await supabase
        .from('friendly_matches')
        .select('*')
        .eq('id', matchId)
        .maybeSingle()

      if (!isMounted) return

      if (matchError || !data) {
        setError(matchError?.message || 'Partido no encontrado.')
        setIsLoading(false)
        return
      }

      setMatch(data)

      const [resA, resB] = await Promise.all([
        supabase.from('players').select('id, user_id, full_name, email').eq('id', data.created_by_player_id).maybeSingle(),
        supabase.from('players').select('id, user_id, full_name, email').eq('id', data.opponent_player_id).maybeSingle(),
      ])

      if (isMounted) {
        setPlayerA(resA.data || null)
        setPlayerB(resB.data || null)

        if (data.live_state) {
          dispatch({ type: 'LOAD', state: data.live_state })
        }

        setIsLoading(false)
      }
    }

    load()
    return () => { isMounted = false }
  }, [matchId])

  // Auto-save live_state every 5 seconds
  useEffect(() => {
    if (!match?.id) return

    const persist = async () => {
      await supabase
        .from('friendly_matches')
        .update({ live_state: snapshot(score) })
        .eq('id', match.id)
    }

    saveRef.current = setInterval(persist, 5000)
    return () => clearInterval(saveRef.current)
  }, [match?.id, score])

  const handlePoint = useCallback((player) => {
    dispatch({ type: 'POINT', player })
  }, [])

  const handleStat = useCallback((player, stat) => {
    dispatch({ type: 'STAT', player, stat })
    if (stat === 'aces') dispatch({ type: 'POINT', player })
    if (stat === 'doubleFaults') dispatch({ type: 'POINT', player: player === 'a' ? 'b' : 'a' })
  }, [])

  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO' })
  }, [])

  const handleCloseMatch = async () => {
    if (!match || !playerA || !playerB) return
    if (!score.winner) {
      const confirmed = window.confirm('El partido no tiene un ganador. ¿Cerrar de todas formas?')
      if (!confirmed) return
    }

    setIsClosing(true)

    const scoreString = buildScoreString(score.sets)
    const winnerId = score.winner ? buildWinnerId(score.winner, playerA, playerB) : match.winner_player_id

    const creatorStats = score.stats.a
    const opponentStats = score.stats.b

    const { error: closeError } = await supabase
      .from('friendly_matches')
      .update({
        status: 'pending',
        score: scoreString || match.score,
        winner_player_id: winnerId,
        live_state: snapshot(score),
        creator_stats: {
          aces: creatorStats.aces,
          double_faults: creatorStats.doubleFaults,
          winners: creatorStats.winners,
          unforced_errors: creatorStats.unforcedErrors,
          forced_errors: creatorStats.forcedErrors,
          match_points: 0,
          points_against: 0,
        },
        opponent_stats: {
          aces: opponentStats.aces,
          double_faults: opponentStats.doubleFaults,
          winners: opponentStats.winners,
          unforced_errors: opponentStats.unforcedErrors,
          forced_errors: opponentStats.forcedErrors,
          match_points: 0,
          points_against: 0,
        },
      })
      .eq('id', match.id)

    if (closeError) {
      setError(closeError.message)
      setIsClosing(false)
      return
    }

    navigate('/matches')
  }

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-open-bg text-sm text-open-muted">
        Cargando partido en vivo...
      </main>
    )
  }

  if (error || !match) {
    return (
      <main className="grid min-h-screen place-items-center bg-open-bg">
        <div className="grid gap-4 text-center">
          <p className="text-sm text-open-muted">{error || 'Partido no encontrado.'}</p>
          <Link to="/matches" className="text-sm font-semibold text-open-ink underline">
            Volver a partidos
          </Link>
        </div>
      </main>
    )
  }

  const isJudge = user?.id && (
    !match.judge_user_id || match.judge_user_id === user.id
  )

  const setsWon = score.sets.reduce(
    (acc, s) => {
      if (s.a > s.b) acc.a++
      else acc.b++
      return acc
    },
    { a: 0, b: 0 },
  )

  const nameA = playerA?.full_name || playerA?.email || 'Jugador A'
  const nameB = playerB?.full_name || playerB?.email || 'Jugador B'

  return (
    <main className="min-h-screen bg-open-bg px-4 py-6">
      <div className="mx-auto grid w-full max-w-2xl gap-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/matches"
            className="inline-flex h-10 items-center gap-2 border border-open-light bg-open-surface px-3 text-sm font-semibold text-open-ink transition hover:border-open-primary"
          >
            <ArrowLeft size={16} strokeWidth={1.8} />
            Partidos
          </Link>
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
            <Wifi size={14} strokeWidth={1.8} />
            En vivo
          </span>
        </div>

        {/* Scoreboard */}
        <section className="border border-open-light bg-open-surface p-5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            {/* Player A */}
            <div className="grid gap-1 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
                {nameA}
              </p>
              <p className="text-5xl font-semibold text-open-ink">
                {setsWon.a}
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs font-semibold text-open-muted">sets</p>
            </div>

            {/* Player B */}
            <div className="grid gap-1 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
                {nameB}
              </p>
              <p className="text-5xl font-semibold text-open-ink">
                {setsWon.b}
              </p>
            </div>
          </div>

          {/* Sets detail */}
          {score.sets.length > 0 && (
            <div className="mt-4 flex justify-center gap-3">
              {score.sets.map((s, i) => (
                <span key={i} className="text-sm font-semibold text-open-muted">
                  {s.a}-{s.b}
                </span>
              ))}
            </div>
          )}

          {/* Current game / tie-break */}
          <div className="mt-5 grid grid-cols-3 items-center border-t border-open-light pt-4 text-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-open-muted">
                {score.isTiebreak ? 'Tie-break' : 'Games'}
              </p>
              <p className="mt-1 text-2xl font-semibold text-open-ink">
                {score.isTiebreak ? score.tiePoints.a : score.games.a}
              </p>
            </div>
            <div className="text-xs font-semibold text-open-muted">
              {score.isTiebreak ? 'pts' : 'juegos'}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-open-muted">
                {score.isTiebreak ? 'Tie-break' : 'Games'}
              </p>
              <p className="mt-1 text-2xl font-semibold text-open-ink">
                {score.isTiebreak ? score.tiePoints.b : score.games.b}
              </p>
            </div>
          </div>

          {/* Points */}
          <div className="mt-4 grid grid-cols-3 items-center border-t border-open-light pt-4 text-center">
            <p className="text-4xl font-semibold text-open-ink">
              {getPointLabel(score, 'a')}
            </p>
            <p className="text-xs font-semibold text-open-muted">puntos</p>
            <p className="text-4xl font-semibold text-open-ink">
              {getPointLabel(score, 'b')}
            </p>
          </div>

          {score.winner && (
            <div className="mt-4 border-t border-open-light pt-4 text-center">
              <p className="text-sm font-semibold text-open-ink">
                Ganador: {score.winner === 'a' ? nameA : nameB}
              </p>
            </div>
          )}
        </section>

        {/* Point buttons */}
        {isJudge && !score.winner && (
          <section className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handlePoint('a')}
              className="h-16 border border-open-ink bg-open-ink text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
            >
              PUNTO {nameA.split(' ')[0].toUpperCase()}
            </button>
            <button
              type="button"
              onClick={() => handlePoint('b')}
              className="h-16 border border-open-light bg-open-surface text-sm font-semibold text-open-ink transition hover:border-open-ink active:scale-95"
            >
              PUNTO {nameB.split(' ')[0].toUpperCase()}
            </button>
          </section>
        )}

        {/* Stat buttons */}
        {isJudge && (
          <section className="grid gap-4 border border-open-light bg-open-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
              Estadisticas (registrar otorga punto automaticamente)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <StatColumn
                label={nameA}
                player="a"
                stats={score.stats.a}
                disabled={!!score.winner}
                onStat={handleStat}
              />
              <StatColumn
                label={nameB}
                player="b"
                stats={score.stats.b}
                disabled={!!score.winner}
                onStat={handleStat}
              />
            </div>
          </section>
        )}

        {/* Undo + close */}
        {isJudge && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!score.history.length}
              className="inline-flex h-11 items-center gap-2 border border-open-light bg-open-surface px-4 text-sm font-semibold text-open-ink transition hover:border-open-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw size={16} strokeWidth={1.8} />
              Deshacer
            </button>
            <button
              type="button"
              onClick={handleCloseMatch}
              disabled={isClosing}
              className="inline-flex h-11 items-center gap-2 bg-open-primary px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-open-muted"
            >
              {isClosing ? 'Cerrando...' : 'Cerrar partido'}
            </button>
          </div>
        )}

        {!isJudge && (
          <p className="border border-open-light bg-open-surface px-4 py-3 text-sm text-open-muted">
            Solo el juez asignado puede registrar puntos.
          </p>
        )}

        {error && (
          <p className="border border-open-light bg-open-surface px-4 py-3 text-sm text-open-muted">
            {error}
          </p>
        )}
      </div>
    </main>
  )
}

const STAT_LABELS = {
  aces: 'Ace (+pto)',
  doubleFaults: 'D. falta (-pto)',
  winners: 'Winner',
  unforcedErrors: 'Error NF',
  forcedErrors: 'Error F',
}

function StatColumn({ label, player, stats, disabled, onStat }) {
  return (
    <div className="grid gap-2">
      <p className="text-xs font-semibold text-open-ink">{label}</p>
      {Object.entries(STAT_LABELS).map(([key, statLabel]) => (
        <button
          key={key}
          type="button"
          disabled={disabled}
          onClick={() => onStat(player, key)}
          className="flex items-center justify-between border border-open-light bg-open-bg px-3 py-2 text-xs font-semibold text-open-ink transition hover:border-open-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span>{statLabel}</span>
          <span className="text-open-muted">{stats[key]}</span>
        </button>
      ))}
    </div>
  )
}
