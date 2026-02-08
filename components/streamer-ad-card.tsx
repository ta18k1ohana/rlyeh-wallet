'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Video, X, ExternalLink } from 'lucide-react'
import type { PlayReport, Profile } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

interface StreamerAdCardProps {
    report: PlayReport
    streamer: Profile
    onDismiss?: () => void
    canHideAds?: boolean
}

export function StreamerAdCard({
    report,
    streamer,
    onDismiss,
    canHideAds = false
}: StreamerAdCardProps) {

    async function trackImpression(type: 'view' | 'click' | 'dismiss') {
        try {
            const supabase = createClient()
            await supabase.from('streamer_ad_impressions').insert({
                play_report_id: report.id,
                impression_type: type,
            })
        } catch (e) {
            // Silent fail for tracking
        }
    }

    React.useEffect(() => {
        trackImpression('view')
    }, [report.id])

    function handleClick() {
        trackImpression('click')
    }

    function handleDismiss() {
        trackImpression('dismiss')
        onDismiss?.()
    }

    return (
        <Card className="relative overflow-hidden border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-transparent">
            {/* Ad Label */}
            <div className="absolute top-2 left-2 z-10">
                <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-600">
                    <Video className="w-3 h-3 mr-1" />
                    配信者のおすすめ
                </Badge>
            </div>

            {/* Dismiss button (Pro+) */}
            {canHideAds && onDismiss && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10 h-6 w-6"
                    onClick={handleDismiss}
                >
                    <X className="w-4 h-4" />
                </Button>
            )}

            <CardContent className="pt-10 pb-4">
                <Link
                    href={`/reports/${report.id}`}
                    onClick={handleClick}
                    className="block hover:opacity-90 transition-opacity"
                >
                    {/* Cover Image */}
                    {report.cover_image_url && (
                        <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden">
                            <Image
                                src={report.cover_image_url}
                                alt={report.scenario_name}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div className="space-y-2">
                        <h3 className="font-semibold line-clamp-1">{report.scenario_name}</h3>

                        {report.scenario_author && (
                            <p className="text-sm text-muted-foreground">
                                著: {report.scenario_author}
                            </p>
                        )}

                        {/* Streamer Info */}
                        <div className="flex items-center gap-2 pt-2 border-t">
                            <Avatar className="w-6 h-6">
                                <AvatarImage src={streamer.avatar_url || undefined} />
                                <AvatarFallback>
                                    {streamer.display_name?.[0] || streamer.username[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {streamer.display_name || streamer.username}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    @{streamer.username}
                                </p>
                            </div>
                            <Badge variant="outline" className="text-purple-600 border-purple-500/30">
                                <Video className="w-3 h-3 mr-1" />
                                配信者
                            </Badge>
                        </div>
                    </div>
                </Link>

                {/* CTA */}
                <div className="mt-3 pt-3 border-t">
                    <Link href={`/user/${streamer.username}`}>
                        <Button variant="outline" size="sm" className="w-full">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            プロフィールを見る
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}
