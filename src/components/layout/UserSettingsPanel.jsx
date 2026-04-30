import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Moon,
  Shield,
  Sun,
  Trophy,
  User,
  X,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name) {
  return (name || 'OP')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

function RoleBadge({ role, isCoach }) {
  if (role === 'manager') {
    return (
      <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
        <Trophy size={9} strokeWidth={2} /> Manager
      </span>
    )
  }
  if (isCoach) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
        <Shield size={9} strokeWidth={2} /> Coach
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-open-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-open-muted">
      <User size={9} strokeWidth={2} /> Jugador
    </span>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function UserSettingsPanel({
  isOpen,
  onClose,
  profile,
  colorMode,
  onToggleColorMode,
  onSignOut,
}) {
  const panelRef = useRef(null)

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Trap focus & prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      panelRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const isDark      = colorMode === 'dark'
  const fullName    = profile?.fullName || 'Jugador OPEN'
  const avatarUrl   = profile?.avatarUrl
  const clubName    = profile?.clubName || 'Sin club'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        ref={panelRef}
        tabIndex={-1}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col border-l border-open-light bg-open-surface outline-none sm:max-w-sm"
        aria-label="Ajustes de usuario"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-open-light px-5 py-4">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-open-muted">
            Ajustes
          </span>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center border border-open-light bg-open-bg text-open-muted transition hover:border-open-ink hover:text-open-ink"
            aria-label="Cerrar"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex flex-1 flex-col gap-0 overflow-y-auto">

          {/* ── Profile card ── */}
          <div className="flex items-center gap-4 px-5 py-5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-full border border-open-light object-cover"
              />
            ) : (
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-open-light bg-open-bg text-lg font-black text-open-ink">
                {initials(fullName)}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-open-ink">{fullName}</p>
              <p className="mb-1.5 truncate text-xs text-open-muted">{clubName}</p>
              <RoleBadge role={profile?.role} isCoach={profile?.isCoach} />
            </div>
          </div>

          <Link
            to="/profile"
            onClick={onClose}
            className="flex items-center justify-between border-t border-open-light px-5 py-3.5 text-sm font-semibold text-open-ink transition hover:bg-open-bg"
          >
            <span className="flex items-center gap-2.5">
              <User size={15} strokeWidth={1.8} className="text-open-muted" />
              Ver mi perfil
            </span>
            <ChevronRight size={15} strokeWidth={2} className="text-open-muted" />
          </Link>

          {/* ── Preferencias ── */}
          <div className="mt-4 border-t border-open-light px-5 pb-1 pt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-open-muted">
              Preferencias
            </p>
          </div>

          <div className="flex items-center justify-between px-5 py-3">
            <span className="flex items-center gap-2.5 text-sm font-semibold text-open-ink">
              {isDark ? (
                <Moon size={15} strokeWidth={1.8} className="text-open-muted" />
              ) : (
                <Sun size={15} strokeWidth={1.8} className="text-open-muted" />
              )}
              {isDark ? 'Modo oscuro' : 'Modo claro'}
            </span>
            <button
              type="button"
              onClick={onToggleColorMode}
              role="switch"
              aria-checked={isDark}
              className={[
                'relative h-6 w-11 rounded-full border transition-colors duration-200',
                isDark
                  ? 'border-open-primary bg-open-primary'
                  : 'border-open-light bg-open-light',
              ].join(' ')}
              aria-label="Cambiar modo de color"
            >
              <span
                className={[
                  'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
                  isDark ? 'translate-x-5' : 'translate-x-0.5',
                ].join(' ')}
              />
            </button>
          </div>

          {/* ── Cuenta ── */}
          <div className="mt-4 border-t border-open-light px-5 pb-1 pt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-open-muted">
              Cuenta
            </p>
          </div>

          <ChangePasswordSection />

          {/* ── Sign out ── */}
          <div className="mt-auto border-t border-open-light p-5">
            <button
              type="button"
              onClick={onSignOut}
              className="flex w-full items-center justify-center gap-2 border border-open-light bg-open-bg py-3 text-sm font-semibold text-open-ink transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={15} strokeWidth={1.8} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

// ─── Change password ──────────────────────────────────────────────────────────

function ChangePasswordSection() {
  const [expanded, setExpanded]   = useState(false)
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [status, setStatus]       = useState(null) // null | 'ok' | 'error'
  const [message, setMessage]     = useState('')
  const [loading, setLoading]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) {
      setStatus('error')
      setMessage('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setStatus('error')
      setMessage('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setStatus('error')
      setMessage(error.message)
    } else {
      setStatus('ok')
      setMessage('Contraseña actualizada correctamente.')
      setPassword('')
      setConfirm('')
    }
  }

  return (
    <div className="border-b border-open-light">
      <button
        type="button"
        onClick={() => { setExpanded((v) => !v); setStatus(null) }}
        className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-semibold text-open-ink transition hover:bg-open-bg"
      >
        <span className="flex items-center gap-2.5">
          <KeyRound size={15} strokeWidth={1.8} className="text-open-muted" />
          Cambiar contraseña
        </span>
        <ChevronRight
          size={15}
          strokeWidth={2}
          className={`text-open-muted transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      {expanded && (
        <form onSubmit={handleSubmit} className="px-5 pb-4">
          {/* New password */}
          <div className="relative mb-2">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nueva contraseña"
              required
              className="w-full border border-open-light bg-open-bg px-3 py-2.5 pr-10 text-sm text-open-ink placeholder:text-open-muted focus:border-open-ink focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-open-muted hover:text-open-ink"
              tabIndex={-1}
            >
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Confirm */}
          <div className="relative mb-3">
            <input
              type={showPw ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirmar contraseña"
              required
              className="w-full border border-open-light bg-open-bg px-3 py-2.5 text-sm text-open-ink placeholder:text-open-muted focus:border-open-ink focus:outline-none"
            />
          </div>

          {status && (
            <div className={[
              'mb-3 flex items-start gap-2 px-3 py-2 text-xs font-semibold',
              status === 'ok'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-600',
            ].join(' ')}>
              {status === 'ok' && <Check size={13} strokeWidth={2.5} className="mt-px shrink-0" />}
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-open-primary py-2.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Guardando…' : 'Actualizar contraseña'}
          </button>
        </form>
      )}
    </div>
  )
}
