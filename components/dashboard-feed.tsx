'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Loader2, Users, Star, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { FeedCard } from '@/components/feed-card'
import type { PlayReport } from '@/lib/types'

const PAGE_SIZE = 10

const REPORT_SELECT = `
  *,
  profile:profiles!play_reports_user_id_fkey(id, username, display_name, avatar_url),
  participants:play_report_participants(*, profile:profiles(id, username, display_name, avatar_url)),
  likes:likes(id)
`

interface FeedItem {
  type: 'post' | 'ad-slot'
  report?: PlayReport
  source?: 'friend' | 'following' | 'recommended'
}

interface DashboardFeedProps {
  initialFriendReports: PlayReport[]
  initialFollowingReports: PlayReport[]
  recommendedReports: PlayReport[]
  friendIds: string[]
  streamerIds: string[]
  userId: string
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function buildFeed(
  friendReports: PlayReport[],
  followingReports: PlayReport[],
  recommended: PlayReport[]
): FeedItem[] {
  // Tag and merge friend + following reports
  const tagged: FeedItem[] = []
  const seenIds = new Set<string>()

  const friendItems: FeedItem[] = friendReports.map(r => ({
    type: 'post' as const,
    report: r,
    source: 'friend' as const,
  }))
  const followingItems: FeedItem[] = followingReports.map(r => ({
    type: 'post' as const,
    report: r,
    source: 'following' as const,
  }))

  // Merge and sort by play_date_start descending
  const chronological = [...friendItems, ...followingItems].sort((a, b) => {
    const dateA = new Date(a.report!.play_date_start || a.report!.created_at).getTime()
    const dateB = new Date(b.report!.play_date_start || b.report!.created_at).getTime()
    return dateB - dateA
  })

  // Deduplicate
  for (const item of chronological) {
    if (!seenIds.has(item.report!.id)) {
      seenIds.add(item.report!.id)
      tagged.push(item)
    }
  }

  // Shuffle recommended and insert every ~4-5 items
  const shuffledRec = shuffleArray(recommended.filter(r => !seenIds.has(r.id)))
  let recIdx = 0
  const result: FeedItem[] = []
  let postCount = 0

  for (const item of tagged) {
    result.push(item)
    postCount++

    // Insert a recommended post every 4-5 chronological items
    if (postCount % 4 === 0 && recIdx < shuffledRec.length) {
      result.push({
        type: 'post',
        report: shuffledRec[recIdx],
        source: 'recommended',
      })
      seenIds.add(shuffledRec[recIdx].id)
      recIdx++
    }

    // Insert ad slot every 8 posts
    if (postCount % 8 === 0) {
      result.push({ type: 'ad-slot' })
    }
  }

  // If we have no chronological items, show recommended only
  if (tagged.length === 0) {
    for (const r of shuffledRec) {
      result.push({ type: 'post', report: r, source: 'recommended' })
    }
  }

  return result
}

export function DashboardFeed({
  initialFriendReports,
  initialFollowingReports,
  recommendedReports,
  friendIds,
  streamerIds,
  userId,
}: DashboardFeedProps) {
  const [allFriendReports, setAllFriendReports] = useState(initialFriendReports)
  const [allFollowingReports, setAllFollowingReports] = useState(initialFollowingReports)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [friendOffset, setFriendOffset] = useState(initialFriendReports.length)
  const [followingOffset, setFollowingOffset] = useState(initialFollowingReports.length)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Check if there could be more data
  const [friendExhausted, setFriendExhausted] = useState(
    initialFriendReports.length < PAGE_SIZE || friendIds.length === 0
  )
  const [followingExhausted, setFollowingExhausted] = useState(
    initialFollowingReports.length < PAGE_SIZE || streamerIds.length === 0
  )

  const feedItems = useMemo(
    () => buildFeed(allFriendReports, allFollowingReports, recommendedReports),
    [allFriendReports, allFollowingReports, recommendedReports]
  )

  const loadMore = useCallback(async () => {
    if (loading || (!hasMore)) return
    if (friendExhausted && followingExhausted) {
      setHasMore(false)
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      let newFriendReports: PlayReport[] = []
      let newFollowingReports: PlayReport[] = []

      // Fetch next page of friend reports
      if (!friendExhausted && friendIds.length > 0) {
        const { data } = await supabase
          .from('play_reports')
          .select(REPORT_SELECT)
          .in('user_id', friendIds)
          .in('privacy_setting', ['public', 'followers'])
          .order('play_date_start', { ascending: false })
          .range(friendOffset, friendOffset + PAGE_SIZE - 1)

        newFriendReports = (data || []).map(r => ({
          ...r,
          likes_count: r.likes?.length || 0,
        })) as PlayReport[]

        if (newFriendReports.length < PAGE_SIZE) {
          setFriendExhausted(true)
        }
        setFriendOffset(prev => prev + newFriendReports.length)
      }

      // Fetch next page of following/streamer reports
      if (!followingExhausted && streamerIds.length > 0) {
        const { data } = await supabase
          .from('play_reports')
          .select(REPORT_SELECT)
          .in('user_id', streamerIds)
          .eq('privacy_setting', 'public')
          .order('play_date_start', { ascending: false })
          .range(followingOffset, followingOffset + PAGE_SIZE - 1)

        newFollowingReports = (data || []).map(r => ({
          ...r,
          likes_count: r.likes?.length || 0,
        })) as PlayReport[]

        if (newFollowingReports.length < PAGE_SIZE) {
          setFollowingExhausted(true)
        }
        setFollowingOffset(prev => prev + newFollowingReports.length)
      }

      if (newFriendReports.length === 0 && newFollowingReports.length === 0) {
        setHasMore(false)
      } else {
        setAllFriendReports(prev => [...prev, ...newFriendReports])
        setAllFollowingReports(prev => [...prev, ...newFollowingReports])
      }
    } catch (error) {
      console.error('Feed load error:', error)
    } finally {
      setLoading(false)
    }
  }, [
    loading, hasMore, friendExhausted, followingExhausted,
    friendIds, streamerIds, friendOffset, followingOffset,
  ])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore()
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, loadMore])

  // Empty state
  if (feedItems.length === 0 && !loading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="py-12 text-center space-y-4">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/40" />
          <div>
            <p className="text-muted-foreground font-medium">タイムラインに表示するコンテンツがありません</p>
            <p className="text-sm text-muted-foreground mt-1">
              ユーザーをフォローしたり、フレンドを追加するとセッション記録がここに表示されます
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link href="/search">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Users className="w-4 h-4" />
                ユーザーを探す
              </Button>
            </Link>
            <Link href="/search?tab=streamers">
              <Button variant="outline" className="gap-2 bg-transparent">
                <TrendingUp className="w-4 h-4" />
                配信者を探す
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="border-x border-border/50 overflow-hidden">
      {feedItems.map((item, idx) => {
        if (item.type === 'ad-slot') {
          return <div key={`ad-${idx}`} data-slot="ad" className="hidden" />
        }
        if (item.type === 'post' && item.report) {
          return (
            <FeedCard
              key={item.report.id}
              report={item.report}
              source={item.source}
            />
          )
        }
        return null
      })}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* End of feed */}
      {!hasMore && feedItems.length > 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground border-t border-border/50">
          すべての投稿を表示しました
        </div>
      )}
    </div>
  )
}
