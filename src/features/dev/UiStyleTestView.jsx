import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  CalendarPlus,
  Check,
  ChevronRight,
  Dumbbell,
  Megaphone,
  MapPin,
  Plus,
  ShieldCheck,
  Swords,
  Trophy,
  UserPlus,
  Users,
  X,
} from 'lucide-react'

const coachCommandBanners = [
  {
    id: 'competition',
    kicker: 'Competencia',
    title: 'Torneos, brackets y trofeos.',
    detail: 'Todo lo competitivo queda dentro de una categoria con acciones rapidas.',
    image:
      'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1400&q=80',
    actions: [
      { label: 'Crear torneo', detail: 'Base, jugadores y draw', icon: Trophy, to: '/tournaments' },
      { label: 'Registrar resultado', detail: 'Actualizar rondas y XP', icon: Swords, to: '/tournaments' },
      { label: 'Emitir trofeo', detail: 'Card digital para campeon', icon: ShieldCheck, to: '/profile' },
    ],
  },
  {
    id: 'training',
    kicker: 'Entrenamiento',
    title: 'Clases, asistencia y XP.',
    detail: 'Programacion deportiva compacta para el dia a dia del coach.',
    image:
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1400&q=80',
    actions: [
      { label: 'Nueva clase', detail: 'Grupo, fecha y plan', icon: Dumbbell, to: '/entrenamientos' },
      { label: 'Pasar asistencia', detail: 'Confirmar alumnos', icon: Check, to: '/entrenamientos' },
      { label: 'Publicar drill', detail: 'Enviar al feed del club', icon: Megaphone, to: '/feed' },
    ],
  },
  {
    id: 'players',
    kicker: 'Jugadores',
    title: 'Roster, perfiles y progreso.',
    detail: 'Alumnos, vinculaciones, ranking interno y seguimiento en un panel.',
    image:
      'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=1400&q=80',
    actions: [
      { label: 'Agregar jugador', detail: 'Invitar o vincular perfil', icon: UserPlus, to: '/dashboard', modal: 'player-link' },
      { label: 'Ver ranking', detail: 'Ratings y categorias', icon: Trophy, to: '/ranking' },
      { label: 'Grupo de alumnos', detail: 'Filtrar por nivel', icon: Users, to: '/dashboard' },
    ],
  },
  {
    id: 'club',
    kicker: 'Club ops',
    title: 'Avisos, canchas y operacion.',
    detail: 'Lo administrativo se agrupa sin perder acceso a acciones frecuentes.',
    image:
      'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=1400&q=80',
    actions: [
      { label: 'Reservar cancha', detail: 'Cancha, dia y horario', icon: MapPin, to: '/canchas' },
      { label: 'Avisar al club', detail: 'Feed y notificaciones', icon: Bell, to: '/feed' },
      { label: 'Miembros', detail: 'Aprobar y revisar', icon: ShieldCheck, to: '/membresias' },
    ],
  },
]

const playerCommandBanners = [
  {
    id: 'compete',
    kicker: 'Competir',
    title: 'Partidos, torneos y retos.',
    detail: 'El jugador entra rapido a competir, registrar resultados o buscar rival.',
    image:
      'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1400&q=80',
    actions: [
      { label: 'Registrar partido', detail: 'Resultado, rival y marcador', icon: Swords, to: '/matches' },
      { label: 'Inscribirme a torneo', detail: 'Categoria y disponibilidad', icon: Trophy, to: '/tournaments' },
      { label: 'Buscar rival', detail: 'Ranking y nivel compatible', icon: Users, to: '/ranking' },
    ],
  },
  {
    id: 'train',
    kicker: 'Entrenar',
    title: 'Clases, drills y asistencia.',
    detail: 'Un bloque para agenda deportiva, tareas del coach y progreso semanal.',
    image:
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1400&q=80',
    actions: [
      { label: 'Ver entrenamientos', detail: 'Agenda y sesiones activas', icon: Dumbbell, to: '/entrenamientos' },
      { label: 'Confirmar asistencia', detail: 'Check-in de clase', icon: Check, to: '/entrenamientos' },
      { label: 'Ver plan semanal', detail: 'Objetivos y drills', icon: CalendarPlus, to: '/dashboard' },
    ],
  },
  {
    id: 'reserve',
    kicker: 'Reservar',
    title: 'Canchas, horarios y club.',
    detail: 'Acceso directo a reservas, disponibilidad y ubicaciones del club.',
    image:
      'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=1400&q=80',
    actions: [
      { label: 'Reservar cancha', detail: 'Dia, hora y duracion', icon: MapPin, to: '/canchas' },
      { label: 'Mis reservas', detail: 'Proximas y pasadas', icon: CalendarPlus, to: '/canchas' },
      { label: 'Avisos del club', detail: 'Cambios y notificaciones', icon: Bell, to: '/feed' },
    ],
  },
  {
    id: 'progress',
    kicker: 'Progreso',
    title: 'Perfil, ranking y trofeos.',
    detail: 'La identidad competitiva del jugador con XP, logros y actividad.',
    image:
      'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=1400&q=80',
    actions: [
      { label: 'Ver perfil', detail: 'Bio, categoria y club', icon: UserPlus, to: '/profile' },
      { label: 'Mi ranking', detail: 'Rating y posicion', icon: Trophy, to: '/ranking' },
      { label: 'Mis trofeos', detail: 'Logros digitales', icon: ShieldCheck, to: '/profile' },
    ],
  },
]

