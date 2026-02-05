'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PlayReport } from '@/lib/types'

interface PlayRecordCardProps {
  report: PlayReport
  onToggleFavorite?: (id: string, isFavorite: boolean) => void
  showExpand?: boolean
  viewMode?: 'grid' | 'list'
}

export function PlayRecordCard({ report, onToggleFavorite, showExpand = true, viewMode = 'grid' }: PlayRecordCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  }

  const getResultLabel = (result: string | null) => {
    switch (result) {
      case 'success': return '成功'
      case 'failure': return '失敗'
      default: return null
    }
  }

  const getEndTypeLabel = (endType: string | null) => {
    switch (endType) {
      case 'clear': return 'クリア'
      case 'bad_end': return 'バッドエンド'
      case 'dead': return '全滅'
      case 'ongoing': return '継続中'
      default: return null
    }
  }

  // List view
  if (viewMode === 'list') {
    return (
      <Link href={`/reports/${report.id}`}>
        <div className="flex items-center gap-4 p-3 rounded-lg bg-card/50 border border-border/50 hover:bg-card/80 transition-colors">
          <div className="relative w-16 h-20 rounded overflow-hidden bg-muted shrink-0">
            {report.cover_image_url ? (
              <Image
                src={report.cover_image_url || "/placeholder.svg"}
                alt={report.scenario_name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
                <span className="text-xl font-bold text-muted-foreground/30">
                  {report.scenario_name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{report.scenario_name}</h3>
            {report.scenario_author && (
              <p className="text-sm text-muted-foreground truncate">{report.scenario_author}</p>
            )}
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span>{formatDate(report.play_date_start)}</span>
              {report.play_duration && <span>{report.play_duration}h</span>}
              {getResultLabel(report.result) && (
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-medium',
                  report.result === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                )}>
                  {getResultLabel(report.result)}
                </span>
              )}
            </div>
          </div>

          {onToggleFavorite && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={(e) => {
                e.preventDefault()
                onToggleFavorite(report.id, !report.is_favorite)
              }}
            >
              <Heart
                className={cn(
                  'h-4 w-4 transition-colors',
                  report.is_favorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                )}
              />
            </Button>
          )}
        </div>
      </Link>
    )
  }

  // Grid view (default)
  return (
    <div className="group">
      <Link href={`/reports/${report.id}`}>
        <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-muted">
          {report.cover_image_url ? (
            <Image
              src={report.cover_image_url || "/placeholder.svg"}
              alt={report.scenario_name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
              <span className="text-4xl font-bold text-muted-foreground/30">
                {report.scenario_name.charAt(0)}
              </span>
            </div>
          )}
        </div>
      </Link>
      
      <div className="mt-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link href={`/reports/${report.id}`}>
            <h3 className="font-medium text-sm truncate hover:underline">
              {report.scenario_name}
            </h3>
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">
            プレイ日 | {formatDate(report.play_date_start)}
          </p>
        </div>
        
        {onToggleFavorite && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={(e) => {
              e.preventDefault()
              onToggleFavorite(report.id, !report.is_favorite)
            }}
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-colors',
                report.is_favorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
              )}
            />
          </Button>
        )}
      </div>
      
      {showExpand && (
        <Button variant="ghost" size="sm" className="w-full mt-1 h-6 text-muted-foreground">
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

// Featured card variant (larger, horizontal layout)
export function FeaturedPlayRecordCard({ report }: { report: PlayReport }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  }

  return (
    <Link href={`/reports/${report.id}`} className="block">
      <div className="relative aspect-[3/4] sm:aspect-[4/5] w-40 sm:w-48 rounded-lg overflow-hidden bg-muted group">
        {report.cover_image_url ? (
          <Image
            src={report.cover_image_url || "/placeholder.svg"}
            alt={report.scenario_name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
            <span className="text-5xl font-bold text-muted-foreground/30">
              {report.scenario_name.charAt(0)}
            </span>
          </div>
        )}
        
        {/* Overlay with info */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <p className="text-white text-xs opacity-80">{report.profile?.display_name || report.profile?.username}</p>
          <p className="text-white/70 text-xs">プレイ日 | {formatDate(report.play_date_start)}</p>
        </div>
        
        {/* Expand button */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
          <ChevronDown className="h-4 w-4 text-white/60" />
        </div>
      </div>
    </Link>
  )
}
