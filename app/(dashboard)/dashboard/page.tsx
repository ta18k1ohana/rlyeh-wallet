import React from "react"
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Users, 
  ArrowRight,
  Sparkles,
  Star,
  TrendingUp
} from 'lucide-react'
import { SessionCard, SessionCardGrid } from '@/components/session-card'

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

  // AI-based recommendations: 
  // 1. Reports from friends of friends
  // 2. Reports with scenarios by authors user has played before
  // 3. Recent popular reports
  let recommendedReports: any[] = []

  // Get recent public reports (excluding own)
  const { data: recentPublicReports } = await supabase
    .from('play_reports')
    .select(`
      *,
      profile:profiles!play_reports_user_id_fkey(id, username, display_name, avatar_url),
      participants:play_report_participants(*),
      likes:likes(id)
    `)
    .eq('privacy_setting', 'public')
    .neq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (recentPublicReports) {
    // Score each report for recommendations
    const scoredReports = recentPublicReports.map(report => {
      let score = 0
      
      // +3 if from a friend of friend
      if (friendsOfFriendIds.includes(report.user_id)) score += 3
      
      // +2 if author user has played before
      if (report.scenario_author && playedAuthors.has(report.scenario_author)) score += 2
      
      // +1 for each like
      score += (report.likes?.length || 0) * 0.5
      
      // +1 if recent (within last 7 days)
      const daysSinceCreated = (Date.now() - new Date(report.created_at).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceCreated < 7) score += 1
      
      // -5 if user already played this scenario (to show new content)
      if (playedScenarios.has(report.scenario_name)) score -= 5

      return { ...report, _score: score, likes_count: report.likes?.length || 0 }
    })

    // Sort by score and take top 8
    recommendedReports = scoredReports
      .sort((a, b) => b._score - a._score)
      .slice(0, 8)
  }

  // Get friends' recent reports
  let friendsReports: any[] = []
  if (friendIds.length > 0) {
    const { data } = await supabase
      .from('play_reports')
      .select(`
        *,
        profile:profiles!play_reports_user_id_fkey(id, username, display_name, avatar_url),
        participants:play_report_participants(*),
        likes:likes(id)
      `)
      .in('user_id', friendIds)
      .eq('privacy_setting', 'public')
      .order('play_date_start', { ascending: false })
      .limit(8)
    
    friendsReports = (data || []).map(r => ({ ...r, likes_count: r.likes?.length || 0 }))
  }

  // Get streamers user follows (non-mutual follows to streamers)
  const nonMutualFollowingIds = followingIds.filter(id => !followerIds.includes(id))
  
  let followingReports: any[] = []
  if (nonMutualFollowingIds.length > 0) {
    // First check which of these are streamers
    const { data: streamerProfiles } = await supabase
      .from('profiles')
      .select('id')
      .in('id', nonMutualFollowingIds)
      .eq('is_streamer', true)

    const streamerIds = streamerProfiles?.map(p => p.id) || []

    if (streamerIds.length > 0) {
      const { data } = await supabase
        .from('play_reports')
        .select(`
          *,
          profile:profiles!play_reports_user_id_fkey(id, username, display_name, avatar_url, is_streamer),
          participants:play_report_participants(*),
          likes:likes(id)
        `)
        .in('user_id', streamerIds)
        .eq('privacy_setting', 'public')
        .order('play_date_start', { ascending: false })
        .limit(8)
      
      followingReports = (data || []).map(r => ({ ...r, likes_count: r.likes?.length || 0 }))
    }
  }

  return (
    <div className="space-y-10">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">ダッシュボード</h1>
        <p className="text-muted-foreground">最新の通過報告をチェック</p>
      </div>

      {/* AI Recommended Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-semibold">おすすめ</h2>
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">
            あなたの傾向に基づいたおすすめ
          </p>
        </div>
        
        {recommendedReports.length > 0 ? (
          <SessionCardGrid columns={4}>
            {recommendedReports.map((report) => (
              <SessionCard 
                key={report.id} 
                report={report}
                showAuthor
                compact
              />
            ))}
          </SessionCardGrid>
        ) : (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="py-10 text-center">
              <Sparkles className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">おすすめを表示するにはもう少し活動が必要です</p>
              <p className="text-sm text-muted-foreground mt-1">
                セッションを記録したり、フレンドを追加してみましょう
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Friends' Sessions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold">フレンドのセッション</h2>
          </div>
          <Link href="/search">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              ユーザーを探す
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        
        {friendsReports.length > 0 ? (
          <SessionCardGrid columns={4}>
            {friendsReports.map((report) => (
              <SessionCard 
                key={report.id} 
                report={report}
                showAuthor
                compact
              />
            ))}
          </SessionCardGrid>
        ) : (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="py-10 text-center">
              <Users className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">フレンドのセッションがありません</p>
              <p className="text-sm text-muted-foreground mt-1">
                他のユーザーとフレンドになってセッションを共有しましょう
              </p>
              <Link href="/search">
                <Button variant="outline" className="mt-4 gap-2 bg-transparent">
                  <Users className="w-4 h-4" />
                  ユーザーを探す
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Following (Streamers) Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-semibold">フォロー中</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">配信者</span>
          </div>
          <Link href="/search?tab=streamers">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              配信者を探す
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        
        {followingReports.length > 0 ? (
          <SessionCardGrid columns={4}>
            {followingReports.map((report) => (
              <SessionCard 
                key={report.id} 
                report={report}
                showAuthor
                compact
              />
            ))}
          </SessionCardGrid>
        ) : (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="py-10 text-center">
              <Star className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">フォロー中の配信者がいません</p>
              <p className="text-sm text-muted-foreground mt-1">
                配信者ティアのユーザーをフォローすると、ここに表示されます
              </p>
              <Link href="/search?tab=streamers">
                <Button variant="outline" className="mt-4 gap-2 bg-transparent">
                  <TrendingUp className="w-4 h-4" />
                  配信者を探す
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
