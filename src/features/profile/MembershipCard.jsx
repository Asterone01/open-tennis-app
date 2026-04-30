import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Moon, Printer, Sun } from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_LABELS    = { manager: 'MANAGER', coach: 'COACH', player: 'PLAYER' }
const PLAN_LABELS    = { standard: 'Estándar', premium: 'Premium', student: 'Estudiante', courtesy: 'Cortesía' }
const CAT_LABELS     = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado', pro: 'Pro' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFallbackId(profile) {
  const src = profile.playerId || profile.email || 'OPEN'
  return `OPEN-${String(src).replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()}`
}

function getInitials(name) {
  return (name || 'OP').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

function formatDate(v) {
  if (!v) return '—'
  return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(`${v}T00:00:00`))
}

// ─── Wrapper (used by ProfileView) ───────────────────────────────────────────

function MembershipCard({ club, profile }) {
  const membershipId = profile.membershipId || buildFallbackId(profile)
  const isPaid = ['paid', 'waived'].includes(profile.membershipPaymentStatus)
  const isApproved = profile.clubMembershipStatus === 'approved'

  if (!isApproved) return null

  if (!isPaid) {
    return (
      <section className="border border-open-light bg-open-surface p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-open-muted">Membresía del club</p>
        <p className="mt-3 text-base font-semibold text-open-ink">Tu credencial está pendiente de pago</p>
        <p className="mt-1 text-sm text-open-muted">
          Realiza tu pago al manager para obtener tu ID de acceso al club.
        </p>
        <div className="mt-4 inline-block border border-yellow-400 bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-700 dark:bg-transparent">
          Estado:{' '}
          {profile.membershipPaymentStatus === 'overdue' ? 'Vencida — contacta al manager' : 'Pendiente de pago'}
        </div>
      </section>
    )
  }

  return (
    <IdCard
      membershipId={membershipId}
      fullName={profile.fullName}
      avatarUrl={profile.avatarUrl}
      category={profile.currentCategory || profile.suggestedCategory || 'Intermedio'}
      role={profile.isCoach ? 'coach' : profile.role || 'player'}
      level={profile.level || 1}
      plan={profile.membershipPlan || 'standard'}
      membershipSince={profile.membershipSince}
      clubName={club?.name || ''}
      clubLogoUrl={club?.logo_url || ''}
      playerId={profile.playerId}
      clubId={profile.clubId}
    />
  )
}

// ─── IdCard (also exported for manager view) ─────────────────────────────────

