import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  BarChart2,
  Bell,
  Calendar,
  Check,
  CreditCard,
  Dumbbell,
  Home,
  MapPin,
  Moon,
  Newspaper,
  Settings,
  Sun,
  Swords,
  Trophy,
  User,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import useActiveRole from '../../hooks/useActiveRole'
import useColorMode from '../../hooks/useColorMode'
import useTheme from '../../hooks/useTheme'
import usePlayerProfile from '../../features/profile/usePlayerProfile'
import PWABanner from '../PWABanner'
import UserSettingsPanel from './UserSettingsPanel'
import FeedProvider from '../../features/feed/FeedProvider'

const playerNavItems = [
  { label: 'Inicio',    to: '/dashboard',     icon: Home },
  { label: 'Partidos',  to: '/matches',       icon: Swords },
  { label: 'Torneos',   to: '/tournaments',   icon: Trophy },
  { label: 'Canchas',   to: '/canchas',       icon: MapPin },
  { label: 'Feed',      to: '/feed',          icon: Newspaper },
  { label: 'Perfil',    to: '/profile',       icon: User },
]

const coachNavItems = [
  { label: 'Inicio',    to: '/dashboard',     icon: Home },
  { label: 'Partidos',  to: '/matches',       icon: Swords },
  { label: 'Entreno',   to: '/entrenamientos',icon: Dumbbell },
  { label: 'Canchas',   to: '/canchas',       icon: MapPin },
  { label: 'Feed',      to: '/feed',          icon: Newspaper },
  { label: 'Perfil',    to: '/profile',       icon: User },
]

const managerNavItems = [
  { label: 'Inicio',      to: '/dashboard',    icon: Home },
  { label: 'Membresías',  to: '/membresias',   icon: CreditCard },
  { label: 'Canchas',     to: '/canchas',      icon: MapPin },
  { label: 'Feed',        to: '/feed',         icon: Newspaper },
  { label: 'Reporte',     to: '/reporte',      icon: BarChart2 },
  { label: 'Perfil',      to: '/profile',      icon: User },
]

function DashboardLayout() {
  const { theme } = useTheme()
  const { colorMode, toggleColorMode } = useColorMode()
  const { profile } = usePlayerProfile()
  const [activeRole, setActiveRole] = useActiveRole(
    profile.role === 'coach' ? 'coach' : 'player',
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const isManager = profile.role === 'manager'
  const isCoachMode = profile.isCoach && activeRole === 'coach'
  const navItems = isManager ? managerNavItems : isCoachMode ? coachNavItems : playerNavItems

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleRoleSwitch = () => {
    const nextRole = activeRole === 'coach' ? 'player' : 'coach'
    setActiveRole(nextRole)
    window.location.assign('/dashboard')
  }

  return (
    <div className="min-h-screen bg-open-bg text-open-ink">
      <PWABanner />
      <header className="sticky top-0 z-30 border-b border-open-light bg-open-surface">
        <div className="flex h-14 items-center justify-between px-4 md:h-16 md:px-8">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 text-xl text-open-ink"
          >
            {theme.logoUrl ? (
              <img
                src={theme.logoUrl}
                alt={theme.clubName}
                className="h-7 max-w-24 object-contain md:h-8 md:max-w-28"
              />
            ) : (
              <span className="open-logo">OPEN</span>
            )}
          </NavLink>

          <div className="flex items-center gap-2 md:gap-3">
            {profile.isCoach ? (
              <button
                type="button"
                onClick={handleRoleSwitch}
                className="hidden h-9 border border-open-light bg-open-surface px-3 text-xs font-semibold text-open-ink transition hover:border-open-primary md:block md:h-10 md:text-sm"
              >
                Vista {activeRole === 'coach' ? 'Jugador' : 'Coach'}
              </button>
            ) : null}
            {/* Color toggle — hidden on mobile (available in settings) */}
            <div className="hidden md:block">
              <ColorModeToggle colorMode={colorMode} onToggle={toggleColorMode} />
            </div>
            <NotificationsButton />
            {/* Settings / User button */}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Abrir ajustes"
              className="relative grid h-9 w-9 place-items-center border border-open-light bg-open-bg text-open-ink transition hover:border-open-ink md:h-10 md:w-10"
            >
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="h-full w-full rounded-sm object-cover"
                />
              ) : (
                <User size={17} strokeWidth={1.8} />
              )}
              {/* Small settings indicator dot */}
              <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full border border-open-surface bg-open-bg">
                <Settings size={8} strokeWidth={2.5} className="text-open-muted" />
              </span>
            </button>
          </div>
        </div>
      </header>

      <UserSettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        profile={profile}
        colorMode={colorMode}
        onToggleColorMode={toggleColorMode}
        onSignOut={handleSignOut}
      />

      <div className="mx-auto grid w-full max-w-7xl md:grid-cols-[220px_1fr]">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-open-light bg-open-surface p-4 md:top-16 md:block md:h-[calc(100vh-4rem)]">
          <nav className="grid gap-1">
            {navItems.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </nav>
        </aside>

        <main className="min-h-[calc(100vh-3.5rem)] bg-open-bg px-4 py-5 pb-24 md:min-h-[calc(100vh-4rem)] md:px-8 md:py-8">
          <FeedProvider>
            <Outlet />
          </FeedProvider>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-14 border-t border-open-light bg-open-surface md:hidden">
        {navItems.map((item) => (
          <NavItem key={item.to} item={item} isMobile />
        ))}
      </nav>
    </div>
  )
}

