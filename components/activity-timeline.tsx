'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible'
import { Trophy, ChevronDown, ChevronRight, Clock, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlayReport, Profile } from '@/lib/types'

interface ActivityTimelineProps {
  reports: PlayReport[]
  profile: Profile
  currentUserId: string | null
}

interface Milestone {
  reportId: string
  label: string
  icon: 'trophy' | 'star'
}

type TimelineItem =
  | { type: 'year-header'; year: number }
  | { type: 'month-header'; year: number; month: number }
  | { type: 'milestone'; milestone: Milestone }
  | { type: 'entry'; report: PlayReport; roles: string[] }

const MONTH_NAMES = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
]

const RESULT_LABELS: Record<string, { label: string; className: string }> = {
  survive: { label: '生還', className: 'text-green-600 bg-green-500/10' },
  dead: { label: 'ロスト', className: 'text-red-600 bg-red-500/10' },
  insane: { label: '発狂', className: 'text-purple-600 bg-purple-500/10' },
  other: { label: 'その他', className: 'text-muted-foreground bg-muted' },
}

function getUserRoles(report: PlayReport, profile: Profile): string[] {
  const roles: string[] = []
  report.participants?.forEach((p) => {
    const matchById = p.user_id === profile.id
    const pUsername = (p.username || '').toLowerCase()
    const profileUsername = (profile.username || '').toLowerCase()
    const profileDisplay = (profile.display_name || '').toLowerCase()
    const matchByName =
      pUsername === `@${profileUsername}` ||
      pUsername === profileUsername ||
      (profileDisplay && pUsername === profileDisplay)
    if (matchById || matchByName) {
      if (!roles.includes(p.role)) roles.push(p.role)
    }
  })
  return roles
}

function getUserResult(report: PlayReport, profile: Profile): string | null {
  for (const p of report.participants || []) {
    const matchById = p.user_id === profile.id
    const pUsername = (p.username || '').toLowerCase()
    const profileUsername = (profile.username || '').toLowerCase()
    const profileDisplay = (profile.display_name || '').toLowerCase()
    const matchByName =
      pUsername === `@${profileUsername}` ||
      pUsername === profileUsername ||
      (profileDisplay && pUsername === profileDisplay)
    if ((matchById || matchByName) && p.role === 'PL' && p.result) {
      return p.result
    }
  }
  return null
}

function computeMilestones(
  sortedReports: PlayReport[],
  profile: Profile
): Map<string, Milestone[]> {
  const milestoneMap = new Map<string, Milestone[]>()
  let sessionCount = 0
  let foundFirstKP = false
  const thresholds = [10, 25, 50, 100]
  let nextThresholdIdx = 0

  for (const report of sortedReports) {
    sessionCount++
    const milestonesForReport: Milestone[] = []

    if (sessionCount === 1) {
      milestonesForReport.push({
        reportId: report.id,
        label: '初めてのセッション',
        icon: 'star',
      })
    }

    if (!foundFirstKP) {
      const roles = getUserRoles(report, profile)
      if (roles.includes('KP')) {
        foundFirstKP = true
        milestonesForReport.push({
          reportId: report.id,
          label: '初めてのKP',
          icon: 'trophy',
        })
      }
    }

    while (
      nextThresholdIdx < thresholds.length &&
      sessionCount >= thresholds[nextThresholdIdx]
    ) {
      milestonesForReport.push({
        reportId: report.id,
        label: `${thresholds[nextThresholdIdx]}セッション達成`,
        icon: 'trophy',
      })
      nextThresholdIdx++
    }

    if (milestonesForReport.length > 0) {
      milestoneMap.set(report.id, milestonesForReport)
    }
  }

  return milestoneMap
}

