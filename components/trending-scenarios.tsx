'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flame, TrendingUp, ChevronRight, BarChart3 } from 'lucide-react'

interface TrendingScenario {
    name: string
    author: string | null
    count: number
    trend: 'up' | 'new' | 'stable'
}

interface TrendingScenariosProps {
    scenarios: TrendingScenario[]
    isMeasuring?: boolean
    measurementDay?: number
}

export function TrendingScenarios({ scenarios, isMeasuring, measurementDay }: TrendingScenariosProps) {
    const showMeasuring = isMeasuring || scenarios.length === 0

    return (
        <Card className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    今月のトレンド
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                {showMeasuring ? (
                    <div className="py-4 space-y-4">
                        {/* Measuring animation */}
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <BarChart3 className="w-5 h-5 animate-pulse text-orange-500" />
                            <span className="text-sm font-medium">集計中...</span>
                        </div>
                        {isMeasuring ? (
                            <>
                                {/* Progress bar for first 3 days */}
                                <div className="space-y-2">
                                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                                            style={{ width: `${((measurementDay || 1) / 3) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-center text-muted-foreground">
                                        {measurementDay || 1}日目 / 3日間
                                    </p>
                                </div>
                                <p className="text-xs text-center text-muted-foreground leading-relaxed">
                                    今月の記録を集計しています。<br />
                                    4日以降にランキングが表示されます。
                                </p>
                            </>
                        ) : (
                            <p className="text-xs text-center text-muted-foreground leading-relaxed">
                                今月はまだ記録がありません。<br />
                                セッションが記録されるとランキングが表示されます。
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {scenarios.slice(0, 5).map((scenario, index) => (
                            <Link
                                key={scenario.name}
                                href={`/search?q=${encodeURIComponent(scenario.name)}`}
                                className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors group"
                            >
                                {/* Rank */}
                                <span className={`
                w-6 h-6 flex items-center justify-center text-sm font-bold rounded-full
                ${index === 0 ? 'bg-amber-500/20 text-amber-500' : ''}
                ${index === 1 ? 'bg-gray-400/20 text-gray-400' : ''}
                ${index === 2 ? 'bg-orange-600/20 text-orange-600' : ''}
                ${index > 2 ? 'text-muted-foreground' : ''}
              `}>
                                    {index + 1}
                                </span>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                        {scenario.name}
                                    </p>
                                    {scenario.author && (
                                        <p className="text-xs text-muted-foreground truncate">
                                            {scenario.author}
                                        </p>
                                    )}
                                </div>

                                {/* Trend indicator */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {scenario.trend === 'new' && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-500">
                                            NEW
                                        </Badge>
                                    )}
                                    {scenario.trend === 'up' && (
                                        <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                        {scenario.count}件
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
