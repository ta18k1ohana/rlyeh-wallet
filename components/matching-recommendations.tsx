'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, Users, ArrowRight, Heart, Wand2 } from 'lucide-react'
import type { PlayReport, Profile } from '@/lib/types'

interface MatchingRecommendationsProps {
    // KPs who ran scenarios user wants to play
    kpReports: PlayReport[]
    // Users who want to play scenarios user can run
    interestedPlayers: {
        profile: Profile
        scenarioName: string
    }[]
    // Link to manage preferences
    onManageClick?: () => void
}

export function MatchingRecommendations({
    kpReports,
    interestedPlayers,
    onManageClick,
}: MatchingRecommendationsProps) {
    const hasKpReports = kpReports.length > 0
    const hasPlayers = interestedPlayers.length > 0

    if (!hasKpReports && !hasPlayers) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                    <Sparkles className="w-10 h-10 mx-auto text-amber-500 mb-4" />
                    <h3 className="font-semibold mb-2">マッチング機能</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        シナリオ希望を設定して、次の卓を見つけましょう！
                    </p>
                    <Button onClick={onManageClick}>
                        <Heart className="w-4 h-4 mr-2" />
                        シナリオ希望を設定
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {/* KP Reports Section */}
            {hasKpReports && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Wand2 className="w-4 h-4 text-amber-500" />
                            あなたの回りたいシナリオをKPした人
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {kpReports.slice(0, 5).map((report) => (
                            <Link
                                key={report.id}
                                href={`/reports/${report.id}`}
                                className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src={report.profile?.avatar_url || undefined} />
                                    <AvatarFallback>
                                        {report.profile?.display_name?.[0] || report.profile?.username?.[0] || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                        {report.profile?.display_name || report.profile?.username}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {report.scenario_name}をKPとしてプレイ
                                    </p>
                                </div>
                                <Badge variant="secondary" className="shrink-0">KP</Badge>
                            </Link>
                        ))}

                        {kpReports.length > 5 && (
                            <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                                もっと見る ({kpReports.length - 5}件)
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Interested Players Section */}
            {hasPlayers && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-500" />
                            あなたの回せるシナリオに興味があるPL
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {interestedPlayers.slice(0, 5).map(({ profile, scenarioName }, index) => (
                            <Link
                                key={`${profile.id}-${index}`}
                                href={`/user/${profile.username}`}
                                className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src={profile.avatar_url || undefined} />
                                    <AvatarFallback>
                                        {profile.display_name?.[0] || profile.username[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                        {profile.display_name || profile.username}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        「{scenarioName}」を回りたい
                                    </p>
                                </div>
                                <Badge variant="outline" className="shrink-0 text-green-600">
                                    PL希望
                                </Badge>
                            </Link>
                        ))}

                        {interestedPlayers.length > 5 && (
                            <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                                もっと見る ({interestedPlayers.length - 5}件)
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
