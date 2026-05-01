import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Palette, RotateCcw, Save, ShieldCheck, Trophy, UserRound, Users } from 'lucide-react'
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
  const [openSections, setOpenSections] = useState({
    identity: true,
    progress: false,
    coach: false,
    club: false,
  })
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

  const toggleSection = (sectionId) => {
    setOpenSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }))
  }

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-6">
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

      <ProfileHero profile={profileWithClub} club={club} />

      <ProfileSection
        id="identity"
        title="Identidad"
        detail="Card, foto, color, club y datos visibles del perfil."
        icon={UserRound}
        open={openSections.identity}
        onToggle={toggleSection}
      >
        <div className="grid gap-4">
          {error ? (
            <p className="rounded-[1.35rem] border border-open-light bg-open-surface px-4 py-3 text-sm text-open-muted">
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
          <ProfileStatusMessages
            profile={profile}
            club={club}
            onJoin={() => setIsJoinOpen(true)}
          />
          {profile.clubId ? (
            <MembershipCard club={club} profile={profileWithClub} />
          ) : null}
          <CardColorEditor
            resolvedCardColor={resolvedCardColor}
            colorMessage={colorMessage}
            isSavingColor={isSavingColor}
            playerId={player?.id}
            onColorChange={setCardColor}
            onReset={handleResetCardColor}
            onSave={handleSaveCardColor}
          />
          <PlayerProfileDetails profile={profileWithClub} />
        </div>
      </ProfileSection>

      {profile.role !== 'manager' ? (
        <ProfileSection
          id="progress"
          title="Progreso"
          detail="Estadisticas, torneos, logros, rachas y evolucion deportiva."
          icon={Trophy}
          open={openSections.progress}
          onToggle={toggleSection}
        >
          <div className="grid gap-4">
            <PlayerTournamentStatus player={player} />
            <PlayerStatsSection player={player} />
          </div>
        </ProfileSection>
      ) : null}

      {profile.isCoach ? (
        <ProfileSection
          id="coach"
          title="Coach"
          detail="Sesiones, asistencia, XP otorgado y actividad como coach."
          icon={ShieldCheck}
          open={openSections.coach}
          onToggle={toggleSection}
        >
          <CoachStatsSection coachUserId={user?.id} />
        </ProfileSection>
      ) : null}

      <ProfileSection
        id="club"
        title={profile.role === 'manager' ? 'Club y membresias' : 'Club'}
        detail="Estado de membresia, vinculacion y administracion del club."
        icon={Users}
        open={openSections.club}
        onToggle={toggleSection}
      >
        <div className="grid gap-4">
          {profile.role !== 'manager' ? (
            <ClubMembershipPanel
              profile={profileWithClub}
              club={club}
              onJoin={() => setIsJoinOpen(true)}
            />
          ) : null}
          {profile.role === 'manager' ? <MembershipsView embedded /> : null}
        </div>
      </ProfileSection>
    </section>
  )
}

function ProfileSection({ id, title, detail, icon: Icon, open, onToggle, children }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-open-light bg-open-surface sm:rounded-[2.35rem]">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className={[
          'grid w-full gap-4 p-4 text-left transition sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-5',
          open ? 'bg-open-ink text-white' : 'bg-open-surface text-open-ink hover:bg-open-bg',
        ].join(' ')}
      >
        <span
          className={[
            'grid h-14 w-14 place-items-center rounded-[1.25rem]',
            open ? 'bg-white text-open-ink' : 'bg-open-bg text-open-ink',
          ].join(' ')}
        >
          <Icon size={22} strokeWidth={2} />
        </span>
        <span className="min-w-0">
          <span className="block text-xl font-black leading-tight sm:text-2xl">
            {title}
          </span>
          <span
            className={[
              'mt-1 block text-sm font-semibold leading-5',
              open ? 'text-white/64' : 'text-open-muted',
            ].join(' ')}
          >
            {detail}
          </span>
        </span>
        <ChevronRight
          size={22}
          strokeWidth={2.1}
          className={[
            'justify-self-end transition',
            open ? 'rotate-90 text-white/72' : 'text-open-muted',
          ].join(' ')}
        />
      </button>
      {open ? <div className="grid gap-4 p-4 sm:p-5">{children}</div> : null}
    </section>
  )
}

function ProfileStatusMessages({ profile, club, onJoin }) {
  return (
    <div className="grid gap-3">
      {profile.clubMembershipStatus === 'pending' ? (
        <p className="rounded-[1.35rem] border border-open-light bg-open-bg px-4 py-3 text-sm text-open-muted">
          Tu solicitud para pertenecer a {club?.name || 'este club'} esta
          pendiente de aprobacion.
        </p>
      ) : null}
      {profile.clubMembershipStatus === 'approved' && club?.name ? (
        <p className="rounded-[1.35rem] border border-open-light bg-open-bg px-4 py-3 text-sm text-open-muted">
          Perteneces a <strong className="text-open-ink">{club.name}</strong>.
        </p>
      ) : null}
      {profile.clubMembershipStatus === 'rejected' ? (
        <p className="rounded-[1.35rem] border border-open-light bg-open-bg px-4 py-3 text-sm text-open-muted">
          Tu solicitud fue rechazada. Puedes elegir otro club.
        </p>
      ) : null}
      {!profile.clubId || profile.clubMembershipStatus === 'rejected' ? (
        <button
          type="button"
          onClick={onJoin}
          className="h-12 rounded-[1.25rem] border border-open-light bg-open-bg px-5 text-sm font-semibold text-open-ink transition hover:border-open-primary"
        >
          Unirme a un club
        </button>
      ) : null}
    </div>
  )
}

