import React from "react"
import { createClient } from '@/lib/supabase/server'
import { DashboardFeed } from '@/components/dashboard-feed'
import { MatchingRecommendations } from '@/components/matching-recommendations'
import { StreamerAdCard } from '@/components/streamer-ad-card'
import { ScenarioPreferenceManager } from '@/components/scenario-preference-manager'
import { XShareButton } from '@/components/x-share-button'
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
      .filter(r => (r.profile as any)?.is_streamer === true)

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

      {/* Streamer Ads (for non-hiding users) */}
      {streamerAds.length > 0 && (
        <div className="space-y-4">
          {streamerAds.map((ad, index) => (
            <StreamerAdCard
              key={ad.report.id}
              report={ad.report}
              streamer={ad.streamer}
              canHideAds={canHideAds}
            />
          ))}
        </div>
      )}

      {/* Pro Feature: Matching Recommendations */}
      {canUseMatching && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">マッチング</h2>
            <XShareButton preferences={scenarioPreferences} size="sm" />
          </div>
          <MatchingRecommendations
            kpReports={kpReports}
            interestedPlayers={interestedPlayers}
          />
        </div>
      )}

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
