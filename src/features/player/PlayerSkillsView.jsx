import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import usePlayerProfile from '../profile/usePlayerProfile'

const playerSkillCategories = [
  {
    id: 'compete',
    kicker: 'Competir',
    actions: [
      {
        label: 'Registrar partido',
        detail: 'Resultado, rival y marcador.',
        to: '/matches',
        image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1400&q=80',
      },
      {
        label: 'Inscribirme a torneo',
        detail: 'Categoria, disponibilidad y bracket.',
        to: '/tournaments',
        image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1400&q=80',
      },
      {
        label: 'Buscar rival',
        detail: 'Ranking del club y jugadores compatibles.',
        to: '/ranking',
        image: 'https://images.unsplash.com/photo-1530915365347-e35b749a0381?auto=format&fit=crop&w=1400&q=80',
      },
    ],
  },
  {
    id: 'train',
    kicker: 'Entrenar',
    actions: [
      {
        label: 'Ver entrenamientos',
        detail: 'Agenda, sesiones activas y asistencia.',
        to: '/entrenamientos',
        image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1400&q=80',
      },
      {
        label: 'Confirmar asistencia',
        detail: 'Revisa clases y estatus de convocatoria.',
        to: '/entrenamientos',
        image: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1400&q=80',
      },
      {
        label: 'Ver progreso',
        detail: 'XP, nivel, logros y estadisticas personales.',
        to: '/profile',
        image: 'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=1400&q=80',
      },
    ],
  },
  {
    id: 'club',
    kicker: 'Club',
    actions: [
      {
        label: 'Reservar cancha',
        detail: 'Elige cancha, fecha y horario.',
        to: '/canchas',
        image: 'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=1400&q=80',
      },
      {
        label: 'Mis reservas',
        detail: 'Consulta y cancela reservas activas.',
        to: '/canchas',
        image: 'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=1400&q=80',
      },
      {
        label: 'Feed del club',
        detail: 'Actualizaciones, avisos y comunidad.',
        to: '/feed',
        image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=80',
      },
    ],
  },
  {
    id: 'identity',
    kicker: 'Identidad',
    actions: [
      {
        label: 'Mi perfil',
        detail: 'Player card, membresia y logros.',
        to: '/profile',
        image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=1400&q=80',
      },
      {
        label: 'Mi ranking',
        detail: 'Rating, posicion y comparativas.',
        to: '/ranking',
        image: 'https://images.unsplash.com/photo-1530915365347-e35b749a0381?auto=format&fit=crop&w=1400&q=80',
      },
      {
        label: 'Mis trofeos',
        detail: 'Logros digitales y actividad competitiva.',
        to: '/profile',
        image: 'https://images.unsplash.com/photo-1521417531039-75e91486cc40?auto=format&fit=crop&w=1400&q=80',
      },
    ],
  },
]

function PlayerSkillsView() {
  const { profile } = usePlayerProfile()

  if (!profile.clubId) {
    return (
      <p className="rounded-[2rem] border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
        Vincula tu perfil a un club para acceder a tus skills de jugador.
      </p>
    )
  }

  return (
    <section className="grid gap-5">
      {playerSkillCategories.map((category) => (
        <PlayerSkillCarousel key={category.id} category={category} />
      ))}
    </section>
  )
}

function PlayerSkillCarousel({ category }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(null)
  const activeAction = category.actions[activeIndex]

  const goTo = (index) => {
    const total = category.actions.length
    setActiveIndex((index + total) % total)
  }

  const handleTouchEnd = (event) => {
    if (touchStart === null) return
    const delta = touchStart - event.changedTouches[0].clientX
    if (Math.abs(delta) > 44) goTo(activeIndex + (delta > 0 ? 1 : -1))
    setTouchStart(null)
  }

  return (
    <article
      className="group relative isolate overflow-hidden rounded-[2rem] border border-open-light text-white shadow-2xl shadow-black/10 transition hover:border-open-ink sm:rounded-[2.5rem]"
      onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center transition duration-500 group-hover:scale-105"
        style={{ backgroundImage: `url(${activeAction.image})` }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black via-black/82 to-black/25" />

      <Link
        to={activeAction.to}
        className="grid min-h-72 content-between gap-8 p-5 text-left text-white sm:p-7 lg:min-h-80 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.45fr)] lg:items-end"
      >
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200/90">
            {category.kicker}
          </p>
          <h2 className="mt-6 max-w-[12ch] text-4xl font-black leading-[0.95] sm:text-5xl lg:text-6xl">
            {activeAction.label}
          </h2>
        </div>
        <p className="max-w-md text-sm font-semibold leading-6 text-white/75 lg:justify-self-end lg:text-right">
          {activeAction.detail}
        </p>
      </Link>

      <button
        type="button"
        onClick={() => goTo(activeIndex - 1)}
        className="absolute left-3 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur-sm transition hover:bg-white hover:text-black sm:left-5"
        aria-label="Accion anterior"
      >
        <ChevronLeft size={20} strokeWidth={2.4} />
      </button>
      <button
        type="button"
        onClick={() => goTo(activeIndex + 1)}
        className="absolute right-3 top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur-sm transition hover:bg-white hover:text-black sm:right-5"
        aria-label="Siguiente accion"
      >
        <ChevronRight size={20} strokeWidth={2.4} />
      </button>

      <div className="absolute inset-x-0 bottom-5 z-20 flex justify-center gap-2">
        {category.actions.map((action, index) => (
          <button
            key={action.label}
            type="button"
            onClick={() => goTo(index)}
            className={[
              'h-2.5 rounded-full transition',
              index === activeIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/35 hover:bg-white/70',
            ].join(' ')}
            aria-label={`Ver ${action.label}`}
          />
        ))}
      </div>
    </article>
  )
}

export default PlayerSkillsView
