'use client'

import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import {
    Gamepad2,
    Calendar,
    Users,
    BookOpen,
    Trophy,
    TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatItem {
    label: string
    value: number | string
    icon: React.ReactNode
    href?: string
    color?: string
    subtext?: string
}

interface DashboardStatsProps {
    totalReports: number
    thisMonthReports: number
    friendsCount: number
    uniqueAuthors: number
    uniqueScenarios: number
}

export function DashboardStats({
    totalReports,
    thisMonthReports,
    friendsCount,
    uniqueAuthors,
    uniqueScenarios,
}: DashboardStatsProps) {
    const stats: StatItem[] = [
        {
            label: '通過済み',
            value: totalReports,
            icon: <Gamepad2 className="w-5 h-5" />,
            href: '/mypage',
            color: 'text-purple-500',
            subtext: 'シナリオ',
        },
        {
            label: '今月',
            value: thisMonthReports,
            icon: <Calendar className="w-5 h-5" />,
            href: '/mypage',
            color: 'text-blue-500',
            subtext: '卓',
        },
        {
            label: 'フレンド',
            value: friendsCount,
            icon: <Users className="w-5 h-5" />,
            href: '/friends',
            color: 'text-green-500',
            subtext: '人',
        },
        {
            label: '作者',
            value: uniqueAuthors,
            icon: <BookOpen className="w-5 h-5" />,
            color: 'text-amber-500',
            subtext: '人の作品',
        },
        {
            label: 'シナリオ',
            value: uniqueScenarios,
            icon: <Trophy className="w-5 h-5" />,
            color: 'text-pink-500',
            subtext: '種類',
        },
    ]

    return (
        <div className="relative">
            {/* Gradient fade on right edge */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {stats.map((stat, index) => {
                    const content = (
                        <Card
                            className={cn(
                                'flex-shrink-0 p-4 min-w-[120px] bg-card/60 backdrop-blur-sm',
                                'border-border/50 hover:border-border hover:bg-card/80',
                                'transition-all duration-200 cursor-pointer',
                                'group'
                            )}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className={cn('p-2 rounded-lg bg-muted/50', stat.color)}>
                                    {stat.icon}
                                </div>
                                {stat.href && (
                                    <TrendingUp className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                                <p className="text-xs text-muted-foreground">
                                    {stat.label}
                                    {stat.subtext && <span className="opacity-70"> {stat.subtext}</span>}
                                </p>
                            </div>
                        </Card>
                    )

                    if (stat.href) {
                        return (
                            <Link key={index} href={stat.href}>
                                {content}
                            </Link>
                        )
                    }

                    return <div key={index}>{content}</div>
                })}
            </div>
        </div>
    )
}
