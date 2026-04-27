import { useState } from 'react'
import { Award, ShieldCheck, Star, Target } from 'lucide-react'
import { applyTheme } from '../../hooks/useTheme'
import { supabase } from '../../lib/supabase'
import JoinClubModal from './JoinClubModal'
import PlayerCard from './PlayerCard'
import usePlayerProfile from './usePlayerProfile'

const badges = [
  { label: 'Primer torneo', detail: 'Participacion registrada', icon: Award },
  { label: 'Mentalidad', detail: '7 dias activos', icon: ShieldCheck },
  { label: 'Precision', detail: '85% en retos', icon: Target },
  { label: 'Ascenso', detail: 'Nivel 12 alcanzado', icon: Star },
]

function ProfileView() {
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const { player, profile, isLoading, error, reloadProfile } = usePlayerProfile()

  const handleJoined = async (club) => {
    await reloadProfile()

    const { data } = await supabase
      .from('clubs')
      .select('primary_color, logo_url, name')
      .eq('id', club.id)
      .maybeSingle()

    applyTheme({
      primaryColor: data?.primary_color,
      logoUrl: data?.logo_url,
      clubName: data?.name,
    })
  }

  return (
    <section className="mx-auto grid w-full max-w-5xl gap-6">
      <JoinClubModal
        isOpen={isJoinOpen}
        player={player}
        onClose={() => setIsJoinOpen(false)}
        onJoined={handleJoined}
      />

      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
            Perfil
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-open-ink md:text-5xl">
            Player Card
          </h1>
        </div>
        <p className="max-w-sm text-sm leading-6 text-open-muted">
          Identidad competitiva, habilidades y progreso de jugador.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,560px)_1fr] lg:items-start">
        <div className="grid gap-3">
          {error ? (
            <p className="border border-open-light bg-open-surface px-4 py-3 text-sm text-open-muted">
              {error}
            </p>
          ) : null}
          <PlayerCard profile={profile} />
          {isLoading ? (
            <p className="text-sm text-open-muted">Cargando perfil...</p>
          ) : null}
          {!profile.clubId ? (
            <button
              type="button"
              onClick={() => setIsJoinOpen(true)}
              className="h-12 border border-open-light bg-open-surface px-5 text-sm font-semibold text-open-ink transition hover:border-open-primary"
            >
              Unirme a un club
            </button>
          ) : null}
        </div>

        <section className="grid gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
            Logros recientes
          </h2>
          {badges.map((badge) => {
            const Icon = badge.icon

            return (
              <article
                key={badge.label}
                className="flex items-center gap-4 border border-open-light bg-open-surface p-4"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center border border-open-light bg-open-bg">
                  <Icon size={19} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-open-ink">
                    {badge.label}
                  </h3>
                  <p className="mt-1 text-sm text-open-muted">{badge.detail}</p>
                </div>
              </article>
            )
          })}
        </section>
      </div>
    </section>
  )
}

export default ProfileView
