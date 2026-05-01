import { Link } from 'react-router-dom'
import {
  Award,
  Calendar,
  ChevronRight,
  Flame,
  Heart,
  MessageSquare,
  Newspaper,
  ThumbsUp,
  Trophy,
  Users,
} from 'lucide-react'
import { useFeed } from './useFeed'

const TYPE_META = {
  event: { label: 'Evento', icon: Calendar },
  tournament_share: { label: 'Torneo', icon: Trophy },
  achievement: { label: 'Logro', icon: Award },
  post: { label: 'Comunidad', icon: Users },
}

function DashboardFeedPreview() {
  const { posts, isLoading, error, reloadFeed } = useFeed()
  const latestPosts = posts.slice(0, 4)

  return (
    <section className="grid gap-4 rounded-[2rem] border border-open-light bg-open-surface p-4 sm:rounded-[2.35rem] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[1.25rem] bg-open-ink text-white">
            <Newspaper size={22} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-open-muted">
              Feed social
            </p>
            <h2 className="mt-1 text-2xl font-black leading-tight text-open-ink">
              Ultimas actualizaciones
            </h2>
          </div>
        </div>
        <Link
          to="/feed"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[1.15rem] bg-open-ink px-4 text-sm font-black text-white transition hover:opacity-90"
        >
          Ver feed
          <ChevronRight size={16} strokeWidth={2.2} />
        </Link>
      </div>

      {error ? (
        <div className="rounded-[1.35rem] border border-red-300 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-600">{error}</p>
          <button
            type="button"
            onClick={reloadFeed}
            className="mt-3 text-xs font-black uppercase tracking-[0.12em] text-red-600"
          >
            Reintentar
          </button>
        </div>
      ) : isLoading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-32 animate-pulse rounded-[1.35rem] bg-open-bg" />
          ))}
        </div>
      ) : latestPosts.length === 0 ? (
        <div className="rounded-[1.35rem] border border-open-light bg-open-bg p-5 text-sm font-semibold text-open-muted">
          Aun no hay publicaciones del club.
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {latestPosts.map((post) => (
            <FeedPreviewCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  )
}

function FeedPreviewCard({ post }) {
  const meta = TYPE_META[post.type] || TYPE_META.post
  const Icon = meta.icon
  const title = post.event_title || post.content || post.tournaments?.title || 'Actualizacion del club'
  const detail =
    post.type === 'event'
      ? formatEventDetail(post)
      : post.type === 'tournament_share' && post.tournaments?.title
      ? post.tournaments.title
      : post.author_name || 'OPEN'

  return (
    <Link
      to="/feed"
      className="group grid min-h-36 gap-3 rounded-[1.45rem] border border-open-light bg-open-bg p-4 transition hover:border-open-primary hover:bg-open-surface"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-open-light bg-open-surface px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-open-muted">
          <Icon size={13} strokeWidth={2} />
          {meta.label}
        </span>
        <span className="text-[11px] font-semibold text-open-muted">
          {formatPostDate(post.created_at)}
        </span>
      </div>

      <div className="min-w-0">
        <h3 className="line-clamp-2 text-lg font-black leading-tight text-open-ink">
          {title}
        </h3>
        {detail ? (
          <p className="mt-2 line-clamp-1 text-sm font-semibold text-open-muted">
            {detail}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-4 text-xs font-bold text-open-muted">
        <ReactionStat icon={ThumbsUp} count={post.likes_count} />
        <ReactionStat icon={Flame} count={post.fire_count} />
        <ReactionStat icon={Heart} count={post.love_count} />
        <span className="ml-auto inline-flex items-center gap-1 text-open-muted transition group-hover:text-open-ink">
          <MessageSquare size={14} strokeWidth={2} />
          Abrir
        </span>
      </div>
    </Link>
  )
}

function ReactionStat({ icon: Icon, count = 0 }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon size={14} strokeWidth={2} />
      {count || 0}
    </span>
  )
}

function formatPostDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value))
}

function formatEventDetail(post) {
  const parts = []
  if (post.event_date) {
    parts.push(new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(post.event_date)))
  }
  if (post.event_location) parts.push(post.event_location)
  return parts.join(' - ')
}

export default DashboardFeedPreview
