import { Link } from 'react-router-dom'
import { ArrowRight, Flame, Gauge, Medal, Swords, Trophy } from 'lucide-react'
import DailyQuests from '../gamification/DailyQuests'
import XPHistoryPanel from '../gamification/XPHistoryPanel'
import { calculateLevelFromXp, getNextLevelXp } from '../gamification/xpLedger'
import usePlayerProfile from '../profile/usePlayerProfile'

const challengeBanners = [
  {
    kicker: 'Partidos',
    title: 'Reta a un rival.',
    detail: 'Registra partido, confirma resultado o entra como juez en vivo.',
    to: '/matches',
    image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1400&q=80',
  },
  {
    kicker: 'Torneos',
    title: 'Entra al bracket.',
    detail: 'Inscripciones, draw, resultados y trofeos digitales.',
    to: '/tournaments',
    image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1400&q=80',
  },
  {
    kicker: 'Ranking',
    title: 'Sube posiciones.',
    detail: 'Compara nivel, busca rivales y mide el avance del club.',
    to: '/ranking',
    image: 'https://images.unsplash.com/photo-1530915365347-e35b749a0381?auto=format&fit=crop&w=1400&q=80',
  },
]

function PlayerChallengesView() {
  const { player, profile } = usePlayerProfile()
  const xp = profile.xp || 0
  const level = calculateLevelFromXp(xp)
  const nextLevelXp = getNextLevelXp(level)
  const progress = Math.min(Math.round((xp / nextLevelXp) * 100), 100)

  return (
    <section className="grid gap-5">
      <article className="relative overflow-hidden rounded-[2rem] border border-open-light bg-open-ink text-white shadow-xl shadow-black/5">
        <img
          src="https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1800&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/20" />
        <div className="relative grid gap-7 p-7 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">Player desafios</p>
            <h1 className="mt-5 max-w-2xl text-5xl font-black leading-[0.92] md:text-7xl">
              Compite por tu siguiente nivel.
            </h1>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-[1.6rem] border border-white/10 bg-white/12 p-2 backdrop-blur-md">
            <HeroMetric label="Nivel" value={level} />
            <HeroMetric label="XP" value={xp.toLocaleString('es')} />
            <HeroMetric label="Avance" value={`${progress}%`} />
          </div>
        </div>
      </article>

      <div className="grid gap-4 lg:grid-cols-3">
        {challengeBanners.map((challenge) => (
          <ChallengeBanner key={challenge.title} challenge={challenge} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
        <section className="grid gap-4 rounded-[2rem] border border-open-light bg-open-surface p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-open-muted">Progreso</p>
              <h2 className="mt-2 text-3xl font-black text-open-ink">Nivel {level}</h2>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-full bg-open-ink text-white">
              <Gauge size={20} strokeWidth={2} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm font-bold">
              <span>{xp.toLocaleString('es')} XP</span>
              <span className="text-open-muted">{nextLevelXp.toLocaleString('es')} XP</span>
            </div>
            <div className="mt-3 h-3 rounded-full bg-open-light">
              <div className="h-full rounded-full bg-open-ink" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniCard icon={Swords} label="Partidos" value="Retos" />
            <MiniCard icon={Trophy} label="Torneos" value="Bracket" />
            <MiniCard icon={Medal} label="Logros" value="XP" />
          </div>
        </section>

        <section className="grid gap-4 rounded-[2rem] border border-open-light bg-open-surface p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-open-ink text-white">
              <Flame size={19} strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-open-muted">Daily quests</p>
              <h2 className="text-2xl font-black text-open-ink">Retos diarios</h2>
            </div>
          </div>
          <DailyQuests />
        </section>
      </div>

      <XPHistoryPanel player={player} />
    </section>
  )
}

function ChallengeBanner({ challenge }) {
  return (
    <Link
      to={challenge.to}
      className="group relative min-h-72 overflow-hidden rounded-[2rem] border border-open-light bg-open-ink p-5 text-white shadow-xl shadow-black/5 transition hover:border-open-ink"
    >
      <img
        src={challenge.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/15" />
      <div className="relative flex h-full min-h-60 flex-col justify-between">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200/90">{challenge.kicker}</p>
        <div>
          <h2 className="max-w-[10ch] text-4xl font-black leading-[0.95]">{challenge.title}</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-white/72">{challenge.detail}</p>
          <span className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-white px-4 text-xs font-black text-open-ink">
            Entrar <ArrowRight size={15} strokeWidth={2.4} />
          </span>
        </div>
      </div>
    </Link>
  )
}

function HeroMetric({ label, value }) {
  return (
    <div className="min-w-20 rounded-[1.2rem] bg-white/10 p-3 text-center">
      <p className="text-xl font-black leading-none">{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/65">{label}</p>
    </div>
  )
}

function MiniCard({ icon: Icon, label, value }) {
  return (
    <article className="rounded-[1.4rem] border border-open-light bg-open-bg p-4">
      <Icon size={18} strokeWidth={2} />
      <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-open-muted">{label}</p>
      <p className="mt-1 text-lg font-black text-open-ink">{value}</p>
    </article>
  )
}

export default PlayerChallengesView
