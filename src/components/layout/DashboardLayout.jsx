import { NavLink, Outlet } from 'react-router-dom'
import { Home, ListOrdered, LogOut, Trophy, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import useActiveRole from '../../hooks/useActiveRole'
import useTheme from '../../hooks/useTheme'
import usePlayerProfile from '../../features/profile/usePlayerProfile'

const navItems = [
  { label: 'Inicio', to: '/dashboard', icon: Home },
  { label: 'Ranking', to: '/ranking', icon: ListOrdered },
  { label: 'Torneos', to: '/dashboard/torneos', icon: Trophy },
  { label: 'Perfil', to: '/profile', icon: User },
]

function DashboardLayout() {
  const { theme } = useTheme()
  const { profile } = usePlayerProfile()
  const [activeRole, setActiveRole] = useActiveRole(
    profile.role === 'coach' ? 'coach' : 'player',
  )

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
      <header className="sticky top-0 z-30 border-b border-open-light bg-open-surface">
        <div className="flex h-16 items-center justify-between px-5 md:px-8">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 text-xl font-black uppercase tracking-[0.12em] text-open-ink [font-family:'Archivo_Black',Impact,sans-serif]"
          >
            {theme.logoUrl ? (
              <img
                src={theme.logoUrl}
                alt={theme.clubName}
                className="h-8 max-w-28 object-contain"
              />
            ) : (
              'OPEN'
            )}
          </NavLink>

          <div className="flex items-center gap-3">
            {profile.isCoach ? (
              <button
                type="button"
                onClick={handleRoleSwitch}
                className="hidden h-10 border border-open-light bg-open-surface px-3 text-sm font-semibold text-open-ink transition hover:border-open-primary md:block"
              >
                ⇄ Cambiar a Vista {activeRole === 'coach' ? 'Jugador' : 'Coach'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleSignOut}
              className="hidden h-10 items-center gap-2 border border-open-light bg-open-surface px-3 text-sm font-semibold text-open-ink transition hover:border-open-ink md:flex"
            >
              <LogOut size={16} strokeWidth={1.8} />
              Salir
            </button>
            <NavLink
              to="/profile"
              aria-label="Abrir perfil"
              className="grid h-10 w-10 place-items-center border border-open-light bg-open-bg transition hover:border-open-ink"
            >
              <User size={18} strokeWidth={1.8} />
            </NavLink>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl md:grid-cols-[220px_1fr]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] border-r border-open-light bg-open-surface p-4 md:block">
          <nav className="grid gap-1">
            {navItems.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </nav>
        </aside>

        <main className="min-h-[calc(100vh-4rem)] bg-open-bg px-5 py-6 pb-24 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-open-light bg-open-surface md:hidden">
        {navItems.map((item) => (
          <NavItem key={item.to} item={item} isMobile />
        ))}
      </nav>
    </div>
  )
}

function NavItem({ item, isMobile = false }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        [
          'flex items-center text-sm font-semibold text-open-muted transition hover:text-open-ink',
          isMobile ? 'h-16 flex-col justify-center gap-1' : 'h-11 gap-3 px-3',
          isActive ? 'bg-open-bg text-open-ink' : '',
        ].join(' ')
      }
    >
      <Icon size={isMobile ? 19 : 18} strokeWidth={1.8} />
      <span className={isMobile ? 'text-[11px]' : ''}>{item.label}</span>
    </NavLink>
  )
}

export default DashboardLayout