function ClubMembershipPanel({ profile, club, onJoin }) {
  const status = profile.clubMembershipStatus || 'unassigned'
  const paymentStatus = profile.membershipPaymentStatus || 'unknown'
  const roleLabel = profile.role === 'manager' ? 'Admin' : profile.isCoach ? 'Coach' : 'Player'
  const planLabel = formatMembershipPlan(profile.membershipPlan)
  const statusLabel = formatClubStatus(status)
  const paymentLabel = formatPaymentStatus(paymentStatus)
  const canJoin = !profile.clubId || status === 'rejected' || status === 'unassigned'
  const hasApprovedAccess = status === 'approved'

  return (
    <div className="grid gap-4">
      <section className="grid gap-4 rounded-[1.75rem] border border-open-light bg-open-bg p-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.4fr)]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-open-muted">
            Tu membresia
          </p>
          <h3 className="mt-3 text-2xl font-black text-open-ink">
            {club?.name || profile.clubName || 'Sin club vinculado'}
          </h3>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-open-muted">
            {hasApprovedAccess
              ? `Tu acceso como ${roleLabel} esta activo dentro del club.`
              : status === 'pending'
              ? 'Tu solicitud esta pendiente de aprobacion por el manager.'
              : status === 'rejected'
              ? 'Tu solicitud fue rechazada. Puedes elegir otro club.'
              : 'Todavia no tienes un club vinculado a este perfil.'}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <MembershipPill label="Rol" value={roleLabel} />
          <MembershipPill label="Estatus" value={statusLabel} tone={status === 'approved' ? 'positive' : status === 'rejected' ? 'danger' : 'neutral'} />
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MembershipInfoCard label="Plan" value={planLabel} />
        <MembershipInfoCard label="Pago" value={paymentLabel} tone={paymentStatus === 'paid' || paymentStatus === 'waived' ? 'positive' : paymentStatus === 'overdue' ? 'danger' : undefined} />
        <MembershipInfoCard label="Proximo pago" value={formatProfileDate(profile.membershipNextPaymentDate)} />
        <MembershipInfoCard label="Ultimo pago" value={formatProfileDate(profile.membershipLastPaymentDate)} />
      </div>

      <div className="grid gap-3 rounded-[1.5rem] border border-open-light bg-open-surface p-4 sm:grid-cols-2 lg:grid-cols-3">
        <MembershipInfoCard label="ID membresia" value={profile.membershipId || 'Pendiente'} compact />
        <MembershipInfoCard label="Miembro desde" value={formatProfileDate(profile.membershipSince)} compact />
        <MembershipInfoCard label="Categoria" value={profile.currentCategory || profile.suggestedCategory || 'Sin categoria'} compact />
      </div>

      {profile.membershipNotes ? (
        <p className="rounded-[1.35rem] border border-open-light bg-open-bg px-4 py-3 text-sm text-open-muted">
          <strong className="text-open-ink">Notas del manager:</strong> {profile.membershipNotes}
        </p>
      ) : null}

      {canJoin ? (
        <button
          type="button"
          onClick={onJoin}
          className="min-h-12 rounded-[1.2rem] bg-open-ink px-5 text-sm font-black text-white transition hover:opacity-90 sm:justify-self-start"
        >
          Solicitar o cambiar club
        </button>
      ) : null}
    </div>
  )
}

