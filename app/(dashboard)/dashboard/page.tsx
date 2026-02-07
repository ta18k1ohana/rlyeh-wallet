import React from "react"
import { createClient } from '@/lib/supabase/server'
import { DashboardFeed } from '@/components/dashboard-feed'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's play history for recommendations
  const { data: userReports } = await supabase
    .from('play_reports')
    .select('scenario_name, scenario_author')
    .eq('user_id', user.id)

  const playedScenarios = new Set(userReports?.map(r => r.scenario_name) || [])
  const playedAuthors = new Set(userReports?.map(r => r.scenario_author).filter(Boolean) || [])

  // Get friends (mutual follows)
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const { data: followers } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', user.id)

  const followingIds = following?.map(f => f.following_id) || []
  const followerIds = followers?.map(f => f.follower_id) || []

  // Mutual friends
  const friendIds = followingIds.filter(id => followerIds.includes(id))

  // Get friends of friends for recommendations
  let friendsOfFriendIds: string[] = []
  if (friendIds.length > 0) {
    const { data: fofData } = await supabase
      .from('follows')
      .select('following_id')
      .in('follower_id', friendIds)
      .not('following_id', 'eq', user.id)

    friendsOfFriendIds = fofData?.map(f => f.following_id).filter(id => !friendIds.includes(id)) || []
  }

  // Recommendation scoring on recent public reports
  let recommendedReports: any[] = []

  const { data: recentPublicReports } = await supabase
    .from('play_reports')
    .select(`
      *,
      profile:profiles!play_reports_user_id_fkey(id, username, display_name, avatar_url),
      participants:play_report_participants(*, profile:profiles(id, username, display_name, avatar_url)),
      likes:likes(id)
    `)
    .eq('privacy_setting', 'public')
    .neq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (recentPublicReports) {
    const scoredReports = recentPublicReports.map(report => {
      let score = 0

      // +3 if from a friend of friend
      if (friendsOfFriendIds.includes(report.user_id)) score += 3

      // +2 if author user has played before
      if (report.scenario_author && playedAuthors.has(report.scenario_author)) score += 2

      // +0.5 per like
      score += (report.likes?.length || 0) * 0.5

      // +1 if recent (within last 7 days)
      const daysSinceCreated = (Date.now() - new Date(report.created_at).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceCreated < 7) score += 1

      // -5 if user already played this scenario
      if (playedScenarios.has(report.scenario_name)) score -= 5

      return { ...report, _score: score, likes_count: report.likes?.length || 0 }
    })

    // Sort by score and take top 20 for random insertion into feed
    recommendedReports = scoredReports
      .sort((a, b) => b._score - a._score)
      .slice(0, 20)
  }

  // Get friends' recent reports (first page)
  let friendsReports: any[] = []
  if (friendIds.length > 0) {
    const { data } = await supabase
      .from('play_reports')
      .select(`
        *,
        profile:profiles!play_reports_user_id_fkey(id, username, display_name, avatar_url),
        participants:play_report_participants(*, profile:profiles(id, username, display_name, avatar_url)),
        likes:likes(id)
      `)
      .in('user_id', friendIds)
      .in('privacy_setting', ['public', 'followers'])
      .order('play_date_start', { ascending: false })
      .limit(10)

    friendsReports = (data || []).map(r => ({ ...r, likes_count: r.likes?.length || 0 }))
  }

  // Get streamers user follows (non-mutual follows to streamers)
  const nonMutualFollowingIds = followingIds.filter(id => !followerIds.includes(id))

  let streamerIds: string[] = []
  let followingReports: any[] = []

  if (nonMutualFollowingIds.length > 0) {
    const { data: streamerProfiles } = await supabase
      .from('profiles')
      .select('id')
      .in('id', nonMutualFollowingIds)
      .eq('is_streamer', true)

    streamerIds = streamerProfiles?.map(p => p.id) || []

    if (streamerIds.length > 0) {
      const { data } = await supabase
        .from('play_reports')
        .select(`
          *,
          profile:profiles!play_reports_user_id_fkey(id, username, display_name, avatar_url, is_streamer),
          participants:play_report_participants(*, profile:profiles(id, username, display_name, avatar_url)),
          likes:likes(id)
        `)
        .in('user_id', streamerIds)
        .eq('privacy_setting', 'public')
        .order('play_date_start', { ascending: false })
        .limit(10)

      followingReports = (data || []).map(r => ({ ...r, likes_count: r.likes?.length || 0 }))
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">ダッシュボード</h1>
        <p className="text-muted-foreground">最新の通過報告をチェック</p>
      </div>

      <DashboardFeed
        initialFriendReports={friendsReports}
        initialFollowingReports={followingReports}
        recommendedReports={recommendedReports}
        friendIds={friendIds}
        streamerIds={streamerIds}
        userId={user.id}
      />
    </div>
  )
}