const managerCommandBanners = [
  {
    id: 'club-ops',
    kicker: 'Operacion',
    title: 'Club, agenda y control diario.',
    detail: 'El manager entra a lo operativo sin navegar por menus largos.',
    image:
      'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1400&q=80',
    actions: [
      { label: 'Dashboard del club', detail: 'Actividad, ocupacion y pendientes', icon: ShieldCheck, to: '/dashboard' },
      { label: 'Crear evento', detail: 'Clase especial, social o torneo', icon: CalendarPlus, to: '/feed' },
      { label: 'Aviso general', detail: 'Publicar y notificar miembros', icon: Megaphone, to: '/feed' },
    ],
  },
  {
    id: 'members',
    kicker: 'Miembros',
    title: 'Socios, perfiles y accesos.',
    detail: 'Alta, aprobacion, vinculaciones y control de perfiles del club.',
    image:
      'https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&w=1400&q=80',
    actions: [
      { label: 'Agregar miembro', detail: 'Jugador, coach o staff', icon: UserPlus, to: '/membresias' },
      { label: 'Aprobar solicitud', detail: 'Validar acceso al club', icon: Check, to: '/membresias' },
      { label: 'Gestionar roles', detail: 'Permisos y perfiles', icon: Users, to: '/membresias' },
    ],
  },
  {
    id: 'courts',
    kicker: 'Canchas',
    title: 'Reservas, horarios y recursos.',
    detail: 'Configuracion de canchas, disponibilidad, bloqueos y reservas.',
    image:
      'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=1400&q=80',
    actions: [
      { label: 'Agregar cancha', detail: 'Nombre, superficie y foto', icon: MapPin, to: '/canchas' },
      { label: 'Bloquear horario', detail: 'Mantenimiento o evento', icon: CalendarPlus, to: '/canchas' },
      { label: 'Ver reservas', detail: 'Agenda del dia y pagos', icon: Bell, to: '/canchas' },
    ],
  },
  {
    id: 'reports',
    kicker: 'Reportes',
    title: 'Metricas, pagos y crecimiento.',
    detail: 'Lectura rapida del rendimiento operativo y deportivo del club.',
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80',
    actions: [
      { label: 'Reporte mensual', detail: 'Actividad y ocupacion', icon: Trophy, to: '/reporte' },
      { label: 'Ingresos', detail: 'Reservas y membresias', icon: ShieldCheck, to: '/reporte' },
      { label: 'Ranking del club', detail: 'Jugadores activos', icon: Users, to: '/ranking' },
    ],
  },
]

const playerGalleryPreview = [
  {
    name: 'Alex Rivera',
    level: 'B - Juvenil',
    status: 'Vinculado',
    record: '12-4',
    image:
      'https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Sofia Leon',
    level: 'A - Adulto',
    status: 'Activo',
    record: '18-6',
    image:
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Mateo Cruz',
    level: 'C - Junior',
    status: 'Pendiente',
    record: '7-5',
    image:
      'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?auto=format&fit=crop&w=600&q=80',
  },
]

