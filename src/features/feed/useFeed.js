import { useContext } from 'react'
import { FeedContext } from './feedContext'

export function useFeed() {
  const ctx = useContext(FeedContext)
  if (!ctx) throw new Error('useFeed must be used inside FeedProvider')
  return ctx
}
