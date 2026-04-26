import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Save, UserRound, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const statFields = [
  { key: 'stat_ataque', label: 'Ataque' },
  { key: 'stat_defensa', label: 'Defensa' },
  { key: 'stat_saque', label: 'Saque' },
  { key: 'stat_fisico', label: 'Físico' },
  { key: 'stat_mentalidad', label: 'Mentalidad' },
]

function EvaluationsView() {
  const [players, setPlayers] = useState([])
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [stats, setStats] = useState(createDefaultStats())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadPlayers = async () => {
      setIsLoading(true)
      setError('')

      const { data, error: playersError } = await supabase
        .from('players')
        .select(
          'id, full_name, email, xp, level, stat_ataque, stat_defensa, stat_saque, stat_fisico, stat_mentalidad',
        )
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
    setSelectedPlayer(player)
    setStats({
      stat_ataque: player.stat_ataque ?? 50,
      stat_defensa: player.stat_defensa ?? 50,
      stat_saque: player.stat_saque ?? 50,
      stat_fisico: player.stat_fisico ?? 50,
      stat_mentalidad: player.stat_mentalidad ?? 50,
    })
    setToast('')
    setError('')
  }

  const updateStat = (key, value) => {
    setStats((current) => ({ ...current, [key]: Number(value) }))
  }

  const handleSave = async () => {
    if (!selectedPlayer) return

    setIsSaving(true)
    setError('')
    setToast('')

    const nextXp = (selectedPlayer.xp || 0) + 50
    const { data, error: saveError } = await supabase
      .from('players')
      .update({
        ...stats,
        xp: nextXp,
      })
      .eq('id', selectedPlayer.id)
      .select()
      .single()

    if (saveError) {
      setError(saveError.message)
    } else {
      setPlayers((current) =>
        current.map((player) => (player.id === data.id ? data : player)),
      )
      setSelectedPlayer(data)
      setToast(`Evaluación guardada. +50 XP otorgados a ${data.full_name}.`)
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
          <button
            key={player.id}
            type="button"
            onClick={() => openEvaluation(player)}
            className="border border-open-light bg-open-surface p-5 text-left transition hover:border-open-primary"
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
                  <p className="mt-1 text-sm text-open-muted">{player.email}</p>
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

      <AnimatePresence>
        {selectedPlayer ? (
          <motion.aside
            className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-open-light bg-open-surface p-6 shadow-2xl shadow-black/10"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
                  Evaluación
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-open-ink">
                  {selectedPlayer.full_name || 'Jugador OPEN'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlayer(null)}
                className="grid h-10 w-10 place-items-center border border-open-light bg-open-bg text-open-ink transition hover:border-open-primary"
                aria-label="Cerrar evaluación"
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            <div className="mt-8 grid gap-6">
              {statFields.map((field) => (
                <label
                  key={field.key}
                  className="grid gap-3 text-sm font-semibold text-open-ink"
                >
                  <span className="flex items-center justify-between">
                    {field.label}
                    <span className="text-open-muted">{stats[field.key]}</span>
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={stats[field.key]}
                    onChange={(event) =>
                      updateStat(field.key, event.target.value)
                    }
                    className="open-slider"
                  />
                </label>
              ))}
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
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </section>
  )
}

function createDefaultStats() {
  return {
    stat_ataque: 50,
    stat_defensa: 50,
    stat_saque: 50,
    stat_fisico: 50,
    stat_mentalidad: 50,
  }
}

export default EvaluationsView