export default function UiStyleTestView() {
  return (
    <section className="grid w-full gap-5">
      <div className="grid gap-4">
        <main className="grid gap-4">
          <CoachCommandCenterPreview categories={coachCommandBanners} />

          <PlayerCommandCenterPreview categories={playerCommandBanners} />

          <ManagerCommandCenterPreview categories={managerCommandBanners} />
        </main>
      </div>
    </section>
  )
}

function CoachCommandCenterPreview({ categories }) {
  const [activeCategory, setActiveCategory] = useState(categories[0].id)
  const [openModal, setOpenModal] = useState(null)
  const [configAction, setConfigAction] = useState(null)

  return (
    <>
      <section className="grid gap-5 rounded-[2rem] border border-open-light bg-open-surface p-4 sm:p-5 lg:p-6">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-open-muted">
              Coach UI test
            </p>
            <h2 className="mt-2 text-3xl font-black text-open-ink md:text-5xl">
              Categorias anidadas
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-open-muted">
              Ejemplo de menu compacto: cada banner abre su panel de creacion y
              mantiene las acciones grandes, claras y separadas para mobile y web.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-[1.5rem] border border-open-light bg-open-bg p-2">
            <MiniMetric label="Banners" value={categories.length} />
            <MiniMetric label="Panel" value="1" />
          </div>
        </div>

        <div className="grid gap-4">
          {categories.map((category) => (
            <FullWidthCoachCategory
              key={category.id}
              category={category}
              active={activeCategory === category.id}
              onToggle={() =>
                setActiveCategory((current) => (current === category.id ? '' : category.id))
              }
              onOpenModal={setOpenModal}
              onOpenConfig={setConfigAction}
            />
          ))}
        </div>
      </section>

      {openModal === 'player-link' ? (
        <PlayerLinkModal onClose={() => setOpenModal(null)} />
      ) : null}
      {configAction ? (
        <ActionConfigModal
          action={configAction.action}
          category={configAction.category}
          onClose={() => setConfigAction(null)}
        />
      ) : null}
    </>
  )
}

function ManagerCommandCenterPreview({ categories }) {
  const [activeCategory, setActiveCategory] = useState(categories[0].id)
  const [configAction, setConfigAction] = useState(null)

  return (
    <>
      <section className="grid gap-5 rounded-[2rem] border border-open-light bg-open-surface p-4 sm:p-5 lg:p-6">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-open-muted">
              Manager UI test
            </p>
            <h2 className="mt-2 text-3xl font-black text-open-ink md:text-5xl">
              Control modular del club
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-open-muted">
              Mismo sistema de banners desplegables, enfocado en operacion:
              miembros, canchas, comunicacion, reportes y control del club.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-[1.5rem] border border-open-light bg-open-bg p-2">
            <MiniMetric label="Rol" value="Manager" />
            <MiniMetric label="Areas" value={categories.length} />
          </div>
        </div>

        <div className="grid gap-4">
          {categories.map((category) => (
            <FullWidthCoachCategory
              key={category.id}
              category={category}
              active={activeCategory === category.id}
              onToggle={() =>
                setActiveCategory((current) => (current === category.id ? '' : category.id))
              }
              onOpenModal={() => {}}
              onOpenConfig={setConfigAction}
            />
          ))}
        </div>
      </section>

      {configAction ? (
        <ActionConfigModal
          action={configAction.action}
          category={configAction.category}
          onClose={() => setConfigAction(null)}
        />
      ) : null}
    </>
  )
}

