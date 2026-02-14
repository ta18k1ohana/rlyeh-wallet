'use client'

import React from 'react'
import { DashboardStats } from '@/components/dashboard-stats'
import { TrendingScenarios } from '@/components/trending-scenarios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface TrendingScenario {
    name: string
    author: string | null
    count: number
    trend: 'up' | 'new' | 'stable'
}

interface RightSidebarProps {
    // Stats
    totalReports: number
    thisMonthReports: number
    friendsCount: number
    uniqueAuthors: number
    uniqueScenarios: number
    // Trending
    trendingScenarios: TrendingScenario[]
    isMeasuring?: boolean
    measurementDay?: number
}

export function RightSidebar({
    totalReports,
    thisMonthReports,
    friendsCount,
    uniqueAuthors,
    uniqueScenarios,
    trendingScenarios,
    isMeasuring,
    measurementDay,
}: RightSidebarProps) {
    return (
        <div className="space-y-4 py-4">
            {/* Search Box */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="検索"
                    className="pl-10 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
                />
            </div>

            {/* Stats Card - Compact */}
            <Card className="bg-muted/30 border-border/50">
                <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-base">あなたの統計</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="text-center p-2 rounded-lg bg-background/50">
                            <p className="text-2xl font-bold">{totalReports}</p>
                            <p className="text-xs text-muted-foreground">通過済み</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-background/50">
                            <p className="text-2xl font-bold">{thisMonthReports}</p>
                            <p className="text-xs text-muted-foreground">今月</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-background/50">
                            <p className="text-2xl font-bold">{friendsCount}</p>
                            <p className="text-xs text-muted-foreground">フレンド</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-background/50">
                            <p className="text-2xl font-bold">{uniqueScenarios}</p>
                            <p className="text-xs text-muted-foreground">シナリオ</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Trending */}
            {(isMeasuring || trendingScenarios.length > 0) && (
                <TrendingScenarios scenarios={trendingScenarios} isMeasuring={isMeasuring} measurementDay={measurementDay} />
            )}

            {/* Footer Links */}
            <div className="px-4 text-xs text-muted-foreground space-y-2">
                <div className="flex flex-wrap gap-x-2 gap-y-1">
                    <a href="/terms" className="hover:underline">利用規約</a>
                    <a href="/privacy" className="hover:underline">プライバシー</a>
                    <a href="/pricing" className="hover:underline">料金プラン</a>
                </div>
                <p>© 2024 R'lyeh Wallet</p>
            </div>
        </div>
    )
}