export function IdCard({
  membershipId,
  fullName,
  avatarUrl,
  category,
  role,
  level,
  plan,
  membershipSince,
  clubName,
  clubLogoUrl,
  playerId,
  clubId,
  showControls = true,
}) {
  const [isDark, setIsDark] = useState(true)
  const qrRef  = useRef(null)
  const year   = new Date().getFullYear()
  const qrValue = `OPEN:${membershipId}:${playerId || ''}:${clubId || ''}`

  // ── Theme tokens ──
  const bg     = isDark ? '#0d0d0f' : '#ffffff'
  const dot    = isDark ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.04)'
  const ink    = isDark ? '#ffffff' : '#0d0d0f'
  const muted  = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.40)'
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)'
  const accent = '#22c55e'
  const shadow = isDark
    ? '0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06)'
    : '0 40px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.08)'

  const roleLabel = ROLE_LABELS[role] || 'PLAYER'
  const catLabel  = CAT_LABELS[(category || '').toLowerCase()] || category || 'Intermedio'
  const planLabel = PLAN_LABELS[plan] || 'Estándar'
  const initials  = getInitials(fullName)

  const handlePrint = () => {
    const canvas = qrRef.current?.querySelector('canvas')
    const qrDataUrl = canvas?.toDataURL('image/png') || ''
    printCard({ membershipId, fullName, avatarUrl, category: catLabel, role: roleLabel, level, plan: planLabel, clubName, clubLogoUrl, year, qrDataUrl, membershipSince, isDark })
  }

  const s = { // shorthand style helpers
    card: {
      background: bg,
      backgroundImage: `radial-gradient(circle, ${dot} 1px, transparent 1px)`,
      backgroundSize: '18px 18px',
      borderRadius: 20,
      boxShadow: shadow,
      overflow: 'hidden',
      fontFamily: 'Inter, ui-sans-serif, sans-serif',
      maxWidth: 380,
      width: '100%',
    },
  }

  return (
    <div className="grid gap-3">
      {/* ── Card ── */}
      <div style={s.card} className="mx-auto">

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 22px 0' }}>
          <span style={{ fontFamily: '"Archivo Black", Impact, sans-serif', fontStyle: 'oblique 10deg', fontSize: 17, color: ink, textTransform: 'uppercase', letterSpacing: 0 }}>
            OPEN
          </span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.18em', color: muted, textTransform: 'uppercase' }}>ID CLUB</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: accent, lineHeight: 1.1 }}>{year}</div>
          </div>
        </div>

        {/* Club section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 18, gap: 6 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 12,
            border: `1.5px solid ${border}`,
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            display: 'grid', placeItems: 'center',
          }}>
            {clubLogoUrl
              ? <img src={clubLogoUrl} alt="" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6 }} />
              : <ShieldFlower size={28} color={ink} />
            }
          </div>
          <div style={{ textAlign: 'center', padding: '0 28px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', color: ink, textTransform: 'uppercase' }}>
              {clubName || 'Club'}
            </div>
            <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.2em', color: muted, textTransform: 'uppercase', marginTop: 2 }}>
              Club de Tenis
            </div>
          </div>
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 14 }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: isDark ? '#1a1a1f' : '#e5e5e5',
            border: `2.5px solid ${border}`,
            boxShadow: `0 0 0 5px ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
            overflow: 'hidden',
            display: 'grid', placeItems: 'center',
          }}>
            {avatarUrl
              ? <img src={avatarUrl} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 26, fontWeight: 800, color: muted }}>{initials}</span>
            }
          </div>
        </div>

        {/* Name */}
        <div style={{ textAlign: 'center', padding: '10px 28px 0' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: ink, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
            {fullName}
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`,
          margin: '14px 0 0',
        }}>
          <StatCol label="CATEGORÍA" value={catLabel}       accent={accent} muted={muted} border={border} />
          <StatCol label="ROL"       value={roleLabel}      accent={accent} muted={muted} border={border} borderX />
          <StatCol label="NIVEL"     value={`Lvl ${level}`} accent={ink}    muted={muted} border={border} />
        </div>

        {/* QR section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '18px 24px 10px', gap: 10 }}>
          {/* Hidden canvas for print data URL extraction */}
          <div ref={qrRef} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', left: -9999 }}>
            <QRCodeCanvas value={qrValue} size={200} level="M" fgColor="#0d0d0f" bgColor="#ffffff" />
          </div>

          {/* Visible QR */}
          <div style={{ padding: 12, background: '#ffffff', borderRadius: 12 }}>
            <QRCodeCanvas
              value={qrValue}
              size={180}
              level="M"
              fgColor="#0d0d0f"
              bgColor="#ffffff"
              imageSettings={clubLogoUrl ? { src: clubLogoUrl, width: 30, height: 30, excavate: true } : undefined}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', color: accent, textTransform: 'uppercase' }}>
              Escanea para entrar
            </div>
            <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.14em', color: muted, textTransform: 'uppercase', marginTop: 3 }}>
              Acceso al club
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px 20px',
          borderTop: `1px solid ${border}`,
          marginTop: 6,
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: accent, boxShadow: `0 0 8px ${accent}`, flexShrink: 0 }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.15em', color: ink, textTransform: 'uppercase' }}>
              ID Válido para acceso al club
            </div>
            <div style={{ fontSize: 7.5, color: muted, marginTop: 1.5 }}>
              Presenta este código en el acceso del club
            </div>
          </div>
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {planLabel}
            </div>
            {membershipSince && (
              <div style={{ fontSize: 7.5, color: muted, marginTop: 1 }}>
                Desde {formatDate(membershipSince)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="mx-auto flex w-full gap-2" style={{ maxWidth: 380 }}>
          <button
            type="button"
            onClick={() => setIsDark((d) => !d)}
            className="flex flex-1 items-center justify-center gap-2 border border-open-light bg-open-surface py-2.5 text-xs font-semibold text-open-ink transition hover:border-open-ink"
          >
            {isDark ? <Sun size={13} strokeWidth={2} /> : <Moon size={13} strokeWidth={2} />}
            {isDark ? 'Modo claro' : 'Modo oscuro'}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex flex-1 items-center justify-center gap-2 border border-open-light bg-open-surface py-2.5 text-xs font-semibold text-open-ink transition hover:border-open-ink"
          >
            <Printer size={13} strokeWidth={2} />
            Imprimir
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCol({ label, value, accent, muted, border, borderX }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 6, padding: '12px 8px',
      ...(borderX ? { borderLeft: `1px solid ${border}`, borderRight: `1px solid ${border}` } : {}),
    }}>
      <div style={{ fontSize: 7.5, fontWeight: 700, letterSpacing: '0.16em', color: muted, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, color: accent, letterSpacing: '0.02em', textAlign: 'center' }}>
        {value}
      </div>
    </div>
  )
}

function ShieldFlower({ size = 28, color = '#ffffff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L4 6v6c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V6L12 2z"
        stroke={color} strokeWidth="1.5" strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="1.8" fill={color} />
      <circle cx="12" cy="8.8"  r="1.3" fill={color} opacity="0.65" />
      <circle cx="14.9" cy="10.5" r="1.3" fill={color} opacity="0.65" />
      <circle cx="14.9" cy="13.5" r="1.3" fill={color} opacity="0.65" />
      <circle cx="12" cy="15.2"  r="1.3" fill={color} opacity="0.65" />
      <circle cx="9.1"  cy="13.5" r="1.3" fill={color} opacity="0.65" />
      <circle cx="9.1"  cy="10.5" r="1.3" fill={color} opacity="0.65" />
    </svg>
  )
}

// ─── Print helper ─────────────────────────────────────────────────────────────

function printCard({ membershipId, fullName, avatarUrl, category, role, level, plan, clubName, clubLogoUrl, year, qrDataUrl, membershipSince, isDark }) {
  const bg     = isDark ? '#0d0d0f' : '#ffffff'
  const ink    = isDark ? '#ffffff' : '#0d0d0f'
  const muted  = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.40)'
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)'
  const accent = '#22c55e'
  const dot    = isDark ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.04)'

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Credencial OPEN — ${fullName}</title>
  <style>
    @page { size: 85.6mm 150mm portrait; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { width: 85.6mm; height: 150mm; background: white; display: flex; justify-content: center; align-items: center; }
    .card {
      width: 85.6mm; height: 150mm;
      background-color: ${bg};
      background-image: radial-gradient(circle, ${dot} 1px, transparent 1px);
      background-size: 14px 14px;
      font-family: Inter, Arial, sans-serif;
      color: ${ink};
      display: flex; flex-direction: column;
      overflow: hidden;
    }
    .top { display:flex; justify-content:space-between; align-items:flex-start; padding: 12px 14px 0; }
    .logo { font-family: Impact, Arial, sans-serif; font-style: italic; font-size: 13px; color: ${ink}; text-transform: uppercase; letter-spacing: 0; }
    .id-badge { text-align: right; }
    .id-label { font-size: 6px; font-weight: 700; letter-spacing: 0.18em; color: ${muted}; text-transform: uppercase; }
    .id-year { font-size: 12px; font-weight: 800; color: ${accent}; line-height: 1.1; }
    .club-section { display:flex; flex-direction:column; align-items:center; padding: 10px 0 6px; gap:4px; }
    .club-icon { width:34px; height:34px; border-radius:8px; border:1px solid ${border}; background:${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}; display:grid; place-items:center; }
    .club-logo-img { width:24px; height:24px; object-fit:contain; border-radius:4px; }
    .club-name { font-size:9px; font-weight:800; letter-spacing:0.1em; color:${ink}; text-transform:uppercase; text-align:center; padding: 0 14px; }
    .club-sub { font-size:6px; font-weight:600; letter-spacing:0.2em; color:${muted}; text-transform:uppercase; margin-top:1px; }
    .avatar-wrap { display:flex; justify-content:center; padding-top:8px; }
    .avatar { width:62px; height:62px; border-radius:50%; border:2px solid ${border}; object-fit:cover; background:${isDark ? '#1a1a1f' : '#e5e5e5'}; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:800; color:${muted}; overflow:hidden; }
    .avatar img { width:100%; height:100%; object-fit:cover; }
    .player-name { text-align:center; padding: 7px 16px 0; font-size:15px; font-weight:800; color:${ink}; letter-spacing:-0.01em; line-height:1.2; }
    .stats { display:grid; grid-template-columns:1fr 1fr 1fr; border-top:1px solid ${border}; border-bottom:1px solid ${border}; margin-top:8px; }
    .stat { display:flex; flex-direction:column; align-items:center; gap:3px; padding:8px 4px; }
    .stat.bx { border-left:1px solid ${border}; border-right:1px solid ${border}; }
    .stat-label { font-size:5.5px; font-weight:700; letter-spacing:0.15em; color:${muted}; text-transform:uppercase; }
    .stat-value { font-size:9px; font-weight:800; }
    .qr-section { display:flex; flex-direction:column; align-items:center; padding: 10px 16px 4px; gap:6px; }
    .qr-wrap { padding:7px; background:#fff; border-radius:8px; }
    .qr-wrap img { width:100px; height:100px; display:block; }
    .qr-text { text-align:center; }
    .qr-title { font-size:7px; font-weight:800; letter-spacing:0.2em; color:${accent}; text-transform:uppercase; }
    .qr-sub { font-size:5.5px; font-weight:600; letter-spacing:0.14em; color:${muted}; text-transform:uppercase; margin-top:1px; }
    .footer { display:flex; align-items:center; gap:5px; padding:6px 12px 10px; border-top:1px solid ${border}; margin-top:auto; }
    .dot { width:7px; height:7px; border-radius:50%; background:${accent}; flex-shrink:0; }
    .footer-text { flex:1; min-width:0; }
    .footer-main { font-size:5.5px; font-weight:800; letter-spacing:0.12em; color:${ink}; text-transform:uppercase; }
    .footer-sub { font-size:5px; color:${muted}; margin-top:1px; }
    .footer-plan { font-size:5.5px; font-weight:700; color:${muted}; text-transform:uppercase; letter-spacing:0.1em; text-align:right; flex-shrink:0; }
  </style>
</head>
<body>
<div class="card">
  <div class="top">
    <span class="logo">OPEN</span>
    <div class="id-badge">
      <div class="id-label">ID Club</div>
      <div class="id-year">${year}</div>
    </div>
  </div>

  <div class="club-section">
    <div class="club-icon">
      ${clubLogoUrl ? `<img src="${clubLogoUrl}" class="club-logo-img" alt="" />` : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V6L12 2z" stroke="${ink}" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="12" r="1.8" fill="${ink}"/><circle cx="12" cy="8.8" r="1.2" fill="${ink}" opacity="0.65"/><circle cx="14.9" cy="10.5" r="1.2" fill="${ink}" opacity="0.65"/><circle cx="14.9" cy="13.5" r="1.2" fill="${ink}" opacity="0.65"/><circle cx="12" cy="15.2" r="1.2" fill="${ink}" opacity="0.65"/><circle cx="9.1" cy="13.5" r="1.2" fill="${ink}" opacity="0.65"/><circle cx="9.1" cy="10.5" r="1.2" fill="${ink}" opacity="0.65"/></svg>`}
    </div>
    <div class="club-name">${clubName || 'Club'}</div>
    <div class="club-sub">Club de Tenis</div>
  </div>

  <div class="avatar-wrap">
    <div class="avatar">
      ${avatarUrl ? `<img src="${avatarUrl}" alt="${fullName}" />` : `<span>${(fullName || 'OP').split(' ').filter(Boolean).slice(0,2).map(p=>p[0]).join('').toUpperCase()}</span>`}
    </div>
  </div>

  <div class="player-name">${fullName}</div>

  <div class="stats">
    <div class="stat">
      <div class="stat-label">Categoría</div>
      <div class="stat-value" style="color:${accent}">${category}</div>
    </div>
    <div class="stat bx">
      <div class="stat-label">Rol</div>
      <div class="stat-value" style="color:${accent}">${role}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Nivel</div>
      <div class="stat-value" style="color:${ink}">Lvl ${level}</div>
    </div>
  </div>

  <div class="qr-section">
    <div class="qr-wrap">
      ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR" />` : `<div style="width:100px;height:100px;background:#eee;"></div>`}
    </div>
    <div class="qr-text">
      <div class="qr-title">Escanea para entrar</div>
      <div class="qr-sub">Acceso al club</div>
    </div>
  </div>

  <div class="footer">
    <div class="dot"></div>
    <div class="footer-text">
      <div class="footer-main">ID Válido para acceso al club</div>
      <div class="footer-sub">Presenta este código en el acceso del club</div>
    </div>
    <div class="footer-plan">${plan}${membershipSince ? `<br/>Desde ${membershipSince}` : ''}</div>
  </div>
</div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=400,height=700')
  if (!win) return
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.onload = () => {
    win.print()
    setTimeout(() => win.close(), 1000)
  }
}

export default MembershipCard
