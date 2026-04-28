import { useEffect, useState } from 'react'
import { Zap } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function XPHistoryPanel({ player, limit = 5 }) {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadHistory = async () => {
      if (!player?.id) {
        setItems([])
        return
      }

      setIsLoading(true)
      setError('')

      const { data, error: historyError } = await supabase
        .from('xp_history')
        .select('id, amount, source, label, description, created_at')
        .eq('player_id', String(player.id))
        .order('created_at', { ascending: false })
        .limit(limit)

      if (!isMounted) return

      if (historyError) {
        setItems([])
        setError(historyError.message)
      } else {
        setItems(data || [])
      }

      setIsLoading(false)
    }

    loadHistory()

    return () => {
      isMounted = false
    }
  }, [limit, player?.id])

  return (
    <section className="border border-open-light bg-open-surface p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-open-muted">XP History</p>
          <h2 className="mt-2 text-2xl font-semibold text-open-ink">
            Ultimos movimientos
          </h2>
        </div>
        <div className="grid h-11 w-11 place-items-center border border-open-light bg-open-bg">
          <Zap size={20} strokeWidth={1.8} />
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="flex items-center justify-between gap-4 border border-open-light bg-open-bg p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-open-ink">
                {item.label || sourceLabel(item.source)}
              </p>
              <p className="mt-1 text-xs text-open-muted">
                {formatDate(item.created_at)}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-open-ink">
              +{Number(item.amount || 0).toLocaleString()} XP
            </span>
          </article>
        ))}

        {!isLoading && items.length === 0 ? (
          <p className="border border-open-light bg-open-bg px-4 py-5 text-sm text-open-muted">
            {error
              ? 'Corre el SQL de gamificacion para activar el historial.'
              : 'Todavia no hay movimientos de XP.'}
          </p>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-open-muted">Cargando historial...</p>
        ) : null}
      </div>
    </section>
  )
}

function sourceLabel(source) {
  const labels = {
    coach_evaluation: 'Evaluacion de coach',
    training_attendance: 'Entrenamiento',
    match_played: 'Partido amistoso',
    tournament: 'Torneo',
    achievement: 'Logro',
  }

  return labels[source] || 'Movimiento XP'
}

function formatDate(value) {
  if (!value) return 'Fecha pendiente'

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export default XPHistoryPanel
