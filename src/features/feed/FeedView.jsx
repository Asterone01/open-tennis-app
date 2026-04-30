import { useEffect, useRef, useState } from 'react'
import {
  Award,
  Calendar,
  Camera,
  ChevronRight,
  Flame,
  Heart,
  MapPin,
  MessageSquare,
  Newspaper,
  Plus,
  Send,
  ThumbsUp,
  Trophy,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import usePlayerProfile from '../profile/usePlayerProfile'
import useManagerClub from '../../hooks/useManagerClub'

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_META = {
  event:            { label: 'Evento',     icon: Calendar,      color: 'bg-emerald-500',  text: 'text-emerald-500'  },
  tournament_share: { label: 'Torneo',     icon: Trophy,        color: 'bg-violet-500',   text: 'text-violet-500'   },
  achievement:      { label: 'Logro',      icon: Award,         color: 'bg-amber-500',    text: 'text-amber-500'    },
  post:             { label: 'Comunidad',  icon: Users,         color: 'bg-blue-500',     text: 'text-blue-500'     },
}

const FILTERS = [
  { key: 'all',    label: 'Todo' },
  { key: 'event',  label: 'Eventos' },
  { key: 'tournament_share', label: 'Torneos' },
  { key: 'post',   label: 'Comunidad' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)   return 'Ahora'
  if (m < 60)  return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h`
  const d = Math.floor(h / 24)
  return `${d}d`
}

function formatShortDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short' })
}

function formatEventDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('es', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function FeedView() {
  const { profile, user }         = usePlayerProfile()
  const { clubId: managerClubId } = useManagerClub()
  const clubId = profile?.clubId || managerClubId

  const [posts, setPosts]           = useState([])
  const [myReactions, setMyReact]   = useState({}) // { [postId]: 'like'|'fire'|'love' }
  const [tournaments, setTourneys]  = useState([])
  const [communityStats, setStats]  = useState(null)
  const [filter, setFilter]         = useState('all')
  const [isLoading, setLoading]     = useState(true)
  const [composeOpen, setCompose]   = useState(false)
  const channelRef                  = useRef(null)

  const isStaff = profile?.role === 'manager' || profile?.isCoach

  useEffect(() => {
    if (!clubId || !user?.id) return
    loadAll()
    subscribeRealtime()
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [clubId, user?.id])

  async function loadAll() {
    setLoading(true)
    const [
      { data: postsData },
      { data: reactData },
      { data: tourneyData },
    ] = await Promise.all([
      supabase
        .from('feed_posts')
        .select('*, tournaments(id,title,format,status,start_date,max_participants,club_id)')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false })
        .limit(60),
      supabase
        .from('feed_likes')
        .select('post_id, reaction_type')
        .eq('user_id', user.id),
      supabase
        .from('tournaments')
        .select('id,title,format,status,start_date,club_id,clubs(name)')
        .in('status', ['upcoming','open','registration','in_progress'])
        .order('start_date', { ascending: true })
        .limit(4),
    ])

    setPosts(postsData || [])
    const reactMap = {}
    ;(reactData || []).forEach((r) => { reactMap[r.post_id] = r.reaction_type })
    setMyReact(reactMap)
    setTourneys(tourneyData || [])

    // Community counts
    const [{ count: pc }, { count: cc }, { count: tc }] = await Promise.all([
      supabase.from('players').select('*', { count: 'exact', head: true }),
      supabase.from('clubs').select('*', { count: 'exact', head: true }),
      supabase.from('tournaments').select('*', { count: 'exact', head: true }),
    ])
    setStats({ players: pc || 0, clubs: cc || 0, tournaments: tc || 0 })

    setLoading(false)
  }

  function subscribeRealtime() {
    const ch = supabase
      .channel(`feed:${clubId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feed_posts', filter: `club_id=eq.${clubId}` },
        (payload) => setPosts((prev) => [payload.new, ...prev]),
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'feed_posts' },
        (payload) => setPosts((prev) => prev.filter((p) => p.id !== payload.old.id)),
      )
      .subscribe()
    channelRef.current = ch
  }

  async function react(postId, type) {
    if (!user?.id) return
    const current = myReactions[postId]
    const countKey = (t) => t === 'like' ? 'likes_count' : t === 'fire' ? 'fire_count' : 'love_count'

    // Optimistic update
    setMyReact((prev) => {
      const next = { ...prev }
      if (current === type) { delete next[postId] } else { next[postId] = type }
      return next
    })
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p
      const updated = { ...p }
      if (current) updated[countKey(current)] = Math.max((updated[countKey(current)] || 0) - 1, 0)
      if (current !== type) updated[countKey(type)] = (updated[countKey(type)] || 0) + 1
      return updated
    }))

    // DB operations
    if (current) {
      await supabase.from('feed_likes').delete().eq('post_id', postId).eq('user_id', user.id)
    }
    if (current !== type) {
      await supabase.from('feed_likes').insert({ post_id: postId, user_id: user.id, reaction_type: type })
    }
  }

  async function deletePost(postId) {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
    await supabase.from('feed_posts').delete().eq('id', postId)
  }

  const filteredPosts = filter === 'all' ? posts : posts.filter((p) => p.type === filter)
  const upcomingEvents = posts
    .filter((p) => p.type === 'event' && p.event_date && new Date(p.event_date) >= new Date())
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    .slice(0, 5)

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_300px]">

      {/* ── Main feed ── */}
      <div className="min-w-0">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-open-ink">Feed Social</h1>
            <p className="mt-0.5 text-xs text-open-muted">Eventos, torneos y noticias del club</p>
          </div>
          {isStaff && (
            <button
              type="button"
              onClick={() => setCompose(true)}
              className="flex items-center gap-2 bg-open-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Plus size={15} strokeWidth={2.5} />
              Nueva publicación
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="mb-4 flex gap-0 border-b border-open-light">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={[
                'px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] transition',
                filter === f.key
                  ? 'border-b-2 border-open-primary text-open-ink'
                  : 'text-open-muted hover:text-open-ink',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Posts */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <SkeletonPost key={i} />)}
          </div>
        ) : filteredPosts.length === 0 ? (
          <EmptyState filter={filter} isStaff={isStaff} onCompose={() => setCompose(true)} />
        ) : (
          <div className="divide-y divide-open-light">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                myReaction={myReactions[post.id]}
                isOwn={post.author_id === user?.id}
                onReact={(type) => react(post.id, type)}
                onDelete={() => deletePost(post.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Right sidebar ── */}
      <aside className="hidden xl:block space-y-5">

        {/* Upcoming events */}
        {upcomingEvents.length > 0 && (
          <SidebarCard title="Eventos Próximos">
            <div className="divide-y divide-open-light">
              {upcomingEvents.map((ev) => {
                const d = new Date(ev.event_date)
                return (
                  <div key={ev.id} className="flex items-center gap-3 py-3">
                    <div className="flex w-9 shrink-0 flex-col items-center rounded bg-open-bg py-1 text-center">
                      <span className="text-[9px] font-bold uppercase text-open-primary">
                        {d.toLocaleDateString('es', { month: 'short' })}
                      </span>
                      <span className="text-base font-black leading-tight text-open-ink">
                        {d.getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-open-ink">{ev.event_title}</p>
                      <p className="text-[11px] text-open-muted">
                        {d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                        {ev.event_location ? ` · ${ev.event_location}` : ''}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </SidebarCard>
        )}

        {/* Featured tournaments */}
        {tournaments.length > 0 && (
          <SidebarCard title="Torneos Destacados" action={{ label: 'Ver todos', to: '/tournaments' }}>
            <div className="space-y-3 pt-1">
              {tournaments.map((t) => {
                const open = ['open','registration'].includes(t.status)
                const initials = (t.title || 'T').charAt(0).toUpperCase()
                return (
                  <a key={t.id} href="/tournaments" className="flex items-center gap-3 rounded transition hover:bg-open-bg p-1 -mx-1">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded bg-open-light text-sm font-black text-open-ink">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      {open && (
                        <span className="mb-0.5 inline-block rounded-sm bg-emerald-100 px-1.5 py-px text-[9px] font-bold uppercase text-emerald-700">
                          Inscripciones abiertas
                        </span>
                      )}
                      <p className="truncate text-xs font-semibold text-open-ink">{t.title}</p>
                      {t.start_date && (
                        <p className="text-[11px] text-open-muted">
                          {formatShortDate(t.start_date)} · {t.clubs?.name || ''}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={13} className="shrink-0 text-open-muted" />
                  </a>
                )
              })}
            </div>
          </SidebarCard>
        )}

        {/* Community stats */}
        {communityStats && (
          <SidebarCard title="Comunidad OPEN">
            <div className="grid grid-cols-3 gap-2 pt-1">
              <StatPill icon={Users} label="Jugadores" value={communityStats.players} />
              <StatPill icon={Trophy} label="Torneos" value={communityStats.tournaments} />
              <StatPill icon={Newspaper} label="Clubes" value={communityStats.clubs} />
            </div>
          </SidebarCard>
        )}
      </aside>

      {/* Compose modal */}
      {composeOpen && (
        <ComposeModal
          clubId={clubId}
          authorId={user?.id}
          authorName={profile?.fullName || 'Staff'}
          authorRole={profile?.role === 'manager' ? 'manager' : 'coach'}
          tournaments={tournaments}
          onClose={() => setCompose(false)}
          onPosted={(post) => {
            // Enrich with tournament data we already loaded
            const enriched =
              post.type === 'tournament_share' && post.tournament_id
                ? { ...post, tournaments: tournaments.find((t) => t.id === post.tournament_id) || null }
                : post
            setPosts((prev) => [enriched, ...prev])
            setCompose(false)
          }}
        />
      )}
    </div>
  )
}

// ─── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post, myReaction, isOwn, onReact, onDelete }) {
  const [confirmDel, setConfirmDel] = useState(false)
  const meta = TYPE_META[post.type] || TYPE_META.post
  const Icon = meta.icon

  return (
    <article className="flex gap-3 py-4 sm:gap-4">
      {/* Type icon circle */}
      <div className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${meta.color}`}>
        <Icon size={16} strokeWidth={2} className="text-white" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${meta.text}`}>
              {meta.label}
            </span>
            <span className="text-[11px] text-open-muted">{relativeTime(post.created_at)}</span>
            {isOwn && !confirmDel && (
              <button
                type="button"
                onClick={() => setConfirmDel(true)}
                className="ml-auto text-open-muted transition hover:text-red-500"
              >
                <Trash2 size={13} strokeWidth={1.8} />
              </button>
            )}
            {isOwn && confirmDel && (
              <span className="ml-auto flex items-center gap-2 text-xs">
                <button type="button" onClick={onDelete} className="font-semibold text-red-500 hover:underline">Borrar</button>
                <button type="button" onClick={() => setConfirmDel(false)} className="text-open-muted hover:underline">No</button>
              </span>
            )}
          </div>

          {/* Title */}
          {(post.event_title || post.type === 'event') && (
            <h3 className="mt-0.5 text-base font-bold leading-snug text-open-ink">
              {post.event_title || post.content}
            </h3>
          )}
          {post.type !== 'event' && post.content && (
            <p className="mt-0.5 text-sm font-semibold leading-snug text-open-ink line-clamp-2">
              {post.content}
            </p>
          )}
          {post.type === 'event' && post.content && (
            <p className="mt-1 text-xs leading-relaxed text-open-muted line-clamp-2">{post.content}</p>
          )}

          {/* Event meta */}
          {post.type === 'event' && (post.event_date || post.event_location) && (
            <div className="mt-1.5 flex flex-wrap gap-3">
              {post.event_date && (
                <span className="flex items-center gap-1 text-[11px] text-open-muted">
                  <Calendar size={11} strokeWidth={2} />
                  {formatEventDateTime(post.event_date)}
                </span>
              )}
              {post.event_location && (
                <span className="flex items-center gap-1 text-[11px] text-open-muted">
                  <MapPin size={11} strokeWidth={2} />
                  {post.event_location}
                </span>
              )}
            </div>
          )}

          {/* Tournament share block */}
          {post.type === 'tournament_share' && post.tournaments && (
            <MiniTournamentCard tournament={post.tournaments} />
          )}

          {/* Full-width image with gradient */}
          {post.image_url && (
            <div className="relative mt-3 overflow-hidden rounded-sm" style={{ maxHeight: 320 }}>
              <img
                src={post.image_url}
                alt=""
                className="w-full object-cover"
                style={{ maxHeight: 320 }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
            </div>
          )}

        {/* Reactions */}
        <div className="mt-3 flex items-center gap-3">
          <ReactionBtn
            icon={ThumbsUp}
            count={post.likes_count || 0}
            active={myReaction === 'like'}
            activeColor="text-blue-500"
            onClick={() => onReact('like')}
          />
          <ReactionBtn
            icon={Flame}
            count={post.fire_count || 0}
            active={myReaction === 'fire'}
            activeColor="text-orange-500"
            onClick={() => onReact('fire')}
          />
          <ReactionBtn
            icon={Heart}
            count={post.love_count || 0}
            active={myReaction === 'love'}
            activeColor="text-rose-500"
            onClick={() => onReact('love')}
          />
        </div>
      </div>
    </article>
  )
}

function ReactionBtn({ icon: Icon, count, active, activeColor, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 text-xs font-semibold transition',
        active ? activeColor : 'text-open-muted hover:text-open-ink',
      ].join(' ')}
    >
      <Icon
        size={14}
        strokeWidth={active ? 0 : 1.8}
        fill={active ? 'currentColor' : 'none'}
      />
      {count > 0 ? count : ''}
    </button>
  )
}

function MiniTournamentCard({ tournament }) {
  const open = ['open','registration'].includes(tournament.status)
  return (
    <a
      href="/tournaments"
      className="mt-2 flex items-center gap-3 border border-open-light bg-open-bg px-3 py-2.5 transition hover:border-open-primary"
    >
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded bg-violet-100 text-sm font-black text-violet-700">
        {(tournament.title || 'T').charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-open-ink">{tournament.title}</p>
        {tournament.start_date && (
          <p className="text-[11px] text-open-muted">{formatShortDate(tournament.start_date)}</p>
        )}
      </div>
      {open && (
        <span className="shrink-0 rounded-sm bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
          Inscribirme
        </span>
      )}
    </a>
  )
}

// ─── Sidebar helpers ──────────────────────────────────────────────────────────

function SidebarCard({ title, action, children }) {
  return (
    <div className="border border-open-light bg-open-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.18em] text-open-muted">{title}</h2>
        {action && (
          <a href={action.to} className="text-[11px] font-semibold text-open-primary hover:underline">
            {action.label} →
          </a>
        )}
      </div>
      {children}
    </div>
  )
}

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded border border-open-light bg-open-bg py-3">
      <Icon size={15} strokeWidth={1.8} className="text-open-muted" />
      <span className="text-base font-black text-open-ink">{value?.toLocaleString() ?? '—'}</span>
      <span className="text-[10px] text-open-muted">{label}</span>
    </div>
  )
}

// ─── Compose modal ────────────────────────────────────────────────────────────

const POST_TYPES = [
  { key: 'post',             label: 'Comunidad', icon: Users    },
  { key: 'event',            label: 'Evento',    icon: Calendar },
  { key: 'tournament_share', label: 'Torneo',    icon: Trophy   },
  { key: 'achievement',      label: 'Logro',     icon: Award    },
]

function ComposeModal({ clubId, authorId, authorName, authorRole, tournaments, onClose, onPosted }) {
  const [type, setType]           = useState('post')
  const [content, setContent]     = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setPreview]= useState('')
  const [tourneyId, setTourney]   = useState('')
  const [evTitle, setEvTitle]     = useState('')
  const [evDate, setEvDate]       = useState('')
  const [evLoc, setEvLoc]         = useState('')
  const [sending, setSending]     = useState(false)
  const [error, setError]         = useState('')
  const fileInputRef              = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Selecciona una imagen.'); return }
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  function removeImage() {
    setImageFile(null)
    setPreview('')
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!clubId) { setError('No se encontró el club. Recarga la página.'); return }
    if (!content.trim() && type !== 'event' && type !== 'tournament_share') {
      setError('Escribe algo para publicar.')
      return
    }
    if (type === 'tournament_share' && !tourneyId) {
      setError('Selecciona un torneo.')
      return
    }
    if (type === 'event' && !evTitle.trim()) {
      setError('El evento necesita un título.')
      return
    }

    setSending(true)

    // Upload image file if selected
    let finalImageUrl = null
    if (imageFile && authorId) {
      const ext  = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${authorId}/feed/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('profile-avatars')
        .upload(path, imageFile, { cacheControl: '3600', contentType: imageFile.type, upsert: true })
      if (upErr) {
        setError(`Error subiendo imagen: ${upErr.message}`)
        setSending(false)
        return
      }
      const { data: urlData } = supabase.storage.from('profile-avatars').getPublicUrl(path)
      finalImageUrl = urlData.publicUrl
    }

    const payload = {
      club_id:        clubId,
      author_id:      authorId,
      author_name:    authorName,
      author_role:    authorRole,
      type,
      content:        content.trim() || null,
      image_url:      finalImageUrl,
      tournament_id:  type === 'tournament_share' ? tourneyId || null : null,
      event_title:    type === 'event' ? evTitle.trim() || null : type === 'achievement' ? content.trim() || null : null,
      event_date:     type === 'event' && evDate ? new Date(evDate).toISOString() : null,
      event_location: type === 'event' ? evLoc.trim() || null : null,
    }

    const { data, error: dbErr } = await supabase
      .from('feed_posts')
      .insert(payload)
      .select('*')
      .single()

    setSending(false)
    if (dbErr) {
      setError(`Error al publicar: ${dbErr.message}`)
      return
    }
    onPosted(data)
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-x-4 bottom-0 top-auto z-50 mx-auto max-w-lg rounded-t-xl border border-open-light bg-open-surface p-5 shadow-2xl sm:inset-x-auto sm:inset-y-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:p-6">
        {/* Modal header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-open-muted">Nueva publicación</h2>
          <button type="button" onClick={onClose} className="text-open-muted hover:text-open-ink">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

        <form onSubmit={submit} className="space-y-4">
          {/* Type selector */}
          <div className="grid grid-cols-4 gap-1.5">
            {POST_TYPES.map(({ key, label, icon: Ic }) => {
              const m = TYPE_META[key]
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key)}
                  className={[
                    'flex flex-col items-center gap-1 rounded border py-2.5 text-[10px] font-bold uppercase tracking-wide transition',
                    type === key
                      ? `border-transparent ${m.color} text-white`
                      : 'border-open-light text-open-muted hover:border-open-ink',
                  ].join(' ')}
                >
                  <Ic size={14} strokeWidth={2} />
                  {label}
                </button>
              )
            })}
          </div>

          {/* Event fields */}
          {type === 'event' && (
            <>
              <input
                value={evTitle}
                onChange={(e) => setEvTitle(e.target.value)}
                placeholder="Título del evento *"
                required
                className="field"
              />
              <div className="grid grid-cols-2 gap-2">
                <input type="datetime-local" value={evDate} onChange={(e) => setEvDate(e.target.value)} className="field" />
                <input value={evLoc} onChange={(e) => setEvLoc(e.target.value)} placeholder="Ubicación" className="field" />
              </div>
            </>
          )}

          {/* Tournament picker */}
          {type === 'tournament_share' && (
            <select value={tourneyId} onChange={(e) => setTourney(e.target.value)} required className="field">
              <option value="">Seleccionar torneo…</option>
              {tournaments.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          )}

          {/* Content */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              type === 'event'            ? 'Descripción del evento (opcional)…' :
              type === 'tournament_share' ? 'Mensaje para acompañar el torneo…' :
              type === 'achievement'      ? 'Describe el logro…' :
                                           'Escribe algo para el club…'
            }
            rows={3}
            className="field resize-none"
          />

          {/* Image upload */}
          {imagePreview ? (
            <div className="relative overflow-hidden rounded-sm">
              <img src={imagePreview} alt="" className="max-h-48 w-full object-cover" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 border border-dashed border-open-light py-3 text-xs font-semibold text-open-muted transition hover:border-open-ink hover:text-open-ink"
            >
              <Camera size={14} strokeWidth={1.8} />
              Agregar foto
            </button>
          )}

          {error && (
            <p className="rounded bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="flex w-full items-center justify-center gap-2 bg-open-primary py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <Send size={14} strokeWidth={2} />
            {sending ? 'Publicando…' : 'Publicar'}
          </button>
        </form>
      </div>
    </>
  )
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

function EmptyState({ filter, isStaff, onCompose }) {
  const msg = filter === 'all'
    ? isStaff ? 'Sé el primero en publicar.' : 'El club aún no tiene publicaciones.'
    : 'No hay publicaciones en esta categoría.'

  return (
    <div className="py-16 text-center">
      <MessageSquare size={36} strokeWidth={1.4} className="mx-auto text-open-light" />
      <p className="mt-3 font-semibold text-open-ink">Nada por aquí</p>
      <p className="mt-1 text-sm text-open-muted">{msg}</p>
      {isStaff && (
        <button
          type="button"
          onClick={onCompose}
          className="mt-4 inline-flex items-center gap-2 bg-open-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus size={14} strokeWidth={2.5} /> Publicar ahora
        </button>
      )}
    </div>
  )
}

function SkeletonPost() {
  return (
    <div className="flex gap-4 py-4 animate-pulse">
      <div className="h-9 w-9 shrink-0 rounded-full bg-open-light" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-16 rounded bg-open-light" />
        <div className="h-4 w-2/3 rounded bg-open-light" />
        <div className="h-3 w-full rounded bg-open-light" />
        <div className="h-3 w-1/2 rounded bg-open-light" />
      </div>
    </div>
  )
}