function MembershipPill({ label, value, tone = 'neutral' }) {
  const toneClass =
    tone === 'positive'
      ? 'border-open-primary text-open-primary'
      : tone === 'danger'
      ? 'border-red-400 text-red-500'
      : 'border-open-light text-open-muted'

  return (
    <div className={`rounded-[1.25rem] border bg-open-surface p-4 ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">
        {label}
      </p>
      <p className="mt-2 text-xl font-black text-open-ink">{value}</p>
    </div>
  )
}

function MembershipInfoCard({ label, value, tone, compact = false }) {
  const valueClass =
    tone === 'positive'
      ? 'text-open-primary'
      : tone === 'danger'
      ? 'text-red-500'
      : 'text-open-ink'

  return (
    <article className={`rounded-[1.35rem] border border-open-light bg-open-surface p-4 ${compact ? 'min-h-24' : 'min-h-32'}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-open-muted">
        {label}
      </p>
      <p className={`mt-3 break-words text-lg font-black leading-tight ${valueClass}`}>
        {value || 'Pendiente'}
      </p>
    </article>
  )
}

function formatClubStatus(value) {
  return {
    approved: 'Aprobada',
    pending: 'Por aprobar',
    rejected: 'Rechazada',
    unassigned: 'Sin club',
  }[value] || 'Sin club'
}

function formatPaymentStatus(value) {
  return {
    paid: 'Pagado',
    waived: 'Exento',
    overdue: 'Vencido',
    pending: 'Pendiente',
    unknown: 'Pendiente',
  }[value] || 'Pendiente'
}

function formatMembershipPlan(value) {
  return {
    standard: 'Estandar',
    premium: 'Premium',
    student: 'Estudiante',
    courtesy: 'Cortesia',
  }[value] || 'Estandar'
}

function formatProfileDate(value) {
  if (!value) return 'Pendiente'
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function CardColorEditor({
  resolvedCardColor,
  colorMessage,
  isSavingColor,
  playerId,
  onColorChange,
  onReset,
  onSave,
}) {
  return (
    <section className="grid gap-4 rounded-[1.6rem] border border-open-light bg-open-bg p-4 md:grid-cols-[1fr_auto] md:items-end">
      <div>
        <p className="text-sm font-semibold text-open-muted">
          Color de Player Card
        </p>
        <div className="mt-3 flex h-12 max-w-md items-center gap-3 rounded-[1.25rem] border border-open-light bg-open-surface px-4">
          <Palette size={18} strokeWidth={1.8} className="text-open-muted" />
          <input
            type="color"
            value={resolvedCardColor}
            onChange={(event) => onColorChange(event.target.value)}
            className="h-8 w-12 cursor-pointer border-0 bg-transparent p-0"
            aria-label="Color de Player Card"
          />
          <input
            type="text"
            value={resolvedCardColor}
            onChange={(event) => onColorChange(event.target.value)}
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
          onClick={onReset}
          disabled={isSavingColor || !playerId}
          className="inline-flex h-11 items-center gap-2 rounded-[1.1rem] border border-open-light bg-open-surface px-4 text-sm font-semibold text-open-ink transition hover:border-open-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw size={16} strokeWidth={1.8} />
          Usar default
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSavingColor || !playerId}
          className="inline-flex h-11 items-center gap-2 rounded-[1.1rem] bg-open-primary px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-open-muted"
        >
          <Save size={16} strokeWidth={1.8} />
          {isSavingColor ? 'Guardando...' : 'Guardar color'}
        </button>
      </div>
    </section>
  )
}

function ProfileHero({ profile, club }) {
  const isCoach = profile?.isCoach
  const roleLabel = profile?.role === 'manager' ? 'Manager' : isCoach ? 'Coach' : 'Player'
  const fullName = profile?.fullName || 'OPEN profile'
  const clubName = club?.name || profile?.clubName || 'Sin club'

  return (
    <header className="relative isolate overflow-hidden rounded-[2rem] border border-open-light bg-open-ink p-5 text-white sm:rounded-[2.5rem] sm:p-7 lg:p-10">
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=1400&q=80')",
        }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/84 to-black/34" />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.5fr)] lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200/90">
            Perfil - {roleLabel}
          </p>
          <h1 className="mt-6 max-w-[12ch] text-4xl font-black leading-[0.95] sm:text-5xl lg:text-7xl">
            {fullName}
          </h1>
          <p className="mt-5 max-w-2xl text-sm font-semibold leading-6 text-white/72">
            Identidad competitiva, club, player card, estadisticas y progreso
            en una vista modular.
          </p>
        </div>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <ProfileHeroMetric icon={UserRound} label="Rol" value={roleLabel} />
            <ProfileHeroMetric icon={Trophy} label="Nivel" value={`LVL ${profile?.level || 1}`} />
            <ProfileHeroMetric icon={ShieldCheck} label="Club" value={clubName} />
            <ProfileHeroMetric icon={Users} label="XP" value={(profile?.xp || 0).toLocaleString()} />
          </div>
          {isCoach ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <HeroLink to="/skills" label="Skills" />
              <HeroLink to="/evaluaciones" label="Evaluar" />
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

function ProfileHeroMetric({ icon: Icon, label, value }) {
  return (
    <div className="grid min-h-24 content-between rounded-[1.25rem] border border-white/10 bg-white/10 p-3 backdrop-blur-sm">
      <Icon size={18} strokeWidth={2} className="text-white/70" />
      <span>
        <span className="block truncate text-lg font-black text-white">{value}</span>
        <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-white/48">
          {label}
        </span>
      </span>
    </div>
  )
}

function HeroLink({ to, label }) {
  return (
    <Link
      to={to}
      className="flex min-h-12 items-center justify-center gap-2 rounded-[1.2rem] bg-white px-4 text-sm font-black text-black transition hover:bg-white/90"
    >
      {label}
      <ChevronRight size={16} strokeWidth={2.2} />
    </Link>
  )
}

export default ProfileView