function ColorModeToggle({ colorMode, onToggle }) {
  const isDark = colorMode === 'dark'
  const Icon = isDark ? Moon : Sun

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex h-10 w-[4.25rem] items-center rounded-full border border-open-light bg-open-bg p-1 text-open-ink transition hover:border-open-ink"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo oscuro' : 'Modo claro'}
    >
      <span
        className={[
          'grid h-8 w-8 place-items-center rounded-full border border-open-light bg-open-surface transition-transform',
          isDark ? 'translate-x-6' : 'translate-x-0',
        ].join(' ')}
      >
        <Icon size={16} strokeWidth={1.9} />
      </span>
    </button>
  )
}

function NotificationsButton() {
  const [notifications, setNotifications] = useState([])
  const [userId, setUserId] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState('')

  const load = async (uid) => {
    const { data, error: notificationsError } = await supabase
      .from('notifications')
      .select('id, title, body, href, read_at, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(20)

    if (notificationsError) {
      setError('Corre notifications_schema.sql para activar avisos.')
      setNotifications([])
    } else {
      setError('')
      setNotifications(data || [])
    }
  }

  // Initial load + realtime subscription
  useEffect(() => {
    let channel
    let cancelled = false

    const init = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id
      if (!uid || cancelled) return

      setUserId(uid)
      await load(uid)
      if (cancelled) return

      const name = `notifications:${uid}:${Date.now()}`
      channel = supabase
        .channel(name)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${uid}`,
          },
          (payload) => {
            setNotifications((current) => [payload.new, ...current].slice(0, 20))
          },
        )
        .subscribe()
    }

    init()

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  // Reload list every time the panel opens
  useEffect(() => {
    if (!isOpen || !userId) return undefined
    const timer = window.setTimeout(() => {
      load(userId)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [isOpen, userId])

  const unreadCount = notifications.filter((n) => !n.read_at).length

  const markAsRead = async (notification) => {
    if (!notification.read_at) {
      await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notification.id)

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? { ...item, read_at: new Date().toISOString() }
            : item,
        ),
      )
    }

    if (notification.href) {
      window.location.assign(notification.href)
    }
  }

  const markAllAsRead = async () => {
    if (!userId || unreadCount === 0) return

    const now = new Date().toISOString()
    await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('user_id', userId)
      .is('read_at', null)

    setNotifications((current) =>
      current.map((item) => ({ ...item, read_at: item.read_at ?? now })),
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative grid h-10 w-10 place-items-center border border-open-light bg-open-bg text-open-ink transition hover:border-open-ink"
        aria-label="Abrir notificaciones"
      >
        <Bell size={18} strokeWidth={1.8} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center bg-open-primary px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] border border-open-light bg-open-surface shadow-2xl shadow-black/10">
          <div className="flex items-center justify-between border-b border-open-light px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-open-muted">
              Notificaciones
            </p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-semibold text-open-primary transition hover:opacity-70"
              >
                Marcar todas como leídas
              </button>
            ) : (
              <span className="text-xs font-semibold text-open-muted">
                Al día
              </span>
            )}
          </div>

          {error ? (
            <p className="px-3 py-5 text-sm text-open-muted">{error}</p>
          ) : null}

          {!error && notifications.length === 0 ? (
            <p className="px-3 py-5 text-sm text-open-muted">Sin notificaciones.</p>
          ) : null}

          <div className="grid max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => markAsRead(notification)}
                className={[
                  'flex gap-3 border-b border-open-light px-3 py-3 text-left last:border-b-0 transition hover:bg-open-bg',
                  !notification.read_at ? 'bg-open-primary/5' : '',
                ].join(' ')}
              >
                <NotificationTypeIcon type={notification.type} />
                <span className="grid flex-1 gap-0.5">
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-open-ink">
                      {notification.title}
                    </span>
                    {notification.read_at ? (
                      <Check
                        size={15}
                        strokeWidth={1.8}
                        className="shrink-0 text-open-muted"
                      />
                    ) : (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-open-primary" />
                    )}
                  </span>
                  {notification.body ? (
                    <span className="text-xs leading-5 text-open-muted">
                      {notification.body}
                    </span>
                  ) : null}
                  <span className="text-[11px] text-open-muted">
                    {formatRelativeTime(notification.created_at)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function NotificationTypeIcon({ type }) {
  const cfg = {
    reservation_new:      { icon: MapPin,      cls: 'bg-blue-100 text-blue-600'   },
    reservation_created:  { icon: MapPin,      cls: 'bg-blue-100 text-blue-600'   },
    reservation_status_confirmed: { icon: MapPin, cls: 'bg-green-100 text-green-600' },
    reservation_status_cancelled: { icon: MapPin, cls: 'bg-red-100 text-red-500'  },
    tournament_registered:{ icon: Trophy,      cls: 'bg-amber-100 text-amber-600' },
    tournament_entry_new: { icon: Trophy,      cls: 'bg-amber-100 text-amber-600' },
    membership_approved:  { icon: Check,       cls: 'bg-green-100 text-green-600' },
    membership_rejected:  { icon: Bell,        cls: 'bg-red-100 text-red-500'     },
    feed_tournament_share:{ icon: Trophy,      cls: 'bg-purple-100 text-purple-600'},
    feed_event:           { icon: Calendar,    cls: 'bg-indigo-100 text-indigo-600'},
  }[type] || { icon: Bell, cls: 'bg-open-light text-open-muted' }

  const Icon = cfg.icon
  return (
    <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${cfg.cls}`}>
      <Icon size={13} strokeWidth={2} />
    </span>
  )
}

function formatRelativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs} h`
  const days = Math.floor(hrs / 24)
  return `Hace ${days} día${days > 1 ? 's' : ''}`
}

function NavItem({ item, isMobile = false }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        [
          'flex items-center font-semibold text-open-muted transition hover:text-open-ink',
          isMobile
            ? 'h-14 flex-1 flex-col justify-center gap-0.5 text-[10px]'
            : 'h-11 gap-3 px-3 text-sm',
          isActive ? 'bg-open-bg text-open-ink' : '',
        ].join(' ')
      }
    >
      <Icon size={isMobile ? 18 : 18} strokeWidth={1.8} />
      <span className={isMobile ? 'leading-none' : ''}>{item.label}</span>
    </NavLink>
  )
}

export default DashboardLayout