function PlayerCommandCenterPreview({ categories }) {
  const [activeCategory, setActiveCategory] = useState(categories[0].id)
  const [configAction, setConfigAction] = useState(null)

  return (
    <>
      <section className="grid gap-5 rounded-[2rem] border border-open-light bg-open-surface p-4 sm:p-5 lg:p-6">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-open-muted">
              Player UI test
            </p>
            <h2 className="mt-2 text-3xl font-black text-open-ink md:text-5xl">
              Home anidado del jugador
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-open-muted">
              Mismo sistema que coach, pero centrado en acciones personales:
              competir, entrenar, reservar y revisar progreso.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-[1.5rem] border border-open-light bg-open-bg p-2">
            <MiniMetric label="Rol" value="Player" />
            <MiniMetric label="Tap" value="2" />
          </div>
        </div>

        <div className="grid gap-4">
          {categories.map((category) => (
            <FullWidthCoachCategory
              key={category.id}
              category={category}
              active={activeCategory === category.id}
              onToggle={() =>
                setActiveCategory((current) => (current === category.id ? '' : category.id))
              }
              onOpenModal={() => {}}
              onOpenConfig={setConfigAction}
            />
          ))}
        </div>
      </section>

      {configAction ? (
        <ActionConfigModal
          action={configAction.action}
          category={configAction.category}
          onClose={() => setConfigAction(null)}
        />
      ) : null}
    </>
  )
}

function FullWidthCoachCategory({ category, active, onToggle, onOpenModal, onOpenConfig }) {
  return (
    <article className="grid gap-3">
      <CoachCommandBanner category={category} active={active} onClick={onToggle} />
      {active ? (
        <div className="grid gap-3 rounded-[2rem] border border-open-light bg-open-bg p-3 sm:p-4 lg:grid-cols-3">
          {category.actions.map((action) => (
            <NestedActionLink
              key={action.label}
              action={action}
              category={category}
              onOpenModal={onOpenModal}
              onOpenConfig={onOpenConfig}
            />
          ))}
        </div>
      ) : null}
    </article>
  )
}

function CoachCommandBanner({ category, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
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
          <h3 className="mt-6 max-w-[13ch] text-4xl font-black leading-[0.95] sm:text-5xl lg:text-6xl">
            {category.title}
          </h3>
        </div>

        <div className="grid gap-4 lg:justify-items-end lg:text-right">
          <p className="max-w-md text-sm font-semibold leading-6 text-white/75">
            {category.detail}
          </p>
          <span className="flex min-h-14 w-fit items-center rounded-full bg-white p-2 text-black transition group-hover:scale-105">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-white">
              {active ? (
                <X size={18} strokeWidth={2.4} />
              ) : (
                <ChevronRight size={19} strokeWidth={2.4} />
              )}
            </span>
          </span>
        </div>
      </div>
    </button>
  )
}

function NestedActionLink({ action, category, onOpenModal, onOpenConfig }) {
  const Icon = action.icon

  if (action.modal) {
    return (
      <button
        type="button"
        onClick={() => onOpenModal(action.modal)}
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
          <Plus size={18} strokeWidth={2.4} />
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onOpenConfig({ action, category })}
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
        <Plus size={18} strokeWidth={2.4} />
      </span>
    </button>
  )
}

