'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, UserPlus, Star, Loader2, UserCheck, Search } from 'lucide-react'
import { SessionCard, SessionCardGrid } from '@/components/session-card'
import { TierBadge } from '@/components/tier-badge'
import { UserSearchInput } from '@/components/user-autocomplete'
import { useRouter } from 'next/navigation'
import type { Profile, PlayReport } from '@/lib/types'

interface FriendWithReports extends Profile {
  recentReports: PlayReport[]
}

export default function SocialPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [friends, setFriends] = useState<FriendWithReports[]>([])
  const [following, setFollowing] = useState<FriendWithReports[]>([])
  const [pendingRequests, setPendingRequests] = useState<{
    id: string
    from_user: Profile
    created_at: string
  }[]>([])

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
      
      // Following only (not mutual) = streamers I follow
      const followingOnlyIds = followingIds.filter(id => !followerIds.includes(id))

      // Fetch friend profiles with recent reports
      if (friendIds.length > 0) {
        const { data: friendProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', friendIds)

        if (friendProfiles) {
          const friendsWithReports: FriendWithReports[] = []
          
          for (const profile of friendProfiles) {
            const { data: reports } = await supabase
              .from('play_reports')
              .select('*, participants:play_report_participants(*)')
              .eq('user_id', profile.id)
              .order('created_at', { ascending: false })
              .limit(3)

            friendsWithReports.push({
              ...profile,
              recentReports: reports || []
            })
          }
          
          setFriends(friendsWithReports)
        }
      }

      // Fetch following profiles (streamers)
      if (followingOnlyIds.length > 0) {
        const { data: followingProfiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', followingOnlyIds)

        if (followingProfiles) {
          const followingWithReports: FriendWithReports[] = []
          
          for (const profile of followingProfiles) {
            const { data: reports } = await supabase
              .from('play_reports')
              .select('*, participants:play_report_participants(*)')
              .eq('user_id', profile.id)
              .order('created_at', { ascending: false })
              .limit(3)

            followingWithReports.push({
              ...profile,
              recentReports: reports || []
            })
          }
          
          setFollowing(followingWithReports)
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
          created_at: r.created_at
        })))
      }

      setLoading(false)
    }

    loadSocialData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  const handleUserSelect = (profile: Profile) => {
    router.push(`/user/${profile.username}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Users className="w-7 h-7 text-primary" />
          ソーシャル
        </h1>
        <p className="text-muted-foreground">フレンドやフォロー中のユーザーの最新情報</p>
      </div>

      {/* User Search */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <UserSearchInput
              onUserSelect={handleUserSelect}
              placeholder="ユーザーを検索 (@ID または名前)"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            @で始めるとID検索、それ以外は名前で検索します。フレンドが優先表示されます。
          </p>
        </CardContent>
      </Card>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-500" />
              フレンド申請 ({pendingRequests.length}件)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pendingRequests.map((req) => (
                <Link key={req.id} href="/notifications">
                  <div className="flex items-center gap-2 bg-background/50 px-3 py-2 rounded-lg hover:bg-background transition-colors">
                    <Avatar className="w-8 h-8 rounded-xl">
                      <AvatarImage src={req.from_user.avatar_url || undefined} className="rounded-xl" />
                      <AvatarFallback className="text-xs rounded-xl">
                        {(req.from_user.display_name || req.from_user.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {req.from_user.display_name || req.from_user.username}
                    </span>
                  </div>
                </Link>
              ))}
              <Link href="/notifications">
                <Button variant="outline" size="sm" className="bg-transparent">
                  すべて見る
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="friends" className="space-y-6">
        <TabsList>
          <TabsTrigger value="friends" className="gap-2">
            <UserCheck className="w-4 h-4" />
            フレンド ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="following" className="gap-2">
            <Star className="w-4 h-4" />
            フォロー中 ({following.length})
          </TabsTrigger>
        </TabsList>

        {/* Friends Tab */}
        <TabsContent value="friends" className="space-y-6">
          {friends.length === 0 ? (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">まだフレンドがいません</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  検索から他のユーザーを見つけてフレンド申請を送りましょう
                </p>
                <Button asChild>
                  <Link href="/search">ユーザーを探す</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            friends.map((friend) => (
              <FriendSection key={friend.id} user={friend} type="friend" />
            ))
          )}
        </TabsContent>

        {/* Following Tab */}
        <TabsContent value="following" className="space-y-6">
          {following.length === 0 ? (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="py-12 text-center">
                <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">フォロー中のユーザーがいません</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  配信者をフォローして最新のセッションをチェック
                </p>
                <Button asChild>
                  <Link href="/search?tab=streamers">配信者を探す</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            following.map((user) => (
              <FriendSection key={user.id} user={user} type="following" />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function FriendSection({ user, type }: { user: FriendWithReports; type: 'friend' | 'following' }) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Link href={`/user/${user.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Avatar className="w-10 h-10 rounded-xl">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {(user.display_name || user.username).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{user.display_name || user.username}</span>
                <TierBadge profile={user} size="sm" />
              </div>
              <span className="text-sm text-muted-foreground">@{user.username}</span>
            </div>
          </Link>
          <Button variant="outline" size="sm" asChild className="bg-transparent">
            <Link href={`/user/${user.username}`}>
              プロフィール
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {user.recentReports.length > 0 ? (
          <SessionCardGrid columns={3}>
            {user.recentReports.map((report) => (
              <SessionCard key={report.id} report={report} showAuthor={false} />
            ))}
          </SessionCardGrid>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            まだセッション記録がありません
          </p>
        )}
      </CardContent>
    </Card>
  )
}
