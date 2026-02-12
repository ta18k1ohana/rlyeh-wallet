import React from "react"
import { createClient } from '@/lib/supabase/server'
import { DashboardFeed } from '@/components/dashboard-feed'
import { MatchingRecommendations } from '@/components/matching-recommendations'
import { StreamerAdCard } from '@/components/streamer-ad-card'
import { XShareButton } from '@/components/x-share-button'
import { TrendingScenarios } from '@/components/trending-scenarios'
import {
  WelcomeHeader,
  MilestoneBanner,
  WeeklyActivity,
  ActiveFriends,
  InvestigatorRank,
  MythosTip,
} from '@/components/dashboard-widgets'
import { getProfileLimits, canUseFeature } from '@/lib/tier-limits'
import type { PlayReport, Profile, ScenarioPreference } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const limits = getProfileLimits(profile)
  const canUseMatching = canUseFeature(profile, 'canUseMatching')
  const canHideAds = canUseFeature(profile, 'canHideAds')

  // Get user's ad preferences
  let hideStreamerAds = false
  if (canHideAds) {
    const { data: adPrefs } = await supabase
      .from('user_ad_preferences')
      .select('hide_streamer_ads')
      .eq('user_id', user.id)
      .single()
    hideStreamerAds = adPrefs?.hide_streamer_ads || false
  }

  // Get user's play history for recommendations AND statistics
  const { data: userReports } = await supabase
    .from('play_reports')
    .select('scenario_name, scenario_author, created_at')
    .eq('user_id', user.id)

  const playedScenarios = new Set(userReports?.map(r => r.scenario_name) || [])
  const playedAuthors = new Set(userReports?.map(r => r.scenario_author).filter(Boolean) || [])

  // Statistics calculations
  const totalReports = userReports?.length || 0
  const uniqueScenarios = playedScenarios.size
  const uniqueAuthors = playedAuthors.size

  // This month's reports
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonthReports = userReports?.filter(r =>
    new Date(r.created_at) >= thisMonthStart
  ).length || 0

  // =============================================
  // Daily activity heatmap (last 28 days)
  // =============================================
  const dailyCounts: number[] = []
  for (let i = 27; i >= 0; i--) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    const count = userReports?.filter(r => {
      const d = new Date(r.created_at)
      return d >= dayStart && d < dayEnd
    }).length || 0
    dailyCounts.push(count)
  }

  // =============================================
  // Weekly streak (consecutive weeks with at least 1 report)
  // =============================================
  let streak = 0
  for (let w = 0; w < 52; w++) {
    const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - w * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekStart.getDate() - 7)
    const hasActivity = userReports?.some(r => {
      const d = new Date(r.created_at)
      return d >= weekStart && d < weekEnd
    })
    if (hasActivity) {
      streak++
    } else {
      break
    }
  }

  // =============================================
  // Survival rate for SAN値 calculation
  // =============================================
  const { data: userParticipants } = await supabase
    .from('play_report_participants')
    .select('role, result, user_id')
    .eq('user_id', user.id)

  let plSessions = 0
  let surviveCount = 0
  userParticipants?.forEach(p => {
    if (p.role === 'PL') {
      if (p.result === 'survive' || p.result === 'dead' || p.result === 'insane') {
        plSessions++
        if (p.result === 'survive') surviveCount++
      }
    }
  })
  const survivalRate = plSessions > 0 ? Math.round((surviveCount / plSessions) * 100) : 100

  // SAN値: Based on survival rate and activity — fun gamification
  // Higher survival rate = higher SAN, active play keeps it up
  const baseSan = survivalRate
  const activityBonus = Math.min(thisMonthReports * 3, 15) // up to +15 for being active
  const sanity = Math.max(1, Math.min(99, baseSan + activityBonus - (plSessions === 0 ? 30 : 0)))

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

  // =============================================
  // Active friends — recent activity
  // =============================================
  let activeFriends: { profile: Profile; lastActive: string; recentScenario?: string }[] = []
  if (friendIds.length > 0) {
    const { data: friendProfiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', friendIds.slice(0, 20))

    // Get most recent report from each friend
    const { data: friendRecentReports } = await supabase
      .from('play_reports')
      .select('user_id, scenario_name, created_at')
      .in('user_id', friendIds.slice(0, 20))
      .order('created_at', { ascending: false })
      .limit(50)

    const friendLatestMap = new Map<string, { scenario: string; date: string }>()
    friendRecentReports?.forEach(r => {
      if (!friendLatestMap.has(r.user_id)) {
        friendLatestMap.set(r.user_id, { scenario: r.scenario_name, date: r.created_at })
      }
    })

    activeFriends = (friendProfiles || [])
      .map(fp => ({
        profile: fp as Profile,
        lastActive: friendLatestMap.get(fp.id)?.date || fp.updated_at,
        recentScenario: friendLatestMap.get(fp.id)?.scenario,
      }))
      .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())
      .slice(0, 5)
  }

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

  // =============================================
  // Trending Scenarios (this month)
  // =============================================
  const { data: trendingData } = await supabase
    .from('play_reports')
    .select('scenario_name, scenario_author')
    .eq('privacy_setting', 'public')
    .gte('created_at', thisMonthStart.toISOString())

  // Count scenario popularity
  const scenarioCounts = new Map<string, { name: string; author: string | null; count: number }>()
  for (const report of (trendingData || [])) {
    const key = report.scenario_name
    const existing = scenarioCounts.get(key)
    if (existing) {
      existing.count++
    } else {
      scenarioCounts.set(key, {
        name: report.scenario_name,
        author: report.scenario_author,
        count: 1,
      })
    }
  }

  // Sort by count and take top 5
  const trendingScenarios = Array.from(scenarioCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((s, i) => ({
      ...s,
      trend: i === 0 ? 'up' as const : s.count >= 3 ? 'up' as const : 'stable' as const,
    }))

  // =============================================
  // Pro Feature: Matching Recommendations
  // =============================================
  let kpReports: PlayReport[] = []
  let interestedPlayers: { profile: Profile; scenarioName: string }[] = []
  let scenarioPreferences: ScenarioPreference[] = []

  if (canUseMatching) {
    // Get user's scenario preferences
    const { data: prefs } = await supabase
      .from('scenario_preferences')
      .select('*')
      .eq('user_id', user.id)

    scenarioPreferences = prefs || []

    const wantToPlay = scenarioPreferences.filter(p => p.preference_type === 'want_to_play')
    const canRun = scenarioPreferences.filter(p => p.preference_type === 'can_run')

    // Get KP reports for "want to play" scenarios
    if (wantToPlay.length > 0) {
      const scenarioNames = wantToPlay.map(p => p.scenario_name)

      const { data: kpData } = await supabase
        .from('play_reports')
        .select(`
          *,
          profile:profiles!play_reports_user_id_fkey(id, username, display_name, avatar_url),
          participants:play_report_participants(role, user_id)
        `)
        .in('scenario_name', scenarioNames)
        .eq('privacy_setting', 'public')
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      // Filter to only KP reports
      kpReports = (kpData || []).filter(report =>
        report.participants?.some((p: any) => p.role === 'KP' && p.user_id === report.user_id)
      )
    }

    // Get interested players for "can run" scenarios
    if (canRun.length > 0) {
      const scenarioNames = canRun.map(p => p.scenario_name)

      const { data: playerPrefs } = await supabase
        .from('scenario_preferences')
        .select(`
          scenario_name,
          profile:profiles!scenario_preferences_user_id_fkey(*)
        `)
        .in('scenario_name', scenarioNames)
        .eq('preference_type', 'want_to_play')
        .neq('user_id', user.id)
        .limit(10)

      interestedPlayers = (playerPrefs || []).map(p => ({
        profile: p.profile as unknown as Profile,
        scenarioName: p.scenario_name,
      })).filter(p => p.profile)
    }
  }

  // =============================================
  // Streamer Ads (for non-Pro users)
  // =============================================
  let streamerAds: { report: PlayReport; streamer: Profile }[] = []

  if (!hideStreamerAds) {
    // Get random streamer reports from the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: streamerReports } = await supabase
      .from('play_reports')
      .select(`
        *,
        profile:profiles!play_reports_user_id_fkey(*)
      `)
      .eq('privacy_setting', 'public')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .neq('user_id', user.id)
      .limit(20)

    // Filter to streamer reports and shuffle
    const streamerOnlyReports = (streamerReports || [])
      .filter(r => (r.profile as any)?.tier === 'streamer')

    // Random shuffle and take 2
    const shuffled = streamerOnlyReports.sort(() => Math.random() - 0.5)
    streamerAds = shuffled.slice(0, 2).map(r => ({
      report: r as PlayReport,
      streamer: r.profile as unknown as Profile,
    }))
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
      .eq('tier', 'streamer')

    streamerIds = streamerProfiles?.map(p => p.id) || []

    if (streamerIds.length > 0) {
      const { data } = await supabase
        .from('play_reports')
        .select(`
          *,
          profile:profiles!play_reports_user_id_fkey(id, username, display_name, avatar_url, tier),
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
    <div className="-my-6">
      {/* Main Feed Area - X/Twitter-style 600px column */}
      <div className="min-h-screen max-w-[600px] mx-auto border-x border-border/50">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
          <h1 className="text-xl font-bold">ホーム</h1>
        </div>

        {/* Welcome Header — greeting + quick stats */}
        <WelcomeHeader
          displayName={profile?.display_name || profile?.username || '探索者'}
          totalReports={totalReports}
          thisMonthReports={thisMonthReports}
          streak={streak}
          sanity={sanity}
        />

        {/* Milestone celebration banner */}
        <MilestoneBanner totalReports={totalReports} />

        {/* Streamer Ads (for non-hiding users) - inline */}
        {streamerAds.length > 0 && (
          <div className="p-4 border-b border-border/50">
            {streamerAds.slice(0, 1).map((ad) => (
              <StreamerAdCard
                key={ad.report.id}
                report={ad.report}
                streamer={ad.streamer}
                canHideAds={canHideAds}
              />
            ))}
          </div>
        )}

        {/* Pro Feature: Matching Recommendations - compact inline */}
        {canUseMatching && (kpReports.length > 0 || interestedPlayers.length > 0) && (
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">マッチング</h2>
              <XShareButton preferences={scenarioPreferences} size="sm" />
            </div>
            <MatchingRecommendations
              kpReports={kpReports}
              interestedPlayers={interestedPlayers}
            />
          </div>
        )}

        {/* Main Feed */}
        <DashboardFeed
          initialFriendReports={friendsReports}
          initialFollowingReports={followingReports}
          recommendedReports={recommendedReports}
          friendIds={friendIds}
          streamerIds={streamerIds}
          userId={user.id}
        />
      </div>

      {/* Right Sidebar Content */}
      <RightSidebarContent
        totalReports={totalReports}
        thisMonthReports={thisMonthReports}
        friendsCount={friendIds.length}
        uniqueAuthors={uniqueAuthors}
        uniqueScenarios={uniqueScenarios}
        survivalRate={survivalRate}
        trendingScenarios={trendingScenarios}
        dailyCounts={dailyCounts}
        activeFriends={activeFriends}
      />
    </div>
  )
}

// Right Sidebar Content Component
function RightSidebarContent({
  totalReports,
  thisMonthReports,
  friendsCount,
  uniqueAuthors,
  uniqueScenarios,
  survivalRate,
  trendingScenarios,
  dailyCounts,
  activeFriends,
}: {
  totalReports: number
  thisMonthReports: number
  friendsCount: number
  uniqueAuthors: number
  uniqueScenarios: number
  survivalRate: number
  trendingScenarios: { name: string; author: string | null; count: number; trend: 'up' | 'new' | 'stable' }[]
  dailyCounts: number[]
  activeFriends: { profile: any; lastActive: string; recentScenario?: string }[]
}) {
  return (
    <div className="hidden lg:block fixed right-0 top-0 w-[350px] h-screen overflow-y-auto px-4 py-4 border-l border-border/50 bg-background">
      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          placeholder="検索"
          className="w-full pl-10 pr-4 py-2.5 rounded-full bg-muted/50 border-0 focus:ring-1 focus:ring-primary text-sm"
        />
      </div>

      {/* Investigator Rank — gamification card */}
      <InvestigatorRank
        totalReports={totalReports}
        survivalRate={survivalRate}
        uniqueScenarios={uniqueScenarios}
      />

      {/* Weekly Activity Heatmap */}
      <WeeklyActivity dailyCounts={dailyCounts} />

      {/* Active Friends */}
      <ActiveFriends friends={activeFriends} />

      {/* Trending */}
      {trendingScenarios.length > 0 && (
        <TrendingScenarios scenarios={trendingScenarios} />
      )}

      {/* Mythos Tip — daily flavor text */}
      <div className="mt-4">
        <MythosTip />
      </div>

      {/* Footer */}
      <div className="mt-4 text-xs text-muted-foreground space-y-2">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <a href="/terms" className="hover:underline">利用規約</a>
          <a href="/privacy" className="hover:underline">プライバシー</a>
          <a href="/pricing" className="hover:underline">料金プラン</a>
        </div>
        <p>© 2025 R&apos;lyeh Wallet</p>
      </div>
    </div>
  )
}

