'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users,
  UserPlus,
  Star,
  Loader2,
  UserCheck,
  Search,
  BookOpen,
  ChevronRight,
  Check,
  X,
  Clock,
} from 'lucide-react'
import { TierBadge } from '@/components/tier-badge'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Profile, PlayReport } from '@/lib/types'

interface FriendWithReports extends Profile {
  recentReports: PlayReport[]
}

interface PendingRequest {
  id: string
  from_user: Profile
  created_at: string
}

type TabType = 'friends' | 'following' | 'requests'

function formatTimeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const diffMin = Math.floor(diffMs / (1000 * 60))
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  if (diffMin < 60) return `${diffMin}分前`
  if (diffHour < 24) return `${diffHour}時間前`
  if (diffDay < 7) return `${diffDay}日前`
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}週間前`
  return `${Math.floor(diffDay / 30)}ヶ月前`
}

export default function SocialPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [friends, setFriends] = useState<FriendWithReports[]>([])
  const [following, setFollowing] = useState<FriendWithReports[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('friends')
  const [searchQuery, setSearchQuery] = useState('')
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)

  useEffect(() => {
    async function loadSocialData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      setCurrentUserId(user.id)

      // Fetch users I follow
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      const followingIds = followingData?.map(f => f.following_id) || []

      // Fetch users who follow me
      const { data: followerData } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', user.id)

      const followerIds = followerData?.map(f => f.follower_id) || []

      // Friends = mutual follows
      const friendIds = followingIds.filter(id => followerIds.includes(id))

      // Following only (not mutual)
      const followingOnlyIds = followingIds.filter(id => !followerIds.includes(id))

      // Fetch friend profiles with recent reports
      if (friendIds.length > 0) {
        const { data: friendProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', friendIds)

        if (friendProfiles) {
          // Batch fetch recent reports for all friends
          const { data: allReports } = await supabase
            .from('play_reports')
            .select('id, user_id, scenario_name, created_at')
            .in('user_id', friendIds)
            .order('created_at', { ascending: false })
            .limit(friendIds.length * 3)

          const reportsByUser = new Map<string, PlayReport[]>()
          allReports?.forEach(r => {
            const existing = reportsByUser.get(r.user_id) || []
            if (existing.length < 3) {
              existing.push(r as PlayReport)
              reportsByUser.set(r.user_id, existing)
            }
          })

          setFriends(
            friendProfiles.map(p => ({
              ...p,
              recentReports: reportsByUser.get(p.id) || [],
            })) as FriendWithReports[]
          )
        }
      }

      // Fetch following profiles
      if (followingOnlyIds.length > 0) {
        const { data: followingProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', followingOnlyIds)

        if (followingProfiles) {
          const { data: allReports } = await supabase
            .from('play_reports')
            .select('id, user_id, scenario_name, created_at')
            .in('user_id', followingOnlyIds)
            .order('created_at', { ascending: false })
            .limit(followingOnlyIds.length * 3)

          const reportsByUser = new Map<string, PlayReport[]>()
          allReports?.forEach(r => {
            const existing = reportsByUser.get(r.user_id) || []
            if (existing.length < 3) {
              existing.push(r as PlayReport)
              reportsByUser.set(r.user_id, existing)
            }
          })

          setFollowing(
            followingProfiles.map(p => ({
              ...p,
              recentReports: reportsByUser.get(p.id) || [],
            })) as FriendWithReports[]
          )
        }
      }

      // Fetch pending friend requests
      const { data: requests } = await supabase
        .from('friend_requests')
        .select(`
          id,
          created_at,
          from_user:profiles!friend_requests_from_user_id_fkey(*)
        `)
        .eq('to_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (requests) {
        setPendingRequests(requests.map(r => ({
          id: r.id,
          from_user: r.from_user as unknown as Profile,
          created_at: r.created_at,
        })))
      }

      setLoading(false)
    }

    loadSocialData()
  }, [])

  // Handle friend request actions
  async function handleAcceptRequest(request: PendingRequest) {
    setProcessingRequest(request.id)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      await supabase
        .from('friend_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', request.id)

      // Create mutual follows
      const { data: e1 } = await supabase
        .from('follows').select('id')
        .eq('follower_id', user.id).eq('following_id', request.from_user.id)
        .maybeSingle()
      if (!e1) await supabase.from('follows').insert({ follower_id: user.id, following_id: request.from_user.id })

      const { data: e2 } = await supabase
        .from('follows').select('id')
        .eq('follower_id', request.from_user.id).eq('following_id', user.id)
        .maybeSingle()
      if (!e2) await supabase.from('follows').insert({ follower_id: request.from_user.id, following_id: user.id })

      // Move to friends list
      setFriends(prev => [...prev, { ...request.from_user, recentReports: [] }])
      setPendingRequests(prev => prev.filter(r => r.id !== request.id))
      toast.success(`${request.from_user.display_name || request.from_user.username}とフレンドになりました`)
    } catch {
      toast.error('エラーが発生しました')
    } finally {
      setProcessingRequest(null)
    }
  }

  async function handleRejectRequest(request: PendingRequest) {
    setProcessingRequest(request.id)
    const supabase = createClient()
    try {
      await supabase
        .from('friend_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', request.id)

      setPendingRequests(prev => prev.filter(r => r.id !== request.id))
      toast.success('フレンド申請を拒否しました')
    } catch {
      toast.error('エラーが発生しました')
    } finally {
      setProcessingRequest(null)
    }
  }

  // Filter by search
  const filteredFriends = useMemo(() => {
    if (!searchQuery) return friends
    const q = searchQuery.toLowerCase()
    return friends.filter(f =>
      f.display_name?.toLowerCase().includes(q) ||
      f.username.toLowerCase().includes(q)
    )
  }, [friends, searchQuery])

  const filteredFollowing = useMemo(() => {
    if (!searchQuery) return following
    const q = searchQuery.toLowerCase()
    return following.filter(f =>
      f.display_name?.toLowerCase().includes(q) ||
      f.username.toLowerCase().includes(q)
    )
  }, [following, searchQuery])

  // Auto-switch to requests tab if there are pending requests
  useEffect(() => {
    if (pendingRequests.length > 0 && friends.length === 0 && following.length === 0) {
      setActiveTab('requests')
    }
  }, [pendingRequests, friends, following])

  if (loading) {
    return (
      <div className="-my-6 max-w-[600px] mx-auto border-x border-border/50 min-h-screen">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
          <h1 className="text-xl font-bold">ソーシャル</h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="-my-6 max-w-[600px] mx-auto border-x border-border/50 min-h-screen">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold">ソーシャル</h1>
        </div>

        {/* Tabs */}
        <div className="flex">
          <TabButton
            active={activeTab === 'friends'}
            onClick={() => setActiveTab('friends')}
            count={friends.length}
          >
            <UserCheck className="w-3.5 h-3.5" />
            フレンド
          </TabButton>
          <TabButton
            active={activeTab === 'following'}
            onClick={() => setActiveTab('following')}
            count={following.length}
          >
            <Star className="w-3.5 h-3.5" />
            フォロー中
          </TabButton>
          {pendingRequests.length > 0 && (
            <TabButton
              active={activeTab === 'requests'}
              onClick={() => setActiveTab('requests')}
              count={pendingRequests.length}
              highlight
            >
              <UserPlus className="w-3.5 h-3.5" />
              申請
            </TabButton>
          )}
        </div>
      </div>

      {/* Search bar — inline, minimal */}
      {activeTab !== 'requests' && (friends.length > 0 || following.length > 0) && (
        <div className="px-4 py-3 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="名前やIDで絞り込み…"
              className="pl-9 bg-muted/50 border-0 rounded-full h-9 text-sm"
            />
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'friends' && (
        <div>
          {filteredFriends.length > 0 ? (
            filteredFriends.map(friend => (
              <PersonRow
                key={friend.id}
                user={friend}
                type="friend"
                onClick={() => router.push(`/user/${friend.username}`)}
              />
            ))
          ) : friends.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title="まだフレンドがいません"
              description="検索からユーザーを見つけてフレンド申請を送りましょう"
              actionLabel="ユーザーを探す"
              actionHref="/search"
            />
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              「{searchQuery}」に一致するフレンドがいません
            </div>
          )}
        </div>
      )}

      {activeTab === 'following' && (
        <div>
          {filteredFollowing.length > 0 ? (
            filteredFollowing.map(user => (
              <PersonRow
                key={user.id}
                user={user}
                type="following"
                onClick={() => router.push(`/user/${user.username}`)}
              />
            ))
          ) : following.length === 0 ? (
            <EmptyState
              icon={<Star className="w-8 h-8" />}
              title="フォロー中のユーザーがいません"
              description="配信者をフォローして最新セッションをチェック"
              actionLabel="配信者を探す"
              actionHref="/search?tab=streamers"
            />
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              「{searchQuery}」に一致するユーザーがいません
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div>
          {pendingRequests.length > 0 ? (
            pendingRequests.map(req => (
              <RequestRow
                key={req.id}
                request={req}
                isProcessing={processingRequest === req.id}
                onAccept={() => handleAcceptRequest(req)}
                onReject={() => handleRejectRequest(req)}
              />
            ))
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              保留中のフレンド申請はありません
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================
// Tab Button
// =============================================
function TabButton({
  active,
  onClick,
  count,
  highlight,
  children,
}: {
  active: boolean
  onClick: () => void
  count: number
  highlight?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors relative',
        active
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
      )}
    >
      {children}
      <span className={cn(
        'text-[11px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1',
        highlight && !active
          ? 'bg-primary text-primary-foreground font-bold'
          : active
            ? 'bg-primary/10 text-primary font-bold'
            : 'bg-muted text-muted-foreground',
      )}>
        {count}
      </span>
      {active && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-[3px] rounded-full bg-primary" />
      )}
    </button>
  )
}

// =============================================
// Person Row — Twitter-style user row
// =============================================
function PersonRow({
  user,
  type,
  onClick,
}: {
  user: FriendWithReports
  type: 'friend' | 'following'
  onClick: () => void
}) {
  const latestReport = user.recentReports[0]
  const reportCount = user.recentReports.length

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-3.5 hover:bg-accent/30 transition-colors border-b border-border/50"
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <Avatar className="w-11 h-11">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="text-sm">
              {(user.display_name || user.username)?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {type === 'friend' && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background flex items-center justify-center">
              <UserCheck className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[15px] truncate">
              {user.display_name || user.username}
            </span>
            <TierBadge profile={user} size="sm" />
          </div>
          <p className="text-sm text-muted-foreground">@{user.username}</p>

          {/* Bio preview */}
          {user.bio && (
            <p className="text-sm text-foreground/80 mt-1 line-clamp-1">
              {user.bio}
            </p>
          )}

          {/* Recent activity */}
          {latestReport && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <BookOpen className="w-3 h-3 shrink-0" />
              <span className="truncate">{latestReport.scenario_name}</span>
              {reportCount > 1 && (
                <span className="shrink-0">他{reportCount - 1}件</span>
              )}
            </div>
          )}
        </div>

        {/* Right chevron */}
        <div className="flex items-center shrink-0">
          <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
        </div>
      </div>
    </button>
  )
}

// =============================================
// Request Row — friend request with accept/reject
// =============================================
function RequestRow({
  request,
  isProcessing,
  onAccept,
  onReject,
}: {
  request: PendingRequest
  isProcessing: boolean
  onAccept: () => void
  onReject: () => void
}) {
  const user = request.from_user

  return (
    <div className="px-4 py-4 border-b border-border/50">
      <div className="flex gap-3">
        {/* Avatar */}
        <Link href={`/user/${user.username}`} className="shrink-0">
          <Avatar className="w-11 h-11 ring-2 ring-blue-500/30">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="text-sm">
              {(user.display_name || user.username)?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <Link href={`/user/${user.username}`} className="group">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[15px] truncate group-hover:underline">
                {user.display_name || user.username}
              </span>
              <TierBadge profile={user} size="sm" />
            </div>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </Link>

          {user.bio && (
            <p className="text-sm text-foreground/80 mt-1 line-clamp-2">
              {user.bio}
            </p>
          )}

          {/* Time */}
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTimeAgo(request.created_at)}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              onClick={onAccept}
              disabled={isProcessing}
              className="gap-1.5 rounded-full px-5 h-8 text-xs"
            >
              {isProcessing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              承認する
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              disabled={isProcessing}
              className="gap-1.5 rounded-full px-5 h-8 text-xs bg-transparent"
            >
              <X className="w-3.5 h-3.5" />
              拒否
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================
// Empty State
// =============================================
function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: React.ReactNode
  title: string
  description: string
  actionLabel: string
  actionHref: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 text-muted-foreground/40">
        {icon}
      </div>
      <p className="font-medium text-muted-foreground">{title}</p>
      <p className="text-sm text-muted-foreground/60 mt-1 max-w-[280px]">
        {description}
      </p>
      <div className="mt-5">
        <Link href={actionHref}>
          <Button variant="outline" size="sm" className="rounded-full gap-1.5 bg-transparent">
            <Search className="w-3.5 h-3.5" />
            {actionLabel}
          </Button>
        </Link>
      </div>
    </div>
  )
}
