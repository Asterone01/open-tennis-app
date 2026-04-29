import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, Eye, Minus, Plus, Save, UserRound, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ClubPlayersManager from '../admin/ClubPlayersManager'
import { checkAndUnlockAchievements } from '../gamification/achievementsLedger'
import { XP_SOURCES, awardPlayerXp } from '../gamification/xpLedger'
import { ensurePlayerProfile } from '../profile/profileConnections'
import TrainingSessionsView from './TrainingSessionsView'

const statFields = [
  {
    key: 'stat_derecha',
    label: 'Derecha',
    cue: 'Profundidad, control cruzado/paralelo y capacidad de atacar sin regalar.',
  },
  {
    key: 'stat_reves',
    label: 'Reves',
    cue: 'Consistencia bajo presion, direccion y recuperacion despues del golpe.',
  },
  {
    key: 'stat_saque',
    label: 'Saque',
    cue: 'Porcentaje de primer saque, colocacion, doble falta y ventaja despues del saque.',
  },
  {
    key: 'stat_volea',
    label: 'Volea',
    cue: 'Posicion en red, bloqueo, cierre de punto y lectura de passing.',
  },
  {
    key: 'stat_movilidad',
    label: 'Movilidad',
    cue: 'Split step, recuperacion al centro, cambios de direccion y resistencia.',
  },
  {
    key: 'stat_slice',
    label: 'Slice',
    cue: 'Control de altura, profundidad, variacion de ritmo y uso tactico.',
  },
]

const evaluationReasons = [
  'Revision mensual',
  'Despues de 4 entrenamientos',
  'Despues de partido',
  'Cambio de categoria',
]

const playerSelect = [
  'id',
  'user_id',
  'full_name',
  'email',
  'xp',
  'level',
  'club_id',
  'club_membership_status',
  'current_category',
  'suggested_category',
  ...statFields.map((field) => field.key),
].join(', ')

