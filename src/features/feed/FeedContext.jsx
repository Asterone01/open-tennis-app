import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import usePlayerProfile from '../profile/usePlayerProfile'
import useManagerClub from '../../hooks/useManagerClub'

const FeedContext = createContext(null)

export function FeedProvider({ children }) {
  const { profile, user }         = usePlayerProfile()
  const { clubId: managerClubId } = useManagerClub()
  const clubId = profile?.clubId || managerClubId

  const [posts, setPosts]         = useState([])
  const [myReactions, setMyReact] = useState({})
  const [tournaments, setTourneys]= useState([])
  const [communityStats, setStats]= useState(null)
  const [isLoading, setLoading]   = useState(false)

  const channelRef   = useRef(null)
  const tourneysRef  = useRef([])
  const loadedClub   = useRef(null)

  useEffect(() => {
    if (!clubId || !user?.id) return
    // Don't reload if already loaded for this club
    if (loadedClub.current === clubId) return

    loadedClub.current = clubId
    loadAll()
    subscribeRealtime()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
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
        .in('status', ['upcoming', 'open', 'registration', 'in_progress'])
        .order('start_date', { ascending: true })
        .limit(4),
    ])

    setPosts(postsData || [])

    const reactMap = {}
    ;(reactData || []).forEach((r) => { reactMap[r.post_id] = r.reaction_type })
    setMyReact(reactMap)

    tourneysRef.current = tourneyData || []
    setTourneys(tourneyData || [])

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
        (payload) => {
          const incoming = payload.new
          const enriched =
            incoming.type === 'tournament_share' && incoming.tournament_id
              ? { ...incoming, tournaments: tourneysRef.current.find((t) => t.id === incoming.tournament_id) || null }
              : incoming
          setPosts((prev) => {
            if (prev.some((p) => p.id === enriched.id)) return prev
            return [enriched, ...prev]
          })
        },
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

  function addPost(post) {
    const enriched =
      post.type === 'tournament_share' && post.tournament_id
        ? { ...post, tournaments: tourneysRef.current.find((t) => t.id === post.tournament_id) || null }
        : post
    setPosts((prev) => [enriched, ...prev])
  }

  return (
    <FeedContext.Provider value={{
      posts, myReactions, tournaments, communityStats, isLoading,
      userId: user?.id,
      react, deletePost, addPost,
    }}>
      {children}
    </FeedContext.Provider>
  )
}

export function useFeed() {
  const ctx = useContext(FeedContext)
  if (!ctx) throw new Error('useFeed must be used inside FeedProvider')
  return ctx
}
