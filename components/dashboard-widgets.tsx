'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Flame,
  BookOpen,
  Calendar,
  Star,
  TrendingUp,
  Users,
  Skull,
  Zap,
  Moon,
  Eye,
  Crown,
  Compass,
  Scroll,
} from 'lucide-react'
import type { Profile } from '@/lib/types'

// =============================================
// 1. Welcome Header — Greeting + quick stats in feed column
// =============================================
interface WelcomeHeaderProps {
  displayName: string
  totalReports: number
  thisMonthReports: number
  streak: number // consecutive days/weeks with activity
  sanity: number // gamified "SAN値" 0-100
}

export function WelcomeHeader({
  displayName,
  totalReports,
  thisMonthReports,
  streak,
  sanity,
}: WelcomeHeaderProps) {
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 6) return 'こんな時間まで探索中…'
    if (hour < 12) return 'おはようございます'
    if (hour < 18) return 'こんにちは'
    return 'こんばんは'
  }, [])

  const firstName = displayName?.split(/[\s@]/)[0] || '探索者'

  return (
    <div className="px-4 py-4 border-b border-border/50">
      {/* Greeting */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm text-muted-foreground">{greeting}</p>
          <h2 className="text-lg font-bold">{firstName}さん</h2>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-bold text-orange-500">{streak}</span>
            <span className="text-xs text-orange-500/80">週連続</span>
          </div>
        )}
      </div>

      {/* Quick stat pills */}
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        <QuickStatPill
          icon={<BookOpen className="w-3.5 h-3.5" />}
          value={totalReports}
          label="通過"
          color="blue"
        />
        <QuickStatPill
          icon={<Calendar className="w-3.5 h-3.5" />}
          value={thisMonthReports}
          label="今月"
          color="green"
        />
        <SanityPill sanity={sanity} />
      </div>
    </div>
  )
}

function QuickStatPill({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode
  value: number
  label: string
  color: 'blue' | 'green' | 'orange' | 'purple'
}) {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    orange: 'bg-orange-500/10 text-orange-500',
    purple: 'bg-purple-500/10 text-purple-500',
  }

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${colorMap[color]} shrink-0`}>
      {icon}
      <span className="text-sm font-bold">{value}</span>
      <span className="text-xs opacity-80">{label}</span>
    </div>
  )
}

// SAN値 pill — fun CoC gamification
function SanityPill({ sanity }: { sanity: number }) {
  const sanityColor = sanity >= 70
    ? 'bg-emerald-500/10 text-emerald-500'
    : sanity >= 40
      ? 'bg-amber-500/10 text-amber-500'
      : 'bg-red-500/10 text-red-500'

  const sanityIcon = sanity >= 70
    ? <Eye className="w-3.5 h-3.5" />
    : sanity >= 40
      ? <Moon className="w-3.5 h-3.5" />
      : <Skull className="w-3.5 h-3.5" />

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${sanityColor} shrink-0`}>
      {sanityIcon}
      <span className="text-xs font-medium">SAN</span>
      <span className="text-sm font-bold">{sanity}</span>
    </div>
  )
}

// =============================================
// 2. Weekly Activity Heatmap (GitHub-style but CoC-themed)
// =============================================
interface WeeklyActivityProps {
  // Array of 28 values (4 weeks × 7 days) — most recent day is last
  dailyCounts: number[]
}

