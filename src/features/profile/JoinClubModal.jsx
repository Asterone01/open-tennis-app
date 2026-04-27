import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

function JoinClubModal({ isOpen, player, onClose, onJoined }) {
  const [clubs, setClubs] = useState([])
  const [query, setQuery] = useState('')
  const [selectedClub, setSelectedClub] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return

    const loadClubs = async () => {
      setIsLoading(true)
      setError('')

      const { data, error: clubsError } = await supabase
        .from('clubs')
        .select('id, name, logo_url')
        .order('name', { ascending: true })

      if (clubsError) {
        setError(clubsError.message)
      } else {
        setClubs(data || [])
      }

      setIsLoading(false)
    }

    loadClubs()
  }, [isOpen])

  const filteredClubs = useMemo(() => {
    const search = query.trim().toLowerCase()

    if (!search) {
      return clubs
    }

    return clubs.filter((club) => club.name.toLowerCase().includes(search))
  }, [clubs, query])

  const handleJoin = async () => {
    if (!selectedClub) return

    setIsSaving(true)
    setError('')

    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      setError(userError?.message || 'No se pudo validar tu sesion.')
      setIsSaving(false)
      return
    }

    const user = userData.user
    const userRole = user.user_metadata?.role || player?.role || 'player'
    const payload = {
      user_id: user.id,
      email: player?.email || user.email,
      full_name:
        player?.full_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.nombre ||
        user.email,
      role: userRole,
      is_coach: Boolean(player?.is_coach || userRole === 'coach'),
      club_id: selectedClub.id,
    }

    const query = player?.id
      ? supabase
          .from('players')
          .update({ club_id: selectedClub.id })
          .eq('id', player.id)
          .select()
          .maybeSingle()
      : supabase
          .from('players')
          .upsert(
            {
              ...payload,
              id: window.crypto?.randomUUID?.(),
            },
            { onConflict: 'user_id' },
          )
          .select()
          .maybeSingle()

    const { data, error: updateError } = await query

    if (!updateError && player?.id && !data) {
      const { error: insertError } = await supabase
        .from('players')
        .upsert(
          {
            ...payload,
            id: window.crypto?.randomUUID?.(),
          },
          { onConflict: 'user_id' },
        )
        .select()
        .maybeSingle()

      if (insertError) {
        setError(insertError.message)
        setIsSaving(false)
        return
      }
    }

    if (updateError) {
      setError(updateError.message)
    } else {
      onJoined?.(selectedClub)
      onClose()
    }

    setIsSaving(false)
  }

  const canJoin = Boolean(selectedClub) && !isSaving

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-5 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.section
            className="w-full max-w-xl border border-open-light bg-open-surface p-5 shadow-2xl shadow-black/15"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.26, ease: 'easeOut' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
                  Club
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-open-ink">
                  Unirse a un club
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-10 w-10 place-items-center border border-open-light bg-open-bg text-open-ink transition hover:border-open-primary"
                aria-label="Cerrar"
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            <div className="mt-5 flex h-12 items-center gap-3 border border-open-light bg-open-bg px-4">
              <Search size={18} strokeWidth={1.8} className="text-open-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-base text-open-ink outline-none"
                placeholder="Buscar mi club..."
              />
            </div>

            {error ? (
              <p className="mt-4 border border-open-light bg-open-bg px-4 py-3 text-sm text-open-muted">
                {error}
              </p>
            ) : null}

            <div className="mt-5 grid max-h-80 gap-2 overflow-auto">
              {filteredClubs.map((club) => (
                <button
                  key={club.id}
                  type="button"
                  onClick={() => setSelectedClub(club)}
                  className={[
                    'flex items-center gap-3 border p-3 text-left transition',
                    selectedClub?.id === club.id
                      ? 'border-open-primary bg-open-primary text-white'
                      : 'border-open-light bg-open-surface text-open-ink hover:border-open-primary hover:bg-open-primary hover:text-white',
                  ].join(' ')}
                >
                  {club.logo_url ? (
                    <img
                      src={club.logo_url}
                      alt=""
                      className="h-10 w-10 object-contain"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-current opacity-80" />
                  )}
                  <span className="text-sm font-semibold">{club.name}</span>
                </button>
              ))}
            </div>

            {isLoading ? (
              <p className="mt-4 text-sm text-open-muted">Cargando clubes...</p>
            ) : null}

            <button
              type="button"
              onClick={handleJoin}
              disabled={!canJoin}
              className="mt-5 h-12 w-full bg-open-primary px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-open-muted"
            >
              {isSaving ? 'Vinculando...' : 'Vincular'}
            </button>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default JoinClubModal
