import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  CalendarPlus,
  ChevronRight,
  Dumbbell,
  Megaphone,
  MapPin,
  ShieldCheck,
  Swords,
  Trophy,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import usePlayerProfile from '../profile/usePlayerProfile'

const skillCategories = [
  {
    id: 'competition',
    kicker: 'Competencia',
    title: 'Torneos, brackets y resultados.',
    detail: 'Crea torneos, revisa partidos recientes y empuja la competencia del club.',
    image:
      'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1400&q=80',
    actions: [
      { label: 'Crear torneo', detail: 'Base, jugadores y draw', icon: Trophy, to: '/tournaments' },
      { label: 'Registrar resultado', detail: 'Partidos y confirmaciones', icon: Swords, to: '/matches' },
      { label: 'Ranking del club', detail: 'Ratings y categorias', icon: Trophy, to: '/ranking' },
    ],
  },
  {
    id: 'training',
    kicker: 'Entrenamiento',
    title: 'Clases, asistencia y XP.',
    detail: 'Programa sesiones, revisa cupos y organiza el trabajo semanal.',
    image:
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1400&q=80',
    actions: [
      { label: 'Nueva clase', detail: 'Grupo, fecha y plan', icon: Dumbbell, to: '/entrenamientos' },
      { label: 'Pasar asistencia', detail: 'Confirmar alumnos', icon: ShieldCheck, to: '/entrenamientos' },
      { label: 'Plan semanal', detail: 'Sesiones proximas', icon: CalendarPlus, to: '/entrenamientos' },
    ],
  },
  {
    id: 'players',
    kicker: 'Jugadores',
    title: 'Roster, perfiles y progreso.',
    detail: 'Alumnos, evaluaciones, categorias y seguimiento en un solo bloque.',
    image:
      'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=1400&q=80',
    actions: [
      { label: 'Agregar jugador', detail: 'Invitar o vincular perfil', icon: UserPlus, to: '/jugadores' },
      { label: 'Evaluar pendientes', detail: 'Categorias, stats y XP', icon: ShieldCheck, to: '/evaluaciones' },
      { label: 'Ver ranking', detail: 'Progreso y niveles', icon: Users, to: '/ranking' },
    ],
  },
  {
    id: 'club',
    kicker: 'Club ops',
    title: 'Avisos, canchas y operacion.',
    detail: 'Accesos rapidos a reservas, feed y comunicacion del club.',
    image:
      'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=1400&q=80',
    actions: [
      { label: 'Reservar cancha', detail: 'Cancha, dia y horario', icon: MapPin, to: '/canchas' },
      { label: 'Avisar al club', detail: 'Feed y notificaciones', icon: Bell, to: '/feed' },
      { label: 'Publicar post', detail: 'Comunicado o logro', icon: Megaphone, to: '/feed' },
    ],
  },
]

function CoachSkillsView() {
  const { profile } = usePlayerProfile()
  const [activeCategory, setActiveCategory] = useState(skillCategories[0].id)

  if (!profile.clubId) {
    return (
      <p className="rounded-[2rem] border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
        Necesitas pertenecer a un club para acceder a Skills de coach.
      </p>
    )
  }

  return (
    <section className="grid gap-5">
      <div className="grid gap-4">
        {skillCategories.map((category) => (
          <SkillCategory
            key={category.id}
            category={category}
            active={activeCategory === category.id}
            onToggle={() =>
              setActiveCategory((current) => (current === category.id ? '' : category.id))
            }
          />
        ))}
      </div>
    </section>
  )
}

function SkillCategory({ category, active, onToggle }) {
  return (
    <article className="grid gap-3">
      <button
        type="button"
        onClick={onToggle}
        className={[
          'group relative isolate grid min-h-72 overflow-hidden rounded-[2rem] border p-5 text-left text-white transition sm:rounded-[2.5rem] sm:p-7 lg:min-h-80',
          active ? 'border-open-ink shadow-2xl shadow-black/15' : 'border-open-light hover:border-open-ink',
        ].join(' ')}
      >
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center transition duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${category.image})` }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black via-black/82 to-black/30" />
        <div className="grid h-full content-between gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200/90">
              {category.kicker}
            </p>
            <h2 className="mt-6 max-w-[13ch] text-4xl font-black leading-[0.95] sm:text-5xl lg:text-6xl">
              {category.title}
            </h2>
          </div>
          <div className="grid gap-4 lg:justify-items-end lg:text-right">
            <p className="max-w-md text-sm font-semibold leading-6 text-white/75">
              {category.detail}
            </p>
            <span className="flex min-h-14 w-fit items-center rounded-full bg-white p-2 text-black transition group-hover:scale-105">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-white">
                {active ? <X size={18} strokeWidth={2.4} /> : <ChevronRight size={19} strokeWidth={2.4} />}
              </span>
            </span>
          </div>
        </div>
      </button>

      {active ? (
        <div className="grid gap-3 rounded-[2rem] border border-open-light bg-open-bg p-3 sm:p-4 lg:grid-cols-3">
          {category.actions.map((action) => (
            <SkillAction key={action.label} action={action} />
          ))}
        </div>
      ) : null}
    </article>
  )
}

function SkillAction({ action }) {
  const Icon = action.icon

  return (
    <Link
      to={action.to}
      className="group flex min-h-24 items-center gap-3 rounded-[1.5rem] border border-open-light bg-open-surface p-4 text-left text-open-ink transition hover:border-open-ink"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[1rem] bg-open-ink text-open-surface">
        <Icon size={21} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-black leading-5">{action.label}</span>
        <span className="mt-1 block text-sm leading-5 text-open-muted">{action.detail}</span>
      </span>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-open-bg text-open-muted transition group-hover:bg-open-ink group-hover:text-open-surface">
        <ChevronRight size={18} strokeWidth={2.2} />
      </span>
    </Link>
  )
}

export default CoachSkillsView