function ActionConfigModal({ action, category, onClose }) {
  const Icon = action.icon

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/45 p-3 backdrop-blur-sm sm:place-items-center sm:p-6">
      <section className="grid max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-white/20 bg-open-surface p-4 shadow-2xl shadow-black/25 sm:rounded-[2.5rem] sm:p-5 lg:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(16rem,0.72fr)_minmax(0,1.28fr)]">
          <div className="relative isolate grid min-h-72 content-between overflow-hidden rounded-[2rem] bg-open-ink p-5 text-white sm:p-6">
            <div
              className="absolute inset-0 -z-20 bg-cover bg-center"
              style={{ backgroundImage: `url(${category.image})` }}
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black via-black/82 to-black/28" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200/90">
                  {category.kicker}
                </p>
                <h3 className="mt-6 max-w-[9ch] text-5xl font-black leading-[0.95]">
                  {action.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-black transition hover:bg-white/90"
                aria-label="Cerrar configuracion"
              >
                <X size={22} strokeWidth={2.4} />
              </button>
            </div>
            <p className="max-w-sm text-sm font-semibold leading-6 text-white/72">
              {action.detail}. Esta ventana seria el paso de configuracion antes
              de guardar o publicar.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-3 rounded-[1.75rem] border border-open-light bg-open-bg p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[1rem] bg-open-ink text-open-surface">
                  <Icon size={22} strokeWidth={2} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-open-muted">
                    Configuracion rapida
                  </p>
                  <h4 className="mt-1 text-2xl font-black text-open-ink">
                    {action.label}
                  </h4>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <CompactField label="Nombre" value={action.label} />
                <CompactField label="Categoria" value={category.kicker} />
                <CompactField label="Estado" value="Borrador" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="grid min-h-36 content-between rounded-[1.75rem] border border-open-ink bg-open-ink p-4 text-left text-open-surface"
              >
                <span className="grid h-12 w-12 place-items-center rounded-[1rem] bg-white/10">
                  <Plus size={22} strokeWidth={2.4} />
                </span>
                <span>
                  <span className="block text-xl font-black">Crear ahora</span>
                  <span className="mt-1 block text-sm leading-6 text-white/68">
                    Guarda la configuracion y abre el detalle.
                  </span>
                </span>
              </button>
              <Link
                to={action.to}
                className="grid min-h-36 content-between rounded-[1.75rem] border border-open-light bg-open-bg p-4 text-open-ink transition hover:border-open-ink"
              >
                <span className="grid h-12 w-12 place-items-center rounded-[1rem] bg-open-surface">
                  <ChevronRight size={22} strokeWidth={2.2} />
                </span>
                <span>
                  <span className="block text-xl font-black">Ir al modulo</span>
                  <span className="mt-1 block break-words text-sm leading-6 text-open-muted">
                    Ruta propuesta: {action.to}
                  </span>
                </span>
              </Link>
            </div>

            <div className="grid gap-3 rounded-[1.75rem] border border-open-light bg-open-bg p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-open-muted">
                Siguiente pantalla
              </p>
              <p className="text-sm leading-6 text-open-muted">
                En productivo esta modal puede convertirse en el formulario real:
                torneo, clase, resultado, aviso, reserva o miembro, segun la
                accion elegida.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function PlayerLinkModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/45 p-3 backdrop-blur-sm sm:place-items-center sm:p-6">
      <section className="grid max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-white/20 bg-open-surface p-4 shadow-2xl shadow-black/25 sm:rounded-[2.5rem] sm:p-5 lg:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(18rem,0.78fr)_minmax(0,1.22fr)]">
          <div className="relative isolate grid min-h-72 content-between overflow-hidden rounded-[2rem] bg-open-ink p-5 text-white sm:p-6">
            <div
              className="absolute inset-0 -z-20 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=1400&q=80')",
              }}
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black via-black/82 to-black/28" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200/90">
                  Jugadores
                </p>
                <h3 className="mt-6 max-w-[9ch] text-5xl font-black leading-[0.95]">
                  Agregar o vincular perfil.
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-black transition hover:bg-white/90"
                aria-label="Cerrar modal"
              >
                <X size={22} strokeWidth={2.4} />
              </button>
            </div>
            <p className="max-w-sm text-sm font-semibold leading-6 text-white/72">
              Desde aqui el coach decide si crea una ficha interna del alumno o
              si conecta una cuenta existente de OPEN.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <PlayerFlowOption
                icon={UserPlus}
                title="Agregar jugador nuevo"
                detail="Crea ficha rapida con nombre, categoria, telefono opcional y grupo."
                path="/dashboard - Coach - Jugadores"
                primary
              />
              <PlayerFlowOption
                icon={ShieldCheck}
                title="Vincular perfil existente"
                detail="Busca por email o codigo de invitacion y enlaza auth.user con player."
                path="/dashboard - Vincular perfil"
              />
            </div>

            <div className="grid gap-3 rounded-[1.75rem] border border-open-light bg-open-bg p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-open-muted">
                Diseno del siguiente paso
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <CompactField label="Nombre" value="Alex Rivera" />
                <CompactField label="Categoria" value="B - Juvenil" />
                <CompactField label="Grupo" value="Competitivo" />
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <p className="text-sm leading-6 text-open-muted">
                  Despues de confirmar, el flujo mandaria al coach al detalle
                  del jugador con tabs: perfil, asistencia, partidos y XP.
                </p>
                <Link
                  to="/dashboard"
                  className="flex min-h-14 items-center justify-center gap-2 rounded-[1.25rem] bg-open-primary px-5 text-sm font-black text-white transition hover:opacity-90"
                >
                  Ir a jugadores
                  <ChevronRight size={18} strokeWidth={2.2} />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.75rem] border border-open-light bg-open-bg p-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-open-muted">
                    Galeria de jugadores
                  </p>
                  <h4 className="mt-1 text-2xl font-black text-open-ink">
                    Roster del coach
                  </h4>
                </div>
                <button
                  type="button"
                  className="flex min-h-11 items-center gap-2 rounded-full bg-open-ink px-4 text-sm font-black text-open-surface"
                >
                  <Plus size={17} strokeWidth={2.4} />
                  Agregar
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {playerGalleryPreview.map((player) => (
                  <PlayerPreviewCard key={player.name} player={player} />
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MiniRouteCard label="Destino" value="/dashboard" />
              <MiniRouteCard label="Tabla" value="players" />
              <MiniRouteCard label="Vinculo" value="user_id" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function PlayerPreviewCard({ player }) {
  return (
    <article className="group grid min-h-72 content-between overflow-hidden rounded-[1.5rem] border border-open-light bg-open-surface p-3 text-open-ink transition hover:border-open-ink">
      <div className="relative min-h-40 overflow-hidden rounded-[1.2rem] bg-open-ink">
        <div
          className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url(${player.image})` }}
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-black">
            {player.status}
          </span>
        </div>
      </div>
      <div className="grid gap-3 p-1">
        <div>
          <h5 className="text-lg font-black leading-6">{player.name}</h5>
          <p className="mt-1 text-sm text-open-muted">{player.level}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-open-bg px-3 py-2 text-xs font-black text-open-muted">
            Record {player.record}
          </span>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-open-ink text-open-surface">
            <ChevronRight size={17} strokeWidth={2.2} />
          </span>
        </div>
      </div>
    </article>
  )
}

function PlayerFlowOption({ icon: Icon, title, detail, path, primary = false }) {
  return (
    <button
      type="button"
      className={[
        'grid min-h-56 content-between rounded-[1.75rem] border p-4 text-left transition',
        primary
          ? 'border-open-ink bg-open-ink text-open-surface'
          : 'border-open-light bg-open-bg text-open-ink hover:border-open-ink',
      ].join(' ')}
    >
      <span className="flex items-start justify-between gap-3">
        <span className={['grid h-12 w-12 place-items-center rounded-[1rem]', primary ? 'bg-white/10' : 'bg-open-surface'].join(' ')}>
          <Icon size={22} strokeWidth={2} />
        </span>
        <span className={['grid h-10 w-10 place-items-center rounded-full', primary ? 'bg-white text-black' : 'bg-open-ink text-open-surface'].join(' ')}>
          <Plus size={18} strokeWidth={2.4} />
        </span>
      </span>
      <span>
        <span className="block text-xl font-black leading-6">{title}</span>
        <span className={['mt-2 block text-sm leading-6', primary ? 'text-white/68' : 'text-open-muted'].join(' ')}>
          {detail}
        </span>
        <span className={['mt-4 block rounded-[1rem] px-3 py-2 text-xs font-black uppercase tracking-[0.12em]', primary ? 'bg-white/10 text-white/70' : 'bg-open-surface text-open-muted'].join(' ')}>
          {path}
        </span>
      </span>
    </button>
  )
}

function MiniRouteCard({ label, value }) {
  return (
    <div className="grid min-h-20 content-center rounded-[1.25rem] border border-open-light bg-open-bg p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-open-muted">{label}</p>
      <p className="mt-1 break-words text-base font-black text-open-ink">{value}</p>
    </div>
  )
}

function CompactField({ label, value }) {
  return (
    <button
      type="button"
      className="flex min-h-20 items-center justify-between gap-3 rounded-[1.25rem] border border-open-light bg-open-surface px-4 py-3 text-left transition hover:border-open-ink"
    >
      <span className="min-w-0">
        <span className="block text-xs font-black uppercase tracking-[0.14em] text-open-muted">
          {label}
        </span>
        <span className="mt-1 block text-base font-black leading-5 text-open-ink">{value}</span>
      </span>
      <Plus size={19} strokeWidth={2.4} className="shrink-0 text-open-muted" />
    </button>
  )
}

function MiniMetric({ label, value }) {
  return (
    <div className="grid min-w-16 place-items-center rounded-[1rem] bg-open-bg px-3 py-2 text-center">
      <span className="text-base font-black text-open-ink">{value}</span>
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-open-muted">{label}</span>
    </div>
  )
}



