'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flame, TrendingUp, ChevronRight } from 'lucide-react'

interface TrendingScenario {
    name: string
    author: string | null
    count: number
    trend: 'up' | 'new' | 'stable'
}

interface TrendingScenariosProps {
    scenarios: TrendingScenario[]
}

export function TrendingScenarios({ scenarios }: TrendingScenariosProps) {
    if (scenarios.length === 0) return null

    return (
        <Card className="bg-card/60 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    今月のトレンド
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
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
            </CardContent>
        </Card>
    )
}
