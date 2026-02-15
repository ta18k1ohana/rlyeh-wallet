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

      {/* Favorite Scenarios — visually prominent */}
      {favoriteReports.length > 0 && (
        <div className="md:col-span-2">
          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            好きなシナリオ
          </p>
          <div className={`grid gap-3 ${favoriteReports.length === 1 ? 'grid-cols-1 max-w-xs' :
              favoriteReports.length === 2 ? 'grid-cols-2 max-w-lg' :
                'grid-cols-2 sm:grid-cols-3'
            }`}>
            {favoriteReports.map((report) => (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                className="group block"
              >
                <div className="relative overflow-hidden rounded-xl border border-border/40 transition-all duration-300 hover:shadow-lg hover:shadow-black/[0.08] dark:hover:shadow-black/30 hover:-translate-y-0.5 hover:border-border/60">
                  {report.cover_image_url ? (
                    <div className="relative aspect-[3/4] bg-muted/30">
                      <Image
                        src={report.cover_image_url}
                        alt={report.scenario_name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      {/* Gradient overlay for text */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-sm font-semibold text-white leading-snug line-clamp-2 drop-shadow-md">
                          {report.scenario_name}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[3/4] bg-gradient-to-br from-muted/50 to-muted/80 flex flex-col items-center justify-center p-4 gap-3">
                      <svg className="w-10 h-10 text-muted-foreground/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20" />
                      </svg>
                      <p className="text-sm font-semibold text-foreground/80 text-center leading-snug line-clamp-3">
                        {report.scenario_name}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
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
