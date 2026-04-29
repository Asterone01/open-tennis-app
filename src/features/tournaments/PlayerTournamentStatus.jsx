import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function PlayerTournamentStatus({ player }) {
  const [entries, setEntries] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadTournaments = async () => {
      if (!player?.id) {
        setEntries([])
        setTournaments([])
        return
      }

      setIsLoading(true)

      const { data: entryRows } = await supabase
        .from('tournament_entries')
        .select('*')
        .eq('player_id', String(player.id))
        .order('registered_at', { ascending: false })

      if (!isMounted) return

      const rows = entryRows || []
      setEntries(rows)

      if (rows.length === 0) {
        setTournaments([])
        setIsLoading(false)
        return
      }

      const { data: tournamentRows } = await supabase
        .from('tournaments')
        .select('*')
        .in(
          'id',
          rows.map((entry) => entry.tournament_id),
        )

      if (isMounted) {
        setTournaments(tournamentRows || [])
        setIsLoading(false)
      }
    }

    loadTournaments()

    return () => {
      isMounted = false
    }
  }, [player?.id])

  const activeEntry = useMemo(() => {
    const activeStatuses = new Set(['planning', 'open', 'in_progress'])

    return entries.find((entry) => {
      const tournament = tournaments.find(
        (item) => item.id === entry.tournament_id,
      )

      return tournament && activeStatuses.has(tournament.status)
    })
  }, [entries, tournaments])

  const activeTournament = activeEntry
    ? tournaments.find((tournament) => tournament.id === activeEntry.tournament_id)
    : null

  return (
    <section className="grid gap-4 border border-open-light bg-open-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-open-muted">
            Torneo activo
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-open-ink">
            {activeTournament?.title || 'Sin torneo activo'}
          </h2>
        </div>
        <div className="grid h-11 w-11 place-items-center border border-open-light bg-open-bg">
          <Trophy size={20} strokeWidth={1.8} />
        </div>
      </div>

      {activeTournament ? (
        <div className="grid gap-3 border-t border-open-light pt-4 text-sm">
          <StatusRow label="Estado" value={formatStatus(activeTournament.status)} />
          <StatusRow label="Mi seed" value={activeEntry.seed || '--'} />
          <StatusRow label="Posicion" value={activeEntry.final_position || 'En juego'} />
          <StatusRow label="XP torneo" value={activeEntry.xp_awarded || 0} />
        </div>
      ) : (
        <p className="border-t border-open-light pt-4 text-sm text-open-muted">
          {isLoading
            ? 'Cargando torneos...'
            : 'Cuando te inscribas, aqui veras estatus, bracket, puntajes y posiciones.'}
        </p>
      )}

      <Link
        to="/tournaments"
        className="inline-flex h-11 items-center justify-center border border-open-light bg-open-bg px-4 text-sm font-semibold text-open-ink transition hover:border-open-primary"
      >
        Ver torneos y bracket
      </Link>
    </section>
  )
}

function StatusRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-open-muted">{label}</span>
      <span className="font-semibold text-open-ink">{value}</span>
    </div>
  )
}

function formatStatus(value) {
  const labels = {
    planning: 'Planeacion',
    open: 'Inscripciones abiertas',
    in_progress: 'En curso',
    finished: 'Finalizado',
    cancelled: 'Cancelado',
    archived: 'Archivado',
  }

  return labels[value] || value
}

export default PlayerTournamentStatus
