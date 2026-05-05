import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import useManagerClub from '../../hooks/useManagerClub'

const managerSkillCategories = [
  {
    id: 'club',
    kicker: 'Club',
    actions: [
      {
        label: 'Gestionar canchas',
        detail: 'Fotos, horarios, precios y disponibilidad del club.',
        to: '/canchas',
        image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1400&q=80',
      },
      {
        label: 'Publicar anuncio',
        detail: 'Comunica avisos, eventos y novedades al feed del club.',
        to: '/feed',
        image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=80',
      },
      {
        label: 'Reporte del club',
        detail: 'Revisa actividad, ocupacion y señales operativas.',
        to: '/reporte',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80',
      },
    ],
  },
  {
    id: 'memberships',
    kicker: 'Membresias',
    actions: [
      {
        label: 'Aprobar miembros',
        detail: 'Valida players, coaches y estatus de membresia.',
        to: '/membresias',
        image: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1400&q=80',
      },
      {
        label: 'Ver jugadores',
        detail: 'Consulta el roster del club y sus perfiles.',
        to: '/jugadores',
        image: 'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=1400&q=80',
      },
      {
        label: 'Feed social',
        detail: 'Revisa actividad reciente de la comunidad.',
        to: '/feed',
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
      },
    ],
  },
  {
    id: 'competition',
    kicker: 'Competencia',
    actions: [
      {
        label: 'Crear torneo',
        detail: 'Base, jugadores, draw y publicacion.',
        to: '/tournaments',
        image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1400&q=80',
      },
      {
        label: 'Ranking del club',
        detail: 'Ratings, categorias y top del club.',
        to: '/ranking',
        image: 'https://images.unsplash.com/photo-1530915365347-e35b749a0381?auto=format&fit=crop&w=1400&q=80',
      },
      {
        label: 'Partidos',
        detail: 'Resultados recientes y actividad competitiva.',
        to: '/matches',
        image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1400&q=80',
      },
    ],
  },
]

function ManagerSkillsView() {
  const { clubId, isLoading } = useManagerClub()

  if (isLoading) {
    return <p className="text-sm text-open-muted">Cargando club...</p>
  }

  if (!clubId) {
    return (
      <p className="rounded-[1.5rem] border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
        No se encontro un club asociado a este manager.
      </p>
    )
  }

  return (
    <section className="grid gap-5">
      <div className="grid gap-4">
        {managerSkillCategories.map((category) => (
          <ManagerSkillCategory key={category.id} category={category} />
        ))}
      </div>
    </section>
  )
}

function ManagerSkillCategory({ category }) {
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
    if (Math.abs(delta) > 44) {
      goTo(activeIndex + (delta > 0 ? 1 : -1))
    }
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
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black via-black/82 to-black/30" />

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

        <div className="grid gap-4 lg:justify-items-end lg:text-right">
          <p className="max-w-md text-sm font-semibold leading-6 text-white/75">
            {activeAction.detail}
          </p>
          <span className="text-xs font-black uppercase tracking-[0.14em] text-white/60">
            Tap para abrir
          </span>
        </div>
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

export default ManagerSkillsView