export function WeeklyActivity({ dailyCounts }: WeeklyActivityProps) {
  // Use last 28 days (4 weeks)
  const weeks = useMemo(() => {
    const data = dailyCounts.slice(-28)
    // Pad start if less than 28
    while (data.length < 28) data.unshift(0)
    // Split into 4 rows of 7
    const rows: number[][] = []
    for (let i = 0; i < 4; i++) {
      rows.push(data.slice(i * 7, (i + 1) * 7))
    }
    return rows
  }, [dailyCounts])

  const dayLabels = ['月', '火', '水', '木', '金', '土', '日']

  return (
    <div className="rounded-xl bg-muted/30 p-4 mb-4">
      <h3 className="font-bold mb-2 flex items-center gap-2 text-sm">
        <Zap className="w-4 h-4 text-amber-500" />
        探索活動
      </h3>
      <div className="space-y-1">
        {/* Day labels */}
        <div className="flex gap-1 mb-1">
          <div className="w-6" /> {/* spacer for week labels */}
          {dayLabels.map((d) => (
            <div key={d} className="w-5 h-4 flex items-center justify-center">
              <span className="text-[9px] text-muted-foreground">{d}</span>
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex gap-1 items-center">
            <div className="w-6 flex items-center justify-center">
              <span className="text-[9px] text-muted-foreground">
                {wi === 3 ? '今' : `${3 - wi}w`}
              </span>
            </div>
            {week.map((count, di) => (
              <div
                key={di}
                className={`w-5 h-5 rounded-sm transition-colors ${
                  count === 0
                    ? 'bg-muted/50'
                    : count === 1
                      ? 'bg-emerald-500/30'
                      : count === 2
                        ? 'bg-emerald-500/50'
                        : 'bg-emerald-500/80'
                }`}
                title={`${count}件の記録`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================
// 3. Active Friends / Recent Activity
// =============================================
interface FriendActivity {
  profile: Profile
  lastActive: string // ISO date
  recentScenario?: string
}

interface ActiveFriendsProps {
  friends: FriendActivity[]
}

export function ActiveFriends({ friends }: ActiveFriendsProps) {
  if (friends.length === 0) return null

  return (
    <div className="rounded-xl bg-muted/30 p-4 mb-4">
      <h3 className="font-bold mb-3 flex items-center gap-2 text-sm">
        <Users className="w-4 h-4 text-blue-500" />
        アクティブなフレンド
      </h3>
      <div className="space-y-2.5">
        {friends.slice(0, 5).map((friend) => {
          const timeDiff = Date.now() - new Date(friend.lastActive).getTime()
          const isOnline = timeDiff < 1000 * 60 * 60 * 24 // 24h
          const timeAgo = formatShortTimeAgo(friend.lastActive)

          return (
            <Link
              key={friend.profile.id}
              href={`/user/${friend.profile.username}`}
              className="flex items-center gap-2.5 hover:bg-muted/50 rounded-lg -mx-1 px-1 py-1 transition-colors"
            >
              <div className="relative">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={friend.profile.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {(friend.profile.display_name || friend.profile.username)?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {friend.profile.display_name || friend.profile.username}
                </p>
                {friend.recentScenario && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    {friend.recentScenario}
                  </p>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {timeAgo}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function formatShortTimeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const diffMin = Math.floor(diffMs / (1000 * 60))
  const diffHour = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMin < 60) return `${diffMin}m`
  if (diffHour < 24) return `${diffHour}h`
  if (diffDay < 7) return `${diffDay}d`
  return `${Math.floor(diffDay / 7)}w`
}

// =============================================
// 4. Investigator Rank Card — gamification
// =============================================
interface InvestigatorRankProps {
  totalReports: number
  survivalRate: number
  uniqueScenarios: number
}

const RANKS = [
  { min: 0, title: '見習い探索者', icon: Compass, color: 'text-gray-400' },
  { min: 5, title: '新米探索者', icon: Scroll, color: 'text-green-500' },
  { min: 15, title: '一般探索者', icon: BookOpen, color: 'text-blue-500' },
  { min: 30, title: 'ベテラン探索者', icon: Star, color: 'text-amber-500' },
  { min: 50, title: '上級探索者', icon: Crown, color: 'text-purple-500' },
  { min: 100, title: '伝説の探索者', icon: Eye, color: 'text-red-500' },
]

export function InvestigatorRank({ totalReports, survivalRate, uniqueScenarios }: InvestigatorRankProps) {
  const rank = useMemo(() => {
    let current = RANKS[0]
    for (const r of RANKS) {
      if (totalReports >= r.min) current = r
    }
    return current
  }, [totalReports])

  const nextRank = useMemo(() => {
    const idx = RANKS.indexOf(rank)
    return idx < RANKS.length - 1 ? RANKS[idx + 1] : null
  }, [rank])

  const progress = nextRank
    ? ((totalReports - rank.min) / (nextRank.min - rank.min)) * 100
    : 100

  const Icon = rank.icon

  return (
    <div className="rounded-xl bg-muted/30 p-4 mb-4">
      <h3 className="font-bold mb-3 flex items-center gap-2 text-sm">
        <Icon className={`w-4 h-4 ${rank.color}`} />
        探索者ランク
      </h3>
      <div className="text-center mb-3">
        <p className={`text-base font-bold ${rank.color}`}>{rank.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {totalReports}回の通過 / 生還率 {survivalRate}%
        </p>
      </div>

      {/* Progress bar to next rank */}
      {nextRank && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{rank.title}</span>
            <span>{nextRank.title}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            あと{nextRank.min - totalReports}回で昇格
          </p>
        </div>
      )}

      {/* Mini stats row */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/50">
        <div className="text-center">
          <p className="text-sm font-bold">{totalReports}</p>
          <p className="text-[10px] text-muted-foreground">通過数</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold">{survivalRate}%</p>
          <p className="text-[10px] text-muted-foreground">生還率</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold">{uniqueScenarios}</p>
          <p className="text-[10px] text-muted-foreground">シナリオ</p>
        </div>
      </div>
    </div>
  )
}

// =============================================
// 5. Today's Cthulhu Mythos Tip — small flavor text
// =============================================
const MYTHOS_TIPS = [
  { text: '「それは死んでいるのではない。永遠に横たわる奇妙な死者は、永劫の時の中にあっては死することさえありうる」', source: 'H.P.ラヴクラフト' },
  { text: 'ミスカトニック大学の図書館には「ネクロノミコン」の写本があるとされている', source: '神話豆知識' },
  { text: 'SAN値の最大値はPOW×5で決まる。日々の正気を大切に…', source: 'KPのアドバイス' },
  { text: 'クトゥルフ神話TRPGの第1版は1981年に発売された', source: '歴史豆知識' },
  { text: '「窓に！窓に！」— 恐怖の表現には具体性が大切', source: 'KPのアドバイス' },
  { text: '旧き神々は味方ではない。ただ敵の敵というだけだ', source: '神話豆知識' },
  { text: '調査を怠った探索者は長く生き延びることはできない', source: 'KPのアドバイス' },
  { text: 'アーカムの街は架空の都市だが、マサチューセッツ州がモデル', source: '歴史豆知識' },
  { text: '新版のルールブックが出ても旧版のシナリオは大体遊べる', source: 'KPのアドバイス' },
  { text: '探索者の平均寿命はKPの優しさに比例する', source: '格言' },
  { text: 'ダイスの目は嘘をつかない。が、KPは嘘をつく', source: '格言' },
  { text: '初めてのシナリオは短めがおすすめ。3〜4時間で終わるものが良い', source: 'KPのアドバイス' },
]

export function MythosTip() {
  // Pick based on date so it changes daily
  const tip = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    )
    return MYTHOS_TIPS[dayOfYear % MYTHOS_TIPS.length]
  }, [])

  return (
    <div className="rounded-xl bg-gradient-to-br from-muted/30 to-primary/5 p-4 mb-4 border border-border/30">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Scroll className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-1">今日の神話知識</p>
          <p className="text-sm leading-relaxed">{tip.text}</p>
          <p className="text-[10px] text-muted-foreground mt-1.5">— {tip.source}</p>
        </div>
      </div>
    </div>
  )
}

// =============================================
// 6. Milestone Toast — inline celebration when user hits milestones
// =============================================
interface MilestoneProps {
  totalReports: number
}

const MILESTONES = [1, 5, 10, 25, 50, 100, 200, 500]

export function MilestoneBanner({ totalReports }: MilestoneProps) {
  const milestone = useMemo(() => {
    // Find the highest milestone the user just reached
    const reached = MILESTONES.filter(m => totalReports >= m)
    if (reached.length === 0) return null
    const latest = reached[reached.length - 1]
    // Only show if within 2 of the milestone (recently crossed)
    if (totalReports - latest > 2) return null
    return latest
  }, [totalReports])

  if (!milestone) return null

  return (
    <div className="px-4 py-3 border-b border-border/50">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20">
        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <Star className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-bold">
            {milestone}回通過達成！
          </p>
          <p className="text-xs text-muted-foreground">
            {milestone >= 100
              ? '伝説の探索者として名が知られています'
              : milestone >= 50
                ? 'ベテラン探索者の風格が漂います'
                : milestone >= 25
                  ? '順調に探索経験を積んでいます'
                  : milestone >= 10
                    ? 'もう立派な探索者です'
                    : '探索の旅が始まりました！'}
          </p>
        </div>
      </div>
    </div>
  )
}
