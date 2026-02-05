'use client'

import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, Users, Trophy, Library } from 'lucide-react'

interface WalletStatsProps {
  totalSessions: number
  asKP: number
  asPL: number
  uniqueScenarios: number
}

export function WalletStats({ totalSessions, asKP, asPL, uniqueScenarios }: WalletStatsProps) {
  const stats = [
    { icon: BookOpen, label: '総セッション', value: totalSessions },
    { icon: Users, label: 'KP回数', value: asKP },
    { icon: Trophy, label: 'PL回数', value: asPL },
    { icon: Library, label: 'シナリオ数', value: uniqueScenarios },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="bg-card/50 border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