function buildTimeline(
  reports: PlayReport[],
  profile: Profile
): TimelineItem[] {
  if (reports.length === 0) return []

  const sorted = [...reports].sort(
    (a, b) =>
      new Date(a.play_date_start || a.created_at).getTime() -
      new Date(b.play_date_start || b.created_at).getTime()
  )

  const milestones = computeMilestones(sorted, profile)
  const items: TimelineItem[] = []
  let lastYear: number | null = null
  let lastMonth: number | null = null

  for (const report of sorted) {
    const date = new Date(report.play_date_start || report.created_at)
    const year = date.getFullYear()
    const month = date.getMonth()

    if (year !== lastYear) {
      lastYear = year
      lastMonth = null
      items.push({ type: 'year-header', year })
    }

    if (month !== lastMonth) {
      lastMonth = month
      items.push({ type: 'month-header', year, month })
    }

    // Insert milestones before the entry they correspond to
    const reportMilestones = milestones.get(report.id)
    if (reportMilestones) {
      for (const m of reportMilestones) {
        items.push({ type: 'milestone', milestone: m })
      }
    }

    const roles = getUserRoles(report, profile)
    items.push({ type: 'entry', report, roles })
  }

  return items
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`
}

function TimelineEntry({
  report,
  roles,
  profile,
}: {
  report: PlayReport
  roles: string[]
  profile: Profile
}) {
  const result = getUserResult(report, profile)
  const resultInfo = result ? RESULT_LABELS[result] || null : null

  return (
    <Link
      href={`/reports/${report.id}`}
      className="group relative pl-10 block"
    >
      {/* Dot on timeline */}
      <div className="absolute left-[9px] top-4 w-2 h-2 rounded-full bg-border group-hover:bg-primary transition-colors" />

      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
        {/* Thumbnail */}
        <div className="w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
          {report.cover_image_url ? (
            <Image
              src={report.cover_image_url}
              alt={report.scenario_name}
              width={40}
              height={40}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-bold">
              {report.scenario_name.charAt(0)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            {report.scenario_name}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {roles.map((role) => (
              <Badge
                key={role}
                variant="secondary"
                className={cn(
                  'text-[10px] px-1.5 py-0',
                  role === 'KP'
                    ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                    : 'bg-green-500/10 text-green-600 border-green-500/20'
                )}
              >
                {role}
              </Badge>
            ))}
            {resultInfo && (
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-md',
                  resultInfo.className
                )}
              >
                {resultInfo.label}
              </span>
            )}
          </div>
        </div>

        {/* Date & Duration */}
        <div className="text-right shrink-0 space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(report.play_date_start)}</span>
          </div>
          {report.play_duration && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{report.play_duration}h</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

function MilestoneEntry({ milestone }: { milestone: Milestone }) {
  return (
    <div className="relative pl-10">
      {/* Diamond marker on timeline */}
      <div className="absolute left-[7px] top-3 w-3 h-3 rotate-45 bg-primary/80 border border-primary" />

      <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <Trophy className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-medium text-primary">
          {milestone.label}
        </span>
      </div>
    </div>
  )
}

function YearSection({
  year,
  items,
  defaultOpen,
  profile,
}: {
  year: number
  items: TimelineItem[]
  defaultOpen: boolean
  profile: Profile
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="relative pl-10 flex items-center gap-2 w-full text-left py-2 group">
        {/* Large dot for year */}
        <div className="absolute left-[7px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-foreground/80 border-2 border-background" />
        <span className="text-lg font-bold">{year}年</span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1">
        {items.map((item, idx) => {
          if (item.type === 'month-header') {
            return (
              <div key={`month-${item.year}-${item.month}`} className="relative pl-10 pt-3 pb-1">
                {/* Small dot for month */}
                <div className="absolute left-[9px] top-[18px] w-2 h-2 rounded-full bg-muted-foreground/40" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {MONTH_NAMES[item.month]}
                </span>
              </div>
            )
          }
          if (item.type === 'milestone') {
            return (
              <MilestoneEntry
                key={`milestone-${item.milestone.reportId}-${item.milestone.label}`}
                milestone={item.milestone}
              />
            )
          }
          if (item.type === 'entry') {
            return (
              <TimelineEntry
                key={`entry-${item.report.id}`}
                report={item.report}
                roles={item.roles}
                profile={profile}
              />
            )
          }
          return null
        })}
      </CollapsibleContent>
    </Collapsible>
  )
}

export function ActivityTimeline({
  reports,
  profile,
  currentUserId: _currentUserId,
}: ActivityTimelineProps) {
  const timeline = useMemo(() => buildTimeline(reports, profile), [reports, profile])

  if (reports.length === 0) {
    return (
      <div className="text-center py-12 bg-card/50 rounded-lg border border-border/50">
        <p className="text-muted-foreground">まだセッション記録がありません</p>
      </div>
    )
  }

  // Group timeline items by year for collapsible sections
  const yearGroups: { year: number; items: TimelineItem[] }[] = []
  let currentGroup: { year: number; items: TimelineItem[] } | null = null

  for (const item of timeline) {
    if (item.type === 'year-header') {
      currentGroup = { year: item.year, items: [] }
      yearGroups.push(currentGroup)
    } else if (currentGroup) {
      currentGroup.items.push(item)
    }
  }

  // Most recent year is the last one (sorted ascending)
  const mostRecentYear = yearGroups.length > 0 ? yearGroups[yearGroups.length - 1].year : null

  // Display in reverse chronological order (most recent year first)
  const reversedGroups = [...yearGroups].reverse()

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-[13px] top-0 bottom-0 w-px bg-border" />

      <div className="space-y-2">
        {reversedGroups.map((group) => (
          <YearSection
            key={group.year}
            year={group.year}
            items={group.items}
            defaultOpen={group.year === mostRecentYear}
            profile={profile}
          />
        ))}
      </div>
    </div>
  )
}
