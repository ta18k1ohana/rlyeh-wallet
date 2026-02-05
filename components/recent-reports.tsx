'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CalendarDays, Users, Clock } from 'lucide-react'
import type { PlayReport } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface RecentReportsProps {
  reports: PlayReport[]
}

export function RecentReports({ reports }: RecentReportsProps) {
  if (reports.length === 0) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">まだセッション記録がありません</p>
          <p className="text-sm text-muted-foreground mt-1">
            最初のセッションを記録してみましょう
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  )
}

function ReportCard({ report }: { report: PlayReport }) {
  const participantCount = report.participants?.length || 0
  const kpCount = report.participants?.filter(p => p.role === 'KP').length || 0
  const plCount = report.participants?.filter(p => p.role === 'PL').length || 0

  return (
    <Link href={`/reports/${report.id}`}>
      <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">{report.scenario_name}</h3>
                {report.result && (
                  <ResultBadge result={report.result} />
                )}
              </div>
              {report.scenario_author && (
                <p className="text-sm text-muted-foreground truncate mb-2">
                  作者: {report.scenario_author}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {formatDate(report.play_date_start)}
                </div>
                {participantCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    KP {kpCount} / PL {plCount}
                  </div>
                )}
                {report.play_duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {report.play_duration}h
                  </div>
                )}
              </div>
            </div>
            {report.profile && (
              <Avatar className="w-10 h-10 shrink-0 rounded-xl">
                <AvatarImage src={report.profile.avatar_url || undefined} className="rounded-xl" />
                <AvatarFallback className="bg-primary/20 text-primary text-xs rounded-xl">
                  {(report.profile.display_name || report.profile.username).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function ResultBadge({ result }: { result: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    success: { label: '成功', className: 'bg-primary/20 text-primary border-primary/30' },
    failure: { label: '失敗', className: 'bg-destructive/20 text-destructive border-destructive/30' },
    other: { label: 'その他', className: 'bg-muted text-muted-foreground border-border' },
  }

  const config = variants[result] || variants.other

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