function EvaluationsView() {
  const [players, setPlayers] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [stats, setStats] = useState(createDefaultStats())
  const [baselineStats, setBaselineStats] = useState(createDefaultStats())
  const [evaluationReason, setEvaluationReason] = useState(evaluationReasons[0])
  const [evaluationNotes, setEvaluationNotes] = useState('')
  const [promotedCategory, setPromotedCategory] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadPlayers = async () => {
      setIsLoading(true)
      setError('')

      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (!isMounted) return

      if (userError || !userData.user) {
        setError(userError?.message || 'No se pudo validar tu perfil de coach.')
        setPlayers([])
        setIsLoading(false)
        return
      }

      const { data: coachProfileData, error: coachError } = await supabase
        .from('players')
        .select('id, club_id, is_coach')
        .eq('user_id', userData.user.id)
        .maybeSingle()

      let coachProfile = coachProfileData

      if (!isMounted) return

      if (coachError) {
        setError(coachError.message)
        setPlayers([])
        setIsLoading(false)
        return
      }

      if (!coachProfile && userData.user.user_metadata?.role === 'coach') {
        const { data: ensuredProfile, error: ensureError } =
          await ensurePlayerProfile(userData.user, {
            role: 'coach',
            is_coach: true,
            force: true,
          })

        if (!isMounted) return

        if (ensureError) {
          setError(ensureError.message)
          setPlayers([])
          setIsLoading(false)
          return
        }

        coachProfile = ensuredProfile
      }

      if (!coachProfile?.club_id) {
        setPlayers([])
        setIsLoading(false)
        return
      }

      const { data, error: playersError } = await supabase
        .from('players')
        .select(playerSelect)
        .eq('club_id', coachProfile.club_id)
        .order('full_name', { ascending: true })

      if (!isMounted) return

      if (playersError) {
        setError(playersError.message)
      } else {
        setPlayers(data || [])
      }

      setIsLoading(false)
    }

    loadPlayers()

    return () => {
      isMounted = false
    }
  }, [])

  const openEvaluation = (player) => {
    const nextStats = {
      stat_derecha: player.stat_derecha ?? player.stat_ataque ?? 50,
      stat_reves: player.stat_reves ?? player.stat_defensa ?? 50,
      stat_saque: player.stat_saque ?? 50,
      stat_volea: player.stat_volea ?? player.stat_mentalidad ?? 50,
      stat_movilidad: player.stat_movilidad ?? player.stat_fisico ?? 50,
      stat_slice: player.stat_slice ?? 50,
    }

    setSelectedPlayer(player)
    setStats(nextStats)
    setBaselineStats(nextStats)
    setEvaluationReason(evaluationReasons[0])
    setEvaluationNotes('')
    setToast('')
    setError('')
  }

  const updateStat = (key, value) => {
    setStats((current) => ({
      ...current,
      [key]: clampScore(Number(value)),
    }))
  }

  const adjustStat = (key, amount) => {
    setStats((current) => ({
      ...current,
      [key]: clampScore((current[key] || 0) + amount),
    }))
  }

  const handleSave = async () => {
    if (!selectedPlayer) return

    const deltas = buildDeltas(stats, baselineStats)
    const hasChanges = deltas.some((item) => item.delta !== 0)
    const largestDelta = Math.max(...deltas.map((item) => Math.abs(item.delta)))

    if (!hasChanges) {
      setError('Ajusta al menos una habilidad antes de guardar.')
      return
    }

    if (!evaluationNotes.trim()) {
      setError('Agrega una justificacion breve antes de guardar la evaluacion.')
      return
    }

    if (largestDelta >= 5 && evaluationReason !== 'Cambio de categoria') {
      setError('Un cambio de 5 puntos requiere evaluacion formal de cambio de categoria.')
      return
    }

    setIsSaving(true)
    setError('')
    setToast('')

    const { data, error: saveError, historyError } = await awardPlayerXp({
      player: selectedPlayer,
      amount: XP_SOURCES.coach_evaluation,
      source: 'coach_evaluation',
      label: 'Evaluacion de coach',
      description: evaluationNotes.trim(),
      metadata: {
        reason: evaluationReason,
        previous_stats: baselineStats,
        stats,
        deltas,
      },
      playerUpdates: stats,
    })

    if (saveError) {
      setError(saveError.message)
    } else {
      const notificationError = await notifyEvaluatedPlayer({
        player: data,
        baselineStats,
        deltas,
        evaluationReason,
        stats,
      })

      // Category promotion achievements
      if (evaluationReason === 'Cambio de categoria' && promotedCategory) {
        const prevCategory = selectedPlayer.current_category || selectedPlayer.suggested_category
        if (prevCategory && promotedCategory !== prevCategory) {
          await supabase
            .from('players')
            .update({ current_category: promotedCategory })
            .eq('id', selectedPlayer.id)

          await checkAndUnlockAchievements({
            player: { ...data, current_category: promotedCategory },
            userId: data.user_id,
            context: {
              categoryPromoted: { from: prevCategory, to: promotedCategory },
            },
          })

          // Mentor achievement for the coach
          const { data: coachRow } = await supabase
            .from('players')
            .select('id, user_id, club_id')
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
            .maybeSingle()

          if (coachRow) {
            await checkAndUnlockAchievements({
              player: coachRow,
              userId: coachRow.user_id,
              context: { mentorPromotion: true },
            })
          }
        }
      }

      setPlayers((current) =>
        current.map((player) => (player.id === data.id ? data : player)),
      )
      setSelectedPlayer(data)
      setBaselineStats(stats)
      setEvaluationNotes('')
      setPromotedCategory('')
      if (historyError) {
        setToast(
          `Evaluacion guardada. +50 XP otorgados a ${data.full_name}. El historial se activara al correr el SQL de gamificacion.`,
        )
      } else if (notificationError) {
        setToast(
          `Evaluacion guardada. +50 XP otorgados a ${data.full_name}. No se pudo enviar la notificacion; revisa usuario vinculado y notifications_schema.sql.`,
        )
      } else {
        setToast(
          `Evaluacion guardada. +50 XP otorgados a ${data.full_name}. Notificacion enviada.`,
        )
      }
    }

    setIsSaving(false)
  }

  return (
    <section className="grid gap-6 bg-open-bg">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
            Coach
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-open-ink md:text-5xl">
            Evaluaciones Pro
          </h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-open-muted">
          Evalúa habilidades, actualiza el radar y premia progreso con XP.
        </p>
      </div>

      {toast ? (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-open-light bg-open-surface px-4 py-3 text-sm font-medium text-open-ink"
        >
          {toast}
        </motion.p>
      ) : null}

      {error ? (
        <p className="border border-open-light bg-open-surface px-4 py-3 text-sm text-open-muted">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {players.map((player) => (
          <article
            key={player.id}
            className="border border-open-light bg-open-surface p-5 transition hover:border-open-primary"
          >
            <button
              type="button"
              onClick={() => openEvaluation(player)}
              className="w-full text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center border border-open-light bg-open-bg">
                    <UserRound size={19} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-open-ink">
                      {player.full_name || 'Jugador OPEN'}
                    </h2>
                    <p className="mt-1 text-sm text-open-muted">
                      {player.email}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-open-muted">
                  LVL {player.level || 1}
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-open-light pt-4 text-sm">
                <span className="text-open-muted">XP actual</span>
                <span className="font-semibold text-open-ink">
                  {(player.xp || 0).toLocaleString()}
                </span>
              </div>
            </button>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
                Cat.{' '}
                {player.current_category ||
                  player.suggested_category ||
                  'pendiente'}
              </span>
              <Link
                to={`/players/${player.id}`}
                className="inline-flex h-9 items-center gap-2 border border-open-light bg-open-bg px-3 text-xs font-semibold text-open-ink transition hover:border-open-primary"
              >
                <Eye size={15} strokeWidth={1.8} />
                Ver perfil
              </Link>
            </div>
          </article>
        ))}
      </div>

      {!isLoading && players.length === 0 ? (
        <p className="border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
          Todavía no hay alumnos registrados.
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-open-muted">Cargando alumnos...</p>
      ) : null}

      <ClubPlayersManager mode="coach" />

      <TrainingSessionsView />

      <AnimatePresence>
        {selectedPlayer ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              className="max-h-[92vh] w-full max-w-4xl overflow-y-auto border border-open-light bg-open-surface p-5 shadow-2xl shadow-black/20 md:p-6"
              initial={{ y: 24, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 18, scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
                  Evaluación
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-open-ink">
                  {selectedPlayer.full_name || 'Jugador OPEN'}
                </h2>
                <p className="mt-2 text-sm text-open-muted">
                  Ajusta solo con evidencia. Al guardar, el jugador recibe XP y
                  una notificacion en su cuenta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlayer(null)}
                className="grid h-10 w-10 shrink-0 place-items-center border border-open-light bg-open-bg text-open-ink transition hover:border-open-primary"
                aria-label="Cerrar evaluación"
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <EvaluationGuide />

              <label className="grid gap-2 text-sm font-semibold text-open-ink">
                Motivo de evaluacion
                <select
                  value={evaluationReason}
                  onChange={(event) => setEvaluationReason(event.target.value)}
                  className="h-11 border border-open-light bg-open-bg px-3 text-sm text-open-ink outline-none focus:border-open-primary"
                >
                  {evaluationReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </label>

              {evaluationReason === 'Cambio de categoria' && (
                <label className="grid gap-2 text-sm font-semibold text-open-ink">
                  Nueva categoria
                  <select
                    value={promotedCategory}
                    onChange={(event) => setPromotedCategory(event.target.value)}
                    className="h-11 border border-open-light bg-open-bg px-3 text-sm text-open-ink outline-none focus:border-open-primary"
                  >
                    <option value="">Selecciona categoria...</option>
                    {['D', 'C', 'B', 'A', 'Pro'].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </label>
              )}

              <div className="grid gap-3 lg:grid-cols-2">
                {statFields.map((field) => (
                  <GuidedStatControl
                    key={field.key}
                    baseline={baselineStats[field.key]}
                    field={field}
                    value={stats[field.key]}
                    onAdjust={(amount) => adjustStat(field.key, amount)}
                    onChange={(value) => updateStat(field.key, value)}
                  />
                ))}
              </div>

              <label className="grid gap-2 text-sm font-semibold text-open-ink">
                Justificacion del coach
                <textarea
                  value={evaluationNotes}
                  onChange={(event) => setEvaluationNotes(event.target.value)}
                  rows={4}
                  placeholder="Ej. Subo derecha +2 porque sostuvo rallies de 12+ bolas, ataco paralelo con control y bajo errores no forzados en match play."
                  className="resize-none border border-open-light bg-open-bg px-3 py-3 text-sm text-open-ink outline-none focus:border-open-primary"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 bg-open-primary px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-open-muted"
            >
              <Save size={17} strokeWidth={1.8} />
              {isSaving ? 'Guardando...' : 'Guardar Evaluación'}
            </button>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}

function createDefaultStats() {
  return {
    stat_derecha: 50,
    stat_reves: 50,
    stat_saque: 50,
    stat_volea: 50,
    stat_movilidad: 50,
    stat_slice: 50,
  }
}

function EvaluationGuide() {
  return (
    <div className="grid gap-3 border border-open-light bg-open-bg p-4">
      <div className="flex items-start gap-3">
        <BookOpen size={18} strokeWidth={1.8} className="mt-0.5 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-open-ink">
            Guia de evaluacion
          </h3>
          <p className="mt-1 text-xs leading-5 text-open-muted">
            Evalua cada 4-6 semanas, despues de un bloque de entrenamientos o
            despues de partidos confirmados. No subas por una sola buena clase:
            busca evidencia repetida.
          </p>
        </div>
      </div>
      <div className="grid gap-2 text-xs text-open-muted">
        <p>
          <strong className="text-open-ink">+1/+2:</strong> mejora visible y
          repetida en entrenos o partido.
        </p>
        <p>
          <strong className="text-open-ink">+3/+4:</strong> mejora fuerte,
          sostenida y comprobable contra rivales de nivel parecido.
        </p>
        <p>
          <strong className="text-open-ink">+5:</strong> solo revision formal o
          cambio de categoria.
        </p>
      </div>
    </div>
  )
}

function GuidedStatControl({ baseline, field, value, onAdjust, onChange }) {
  const delta = value - baseline
  const guidance = getScoreGuidance(value)

  return (
    <article className="grid gap-3 border border-open-light bg-open-bg p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-open-ink">{field.label}</h3>
          <p className="mt-1 text-xs leading-5 text-open-muted">{field.cue}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-open-ink">{value}</p>
          <p
            className={[
              'text-xs font-semibold',
              delta > 0
                ? 'text-open-ink'
                : delta < 0
                  ? 'text-open-muted'
                  : 'text-open-muted',
            ].join(' ')}
          >
            {delta === 0 ? 'sin cambio' : `${delta > 0 ? '+' : ''}${delta}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {[-2, -1, 1, 2, 3, 5].map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => onAdjust(amount)}
            className="inline-flex h-9 items-center justify-center gap-1 border border-open-light bg-open-surface text-xs font-semibold text-open-ink"
          >
            {amount < 0 ? <Minus size={12} /> : <Plus size={12} />}
            {Math.abs(amount)}
          </button>
        ))}
      </div>

      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="open-slider"
      />

      <p className="border-t border-open-light pt-3 text-xs leading-5 text-open-muted">
        <strong className="text-open-ink">{guidance.label}:</strong>{' '}
        {guidance.description}
      </p>
    </article>
  )
}

function getScoreGuidance(score) {
  if (score < 40) {
    return {
      label: 'Base en formacion',
      description:
        'Necesita tecnica estable antes de premiar resultados aislados. Sube solo si repite el gesto en ejercicios controlados.',
    }
  }

  if (score < 60) {
    return {
      label: 'Consistencia inicial',
      description:
        'Puede sostener la habilidad, pero todavia falla bajo presion. +1/+2 si se mantiene en drills y puntos condicionados.',
    }
  }

  if (score < 80) {
    return {
      label: 'Competitivo',
      description:
        'La habilidad ya aparece en partido. Sube si resuelve puntos reales contra rivales de categoria similar.',
    }
  }

  return {
    label: 'Avanzado',
    description:
      'Cada punto pesa mucho. Sube solo con evidencia fuerte, volumen de partidos y revision tecnica clara.',
  }
}

function buildDeltas(stats, baselineStats) {
  return statFields.map((field) => ({
    key: field.key,
    label: field.label,
    from: baselineStats[field.key],
    to: stats[field.key],
    delta: stats[field.key] - baselineStats[field.key],
  }))
}

function clampScore(value) {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(Math.round(value), 0), 100)
}

async function notifyEvaluatedPlayer({
  player,
  baselineStats,
  deltas,
  evaluationReason,
  stats,
}) {
  if (!player?.user_id) return new Error('Player missing user_id')

  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) return new Error('No authenticated user')

  const changedStats = deltas
    .filter((item) => item.delta !== 0)
    .map((item) => `${item.label} ${item.delta > 0 ? '+' : ''}${item.delta}`)
    .join(', ')

  const { error } = await supabase.from('notifications').insert({
    user_id: player.user_id,
    actor_user_id: userData.user.id,
    player_id: String(player.id),
    club_id: player.club_id || null,
    type: 'coach_evaluation',
    title: 'Nueva evaluacion de coach',
    body: changedStats
      ? `Tu coach actualizo tus habilidades: ${changedStats}. +50 XP.`
      : 'Tu coach registro una evaluacion. +50 XP.',
    href: '/profile',
    metadata: {
      reason: evaluationReason,
      previous_stats: baselineStats,
      stats,
      deltas,
    },
  })

  return error
}

export default EvaluationsView
