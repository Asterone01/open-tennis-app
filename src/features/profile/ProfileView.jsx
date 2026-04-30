import { useEffect, useMemo, useRef, useState } from 'react'
import { Palette, RotateCcw, Save } from 'lucide-react'
import { applyTheme } from '../../hooks/useTheme'
import { supabase } from '../../lib/supabase'
import { getPlayerAchievements } from '../gamification/achievementsLedger'
import JoinClubModal from './JoinClubModal'
import MembershipCard from './MembershipCard'
import PlayerCard from './PlayerCard'
import PlayerProfileDetails from './PlayerProfileDetails'
import usePlayerProfile from './usePlayerProfile'
import PlayerTournamentStatus from '../tournaments/PlayerTournamentStatus'
import PlayerStatsSection from './PlayerStatsSection'
import CoachStatsSection from './CoachStatsSection'
import MembershipsView from '../admin/MembershipsView'

function ProfileView() {
  const avatarInputRef = useRef(null)
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('perfil')
  const [club, setClub] = useState(null)
  const [recentMatches, setRecentMatches] = useState([])
  const [streakRows, setStreakRows] = useState([])
  const [achievementRows, setAchievementRows] = useState([])
  const [trophyRows, setTrophyRows] = useState([])
  const [cardColor, setCardColor] = useState('')
  const [isSavingColor, setIsSavingColor] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [colorMessage, setColorMessage] = useState('')
  const {
    player,
    profile,
    user,
    isLoading,
    error,
    reloadProfile,
  } = usePlayerProfile()

  useEffect(() => {
    let isMounted = true

    const loadClub = async () => {
      if (!profile.clubId) {
        setClub(null)
        return
      }

      const { data } = await supabase
        .from('clubs')
        .select('id, name, primary_color, logo_url')
        .eq('id', profile.clubId)
        .maybeSingle()

      if (isMounted) {
        setClub(data || null)
      }
    }

    loadClub()

    return () => {
      isMounted = false
    }
  }, [profile.clubId])

  useEffect(() => {
    let isMounted = true

    const loadMatches = async () => {
      if (!player?.id) {
        setRecentMatches([])
        return
      }

      const { data } = await supabase
        .from('friendly_matches')
        .select('*')
        .or(
          `created_by_player_id.eq.${player.id},opponent_player_id.eq.${player.id}`,
        )
        .order('match_date', { ascending: false })
        .limit(5)

      if (isMounted) {
        setRecentMatches(data || [])
      }
    }

    loadMatches()

    return () => {
      isMounted = false
    }
  }, [player?.id])

  useEffect(() => {
    let isMounted = true

    const loadStreaks = async () => {
      if (!player?.id) {
        setStreakRows([])
        return
      }

      const { data } = await supabase
        .from('streaks')
        .select('streak_type, current_count, max_record, status')
        .eq('player_id', String(player.id))

      if (isMounted) {
        setStreakRows(data || [])
      }
    }

    loadStreaks()

    return () => {
      isMounted = false
    }
  }, [player?.id])

  useEffect(() => {
    let isMounted = true

    const loadAchievements = async () => {
      if (!player?.id) {
        setAchievementRows([])
        return
      }

      const [rows, trophiesRes] = await Promise.all([
        getPlayerAchievements(player.id),
        supabase
          .from('tournament_trophies')
          .select('*')
          .eq('player_id', String(player.id))
          .order('won_at', { ascending: false }),
      ])

      if (isMounted) {
        setAchievementRows(rows)
        setTrophyRows(trophiesRes.data || [])
      }
    }

    loadAchievements()

    return () => {
      isMounted = false
    }
  }, [player?.id])

  const resolvedCardColor =
    cardColor ||
    profile.playerCardColor ||
    (profile.clubMembershipStatus === 'approved' ? club?.primary_color : '') ||
    '#0D0D0F'

  const profileWithClub = useMemo(
    () => ({
      ...profile,
      clubName: club?.name || '',
      clubPrimaryColor: club?.primary_color || '',
      playerCardColor: cardColor || profile.playerCardColor,
      recentMatches,
      streakRows,
      achievementRows,
      trophyRows,
    }),
    [cardColor, club?.name, club?.primary_color, profile, recentMatches, streakRows, achievementRows, trophyRows],
  )

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

  const handleSaveCardColor = async () => {
    if (!player?.id) return

    setIsSavingColor(true)
    setColorMessage('')

    const { error: colorError } = await supabase
      .from('players')
      .update({ player_card_color: resolvedCardColor })
      .eq('id', player.id)

    if (colorError) {
      setColorMessage(colorError.message)
    } else {
      setColorMessage('Color guardado.')
      await reloadProfile()
    }

    setIsSavingColor(false)
  }

  const handleResetCardColor = async () => {
    if (!player?.id) return

    setIsSavingColor(true)
    setColorMessage('')

    const { error: colorError } = await supabase
      .from('players')
      .update({ player_card_color: null })
      .eq('id', player.id)

    if (colorError) {
      setColorMessage(colorError.message)
    } else {
      setColorMessage('Color restablecido.')
      setCardColor('')
      await reloadProfile()
    }

    setIsSavingColor(false)
  }

  const handleAvatarFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file || !user?.id) return

    if (!file.type.startsWith('image/')) {
      setColorMessage('Selecciona un archivo de imagen.')
      return
    }

    setIsUploadingAvatar(true)
    setColorMessage('')

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${user.id}/avatar-${Date.now()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('profile-avatars')
      .upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      setColorMessage(uploadError.message)
      setIsUploadingAvatar(false)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from('profile-avatars')
      .getPublicUrl(path)

    const avatarUrl = publicUrlData.publicUrl

    if (player?.id) {
      const { error: avatarError } = await supabase
        .from('players')
        .update({ avatar_url: avatarUrl })
        .eq('id', player.id)

      if (avatarError) {
        setColorMessage(avatarError.message)
        setIsUploadingAvatar(false)
        return
      }
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: { avatar_url: avatarUrl },
    })

    if (metadataError) {
      setColorMessage(metadataError.message)
    } else {
      setColorMessage('Foto de perfil actualizada.')
      await reloadProfile()
    }

    setIsUploadingAvatar(false)
  }

  return (
    <section className="mx-auto grid w-full max-w-5xl gap-6">
      <JoinClubModal
        isOpen={isJoinOpen}
        player={player}
        onClose={() => setIsJoinOpen(false)}
        onJoined={handleJoined}
      />
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFile}
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

      <div className="grid gap-3">
        {error ? (
          <p className="border border-open-light bg-open-surface px-4 py-3 text-sm text-open-muted">
            {error}
          </p>
        ) : null}
        <PlayerCard
          profile={profileWithClub}
          canEditAvatar
          isAvatarUploading={isUploadingAvatar}
          onAvatarClick={() => avatarInputRef.current?.click()}
        />
        {isLoading ? (
          <p className="text-sm text-open-muted">Cargando perfil...</p>
        ) : null}
        {profile.clubMembershipStatus === 'pending' ? (
          <p className="border border-open-light bg-open-surface px-4 py-3 text-sm text-open-muted">
            Tu solicitud para pertenecer a {club?.name || 'este club'} esta
            pendiente de aprobacion.
          </p>
        ) : null}
        {profile.clubMembershipStatus === 'approved' && club?.name ? (
          <p className="border border-open-light bg-open-surface px-4 py-3 text-sm text-open-muted">
            Perteneces a <strong className="text-open-ink">{club.name}</strong>.
          </p>
        ) : null}
        {profile.clubMembershipStatus === 'rejected' ? (
          <p className="border border-open-light bg-open-surface px-4 py-3 text-sm text-open-muted">
            Tu solicitud fue rechazada. Puedes elegir otro club.
          </p>
        ) : null}
        {!profile.clubId || profile.clubMembershipStatus === 'rejected' ? (
          <button
            type="button"
            onClick={() => setIsJoinOpen(true)}
            className="h-12 border border-open-light bg-open-surface px-5 text-sm font-semibold text-open-ink transition hover:border-open-primary"
          >
            Unirme a un club
          </button>
        ) : null}
      </div>

      <section className="grid gap-4 border border-open-light bg-open-surface p-5 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-sm font-semibold text-open-muted">
            Color de Player Card
          </p>
          <div className="mt-3 flex h-12 max-w-md items-center gap-3 border border-open-light bg-open-bg px-4">
            <Palette size={18} strokeWidth={1.8} className="text-open-muted" />
            <input
              type="color"
              value={resolvedCardColor}
              onChange={(event) => setCardColor(event.target.value)}
              className="h-8 w-12 cursor-pointer border-0 bg-transparent p-0"
              aria-label="Color de Player Card"
            />
            <input
              type="text"
              value={resolvedCardColor}
              onChange={(event) => setCardColor(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold uppercase text-open-ink outline-none"
            />
          </div>
          {colorMessage ? (
            <p className="mt-2 text-sm text-open-muted">{colorMessage}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleResetCardColor}
            disabled={isSavingColor || !player?.id}
            className="inline-flex h-11 items-center gap-2 border border-open-light bg-open-surface px-4 text-sm font-semibold text-open-ink transition hover:border-open-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={16} strokeWidth={1.8} />
            Usar default
          </button>
          <button
            type="button"
            onClick={handleSaveCardColor}
            disabled={isSavingColor || !player?.id}
            className="inline-flex h-11 items-center gap-2 bg-open-primary px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-open-muted"
          >
            <Save size={16} strokeWidth={1.8} />
            {isSavingColor ? 'Guardando...' : 'Guardar color'}
          </button>
        </div>
      </section>

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-open-light pb-0">
        {(profile.role === 'manager'
          ? [{ id: 'perfil', label: 'Perfil' }, { id: 'membresias', label: 'Membresías' }]
          : [
              { id: 'perfil', label: 'Perfil' },
              { id: 'stats', label: 'Estadísticas' },
              ...(profile.isCoach ? [{ id: 'coach', label: 'Coach' }] : []),
            ]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              'h-10 border-b-2 px-4 text-sm font-semibold transition',
              activeTab === tab.id
                ? 'border-open-ink text-open-ink'
                : 'border-transparent text-open-muted hover:text-open-ink',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'perfil' && (
        <>
          {profile.clubId ? (
            <MembershipCard club={club} profile={profileWithClub} />
          ) : null}
          {profile.role !== 'manager' && <PlayerTournamentStatus player={player} />}
          <PlayerProfileDetails profile={profileWithClub} />
        </>
      )}

      {activeTab === 'stats' && profile.role !== 'manager' && (
        <PlayerStatsSection player={player} />
      )}

      {activeTab === 'coach' && profile.isCoach && (
        <CoachStatsSection coachUserId={user?.id} />
      )}

      {activeTab === 'membresias' && profile.role === 'manager' && (
        <MembershipsView embedded />
      )}
    </section>
  )
}

export default ProfileView
