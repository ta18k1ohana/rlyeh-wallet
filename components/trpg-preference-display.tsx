'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getRolePreferenceLabel } from '@/lib/trpg-preferences'
import type { Profile, PlayReport } from '@/lib/types'

interface TrpgPreferenceDisplayProps {
  profile: Profile
  favoriteReports: PlayReport[]
}

export function TrpgPreferenceDisplay({ profile, favoriteReports }: TrpgPreferenceDisplayProps) {
  const hasAnyPreferences =
    profile.role_preference ||
    (profile.favorite_report_ids?.length ?? 0) > 0 ||
    (profile.scenario_tags?.length ?? 0) > 0 ||
    (profile.play_style_tags?.length ?? 0) > 0 ||
    profile.play_style_other

  if (!hasAnyPreferences) {
    return (
      <div className="text-center py-8 bg-card/50 rounded-lg border border-border/50">
        <p className="text-muted-foreground text-sm">TRPG設定はまだ登録されていません</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Role Preference */}
      {profile.role_preference && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-muted-foreground mb-1">プレイスタイル</p>
            <p className="text-lg font-bold">
              {getRolePreferenceLabel(profile.role_preference)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Favorite Scenarios */}
      {favoriteReports.length > 0 && (
        <Card className="bg-card/50 border-border/50 md:col-span-2">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-muted-foreground mb-3">好きなシナリオ</p>
            <div className="flex gap-4 overflow-x-auto">
              {favoriteReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/reports/${report.id}`}
                  className="flex items-center gap-3 shrink-0 hover:opacity-80 transition-opacity"
                >
                  <div className="w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
                    {report.cover_image_url ? (
                      <Image
                        src={report.cover_image_url}
                        alt={report.scenario_name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                        —
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium">{report.scenario_name}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scenario Tags */}
      {(profile.scenario_tags?.length ?? 0) > 0 && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-muted-foreground mb-2">シナリオ傾向</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.scenario_tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Play Style */}
      {((profile.play_style_tags?.length ?? 0) > 0 || profile.play_style_other) && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4 pb-4 px-4">
            <p className="text-xs text-muted-foreground mb-2">得意な遊び方</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.play_style_tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {profile.play_style_other && (
                <Badge variant="outline" className="text-xs">
                  {profile.play_style_other}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
