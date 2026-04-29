import { BadgeCheck, Printer } from 'lucide-react'

function MembershipCard({ club, profile }) {
  const membershipId = profile.membershipId || buildFallbackMembershipId(profile)
  const qrData = encodeURIComponent(
    JSON.stringify({
      type: 'open_membership',
      membershipId,
      playerId: profile.playerId,
      clubId: profile.clubId,
    }),
  )
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}`

  const handlePrint = () => {
    window.print()
  }

  return (
    <section className="grid gap-4 border border-open-light bg-open-surface p-5 md:grid-cols-[1fr_auto] md:items-center">
      <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
            Membresia del club
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-open-ink">
            {club?.name || 'Club pendiente'}
          </h2>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <MembershipRow label="ID" value={membershipId} />
            <MembershipRow
              label="Estado"
              value={formatMembership(profile.clubMembershipStatus)}
            />
            <MembershipRow
              label="Miembro desde"
              value={formatDate(profile.membershipSince)}
            />
            <MembershipRow
              label="Proximo pago"
              value={formatDate(profile.membershipNextPaymentDate)}
            />
            <MembershipRow
              label="Plan"
              value={formatPlan(profile.membershipPlan)}
            />
            <MembershipRow
              label="Pago"
              value={formatPayment(profile.membershipPaymentStatus)}
            />
          </div>
        </div>

        <div className="grid justify-items-center gap-3 border border-open-light bg-open-bg p-4">
          <img
            src={qrUrl}
            alt={`QR membresia ${membershipId}`}
            className="h-32 w-32 bg-white object-contain"
          />
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-open-muted">
            <BadgeCheck size={14} strokeWidth={1.8} />
            Credencial QR
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex h-11 items-center justify-center gap-2 border border-open-light bg-open-bg px-4 text-sm font-semibold text-open-ink transition hover:border-open-primary"
      >
        <Printer size={16} strokeWidth={1.8} />
        Imprimir credencial
      </button>
    </section>
  )
}

function MembershipRow({ label, value }) {
  return (
    <div className="border border-open-light bg-open-bg px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-open-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-open-ink">{value || '--'}</p>
    </div>
  )
}

function buildFallbackMembershipId(profile) {
  const source = profile.playerId || profile.email || 'OPEN'

  return `OPEN-${String(source).replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()}`
}

function formatDate(value) {
  if (!value) return 'Pendiente'

  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function formatMembership(value) {
  const labels = {
    unassigned: 'Sin club',
    pending: 'Pendiente',
    approved: 'Activa',
    rejected: 'Rechazada',
  }

  return labels[value] || 'Pendiente'
}

function formatPayment(value) {
  const labels = {
    unknown: 'Pendiente',
    pending: 'Pendiente',
    paid: 'Pagado',
    overdue: 'Vencido',
    waived: 'Exento',
  }

  return labels[value] || 'Pendiente'
}

function formatPlan(value) {
  const labels = {
    standard: 'Estandar',
    family: 'Familiar',
    student: 'Estudiante',
    coach: 'Coach',
  }

  return labels[value] || value || 'Estandar'
}

export default MembershipCard
