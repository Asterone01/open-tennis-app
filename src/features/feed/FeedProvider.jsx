import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import useManagerClub from '../../hooks/useManagerClub'
import usePlayerProfile from '../profile/usePlayerProfile'
import { FeedContext } from './feedContext'

function mergePost(prev, incoming, tournaments) {
  const enriched =
    incoming.type === 'tournament_share' && incoming.tournament_id
      ? {
          ...incoming,
          tournaments:
            incoming.tournaments ||
            tournaments.find((t) => t.id === incoming.tournament_id) ||
            null,
        }
      : incoming

  const exists = prev.some((post) => post.id === enriched.id)
  const next = exists
    ? prev.map((post) => (post.id === enriched.id ? { ...post, ...enriched } : post))
    : [enriched, ...prev]

  return next.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export default function FeedProvider({ children }) {
  const { profile, user, isLoading: profileLoading } = usePlayerProfile()
  const { clubId: managerClubId, isLoading: managerClubLoading } = useManagerClub()
  const clubId = profile?.clubId || managerClubId
  const userId = user?.id

  const [posts, setPosts] = useState([])
  const [myReactions, setMyReactions] = useState({})
  const [tournaments, setTournaments] = useState([])
  const [communityStats, setCommunityStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const channelRef = useRef(null)
  const tournamentsRef = useRef([])

  const loadAll = useCallback(async () => {
    if (!clubId || !userId) {
      setPosts([])
      setMyReactions({})
      setTournaments([])
      setCommunityStats(null)
      setIsLoading(profileLoading || managerClubLoading)
      return
    }

    setIsLoading(true)
    setError('')

    const [postsRes, reactionsRes, tournamentsRes, playersCount, clubsCount, tournamentsCount] =
      await Promise.all([
        supabase
          .from('feed_posts')
          .select('*, tournaments(id,title,format,status,start_date,max_players,club_id)')
          .eq('club_id', clubId)
          .order('created_at', { ascending: false })
          .limit(60),
        supabase
          .from('feed_likes')
          .select('post_id, reaction_type')
          .eq('user_id', userId),
        supabase
          .from('tournaments')
          .select('id,title,format,status,start_date,club_id,clubs(name)')
          .in('status', ['upcoming', 'open', 'registration', 'in_progress'])
          .order('start_date', { ascending: true })
          .limit(4),
        supabase.from('players').select('*', { count: 'exact', head: true }),
        supabase.from('clubs').select('*', { count: 'exact', head: true }),
        supabase.from('tournaments').select('*', { count: 'exact', head: true }),
      ])

    if (postsRes.error) {
      setError(postsRes.error.message)
      setPosts([])
      setMyReactions({})
      setIsLoading(false)
      return
    }

    tournamentsRef.current = tournamentsRes.error ? [] : tournamentsRes.data || []
    setTournaments(tournamentsRef.current)
    setPosts(postsRes.data || [])

    const reactionMap = {}
    ;(reactionsRes.error ? [] : reactionsRes.data || []).forEach((reaction) => {
      reactionMap[reaction.post_id] = reaction.reaction_type
    })
    setMyReactions(reactionMap)

    setCommunityStats({
      players: playersCount.error ? 0 : playersCount.count || 0,
      clubs: clubsCount.error ? 0 : clubsCount.count || 0,
      tournaments: tournamentsCount.error ? 0 : tournamentsCount.count || 0,
    })
    setIsLoading(false)
  }, [clubId, managerClubLoading, profileLoading, userId])

  useEffect(() => {
    let cancelled = false

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const loadTimer = window.setTimeout(() => {
      loadAll()
    }, 0)

    if (!clubId || !userId) {
      return () => {
        window.clearTimeout(loadTimer)
      }
    }

    const channel = supabase
      .channel(`feed:${clubId}:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feed_posts', filter: `club_id=eq.${clubId}` },
        (payload) => {
          if (cancelled) return
          setPosts((current) => mergePost(current, payload.new, tournamentsRef.current))
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'feed_posts', filter: `club_id=eq.${clubId}` },
        (payload) => {
          if (cancelled) return
          setPosts((current) => mergePost(current, payload.new, tournamentsRef.current))
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'feed_posts' },
        (payload) => {
          if (cancelled) return
          setPosts((current) => current.filter((post) => post.id !== payload.old.id))
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          setError('No se pudo abrir el feed en tiempo real. Revisa la publicacion realtime del SQL.')
        }
      })

    channelRef.current = channel

    return () => {
      cancelled = true
      window.clearTimeout(loadTimer)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [clubId, loadAll, userId])

  const react = useCallback(async (postId, type) => {
    if (!userId) return
    const current = myReactions[postId]
    const countKey = (reactionType) =>
      reactionType === 'like' ? 'likes_count' : reactionType === 'fire' ? 'fire_count' : 'love_count'

    setMyReactions((prev) => {
      const next = { ...prev }
      if (current === type) delete next[postId]
      else next[postId] = type
      return next
    })

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post
        const updated = { ...post }
        if (current) {
          updated[countKey(current)] = Math.max((updated[countKey(current)] || 0) - 1, 0)
        }
        if (current !== type) {
          updated[countKey(type)] = (updated[countKey(type)] || 0) + 1
        }
        return updated
      }),
    )

    if (current) {
      const { error: deleteError } = await supabase
        .from('feed_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)
      if (deleteError) setError(deleteError.message)
    }

    if (current !== type) {
      const { error: insertError } = await supabase
        .from('feed_likes')
        .insert({ post_id: postId, user_id: userId, reaction_type: type })
      if (insertError) setError(insertError.message)
    }
  }, [myReactions, userId])

  const deletePost = useCallback(async (postId) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId))
    const { error: deleteError } = await supabase.from('feed_posts').delete().eq('id', postId)
    if (deleteError) {
      setError(deleteError.message)
      loadAll()
    }
  }, [loadAll])

  const addPost = useCallback((post) => {
    setPosts((prev) => mergePost(prev, post, tournamentsRef.current))
  }, [])

  const value = useMemo(
    () => ({
      posts,
      myReactions,
      tournaments,
      communityStats,
      isLoading,
      error,
      userId,
      reloadFeed: loadAll,
      react,
      deletePost,
      addPost,
    }),
    [
      addPost,
      communityStats,
      deletePost,
      error,
      isLoading,
      loadAll,
      myReactions,
      posts,
      react,
      tournaments,
      userId,
    ],
  )

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>
}
