'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Calendar, Edit3, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { PlayReport } from '@/lib/types'
import { ReportTagDisplay } from '@/components/report-tag-input'

interface SessionCardProps {
  report: PlayReport
  showAuthor?: boolean
  showEdit?: boolean
  compact?: boolean
}

export function SessionCard({ 
  report, 
  showAuthor = false,
  showEdit = false,
  compact = false 
}: SessionCardProps) {
  const router = useRouter()
  const [likesCount, setLikesCount] = useState(report.likes_count || 0)
  const [hasLiked, setHasLiked] = useState(report.user_has_liked || false)
  const [isLiking, setIsLiking] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  }

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    
    if (isLiking) return
    setIsLiking(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      toast.error('いいねするにはログインが必要です')
      setIsLiking(false)
      return
    }

    try {
      if (hasLiked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('play_report_id', report.id)
          .eq('user_id', user.id)
        
        setLikesCount(prev => Math.max(0, prev - 1))
        setHasLiked(false)
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            play_report_id: report.id,
            user_id: user.id
          })
        
        if (error && error.code !== '23505') { // Ignore duplicate key error
          throw error
        }

        setLikesCount(prev => prev + 1)
        setHasLiked(true)

        // Create notification for report owner if different from current user
        if (report.user_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: report.user_id,
            type: 'like',
            from_user_id: user.id,
            play_report_id: report.id,
          })
        }
      }
    } catch (error) {
      console.error('Like error:', error)
      toast.error('エラーが発生しました')
    } finally {
      setIsLiking(false)
    }
  }

  return (
    <div className="group">
      <Link href={`/reports/${report.id}`} className="block">
        {/* Card Container */}
        <div className={cn(
          "relative overflow-hidden rounded-xl",
          "bg-card border border-border/40",
          "transition-all duration-300 ease-out",
          "hover:shadow-xl hover:shadow-black/[0.08] dark:hover:shadow-black/30",
          "hover:border-border/60 hover:-translate-y-0.5"
        )}>
          {/* Image wrapper */}
          <div className={cn(
            "relative w-full bg-muted/30",
            compact ? "aspect-[4/3]" : "aspect-[4/3]"
          )}>
            {report.cover_image_url ? (
              <Image
                src={report.cover_image_url || "/placeholder.svg"}
                alt={report.scenario_name}
                fill
                className="object-contain p-3"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
                <span className="text-5xl font-extralight text-muted-foreground/20 tracking-widest">
                  {report.scenario_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            {/* Edit button overlay */}
            {showEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  router.push(`/reports/${report.id}/edit`)
                }}
                className="absolute top-2 right-2 p-2 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
              >
                <Edit3 className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Content area */}
          <div className="p-4 space-y-2.5">
            {/* Title */}
            <h3 className="font-medium text-sm leading-relaxed line-clamp-2 text-foreground/90 group-hover:text-foreground transition-colors">
              {report.scenario_name}
            </h3>
            
            {/* Tags */}
            {report.tags && report.tags.length > 0 && (
              <ReportTagDisplay tags={report.tags} maxDisplay={2} />
            )}
            
            {/* Author / Profile */}
            {showAuthor && report.profile && (
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  router.push(`/user/${report.profile!.username}`)
                }}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left"
              >
                <Avatar className="w-5 h-5 rounded-md">
                  <AvatarImage src={report.profile.avatar_url || undefined} className="rounded-md" />
                  <AvatarFallback className="text-[10px] rounded-md">
                    {(report.profile.display_name || report.profile.username)?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate">
                  {report.profile.display_name || report.profile.username}
                </span>
              </button>
            )}
            
            {/* Meta row */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {formatDate(report.play_date_start)}
              </span>
              
              {/* Like button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 -mr-2 rounded-full gap-1.5 hover:bg-red-500/10"
                onClick={handleLike}
                disabled={isLiking}
              >
                {isLiking ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Heart
                    className={cn(
                      'h-3.5 w-3.5 transition-all',
                      hasLiked 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-muted-foreground hover:text-red-400'
                    )}
                  />
                )}
                {likesCount > 0 && (
                  <span className={cn(
                    "text-xs",
                    hasLiked ? "text-red-500" : "text-muted-foreground"
                  )}>
                    {likesCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

/* Grid container with proper spacing */
export function SessionCardGrid({ 
  children, 
  columns = 4 
}: { 
  children: React.ReactNode
  columns?: 3 | 4 
}) {
  return (
    <div className={cn(
      "grid gap-5",
      columns === 4 
        ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" 
        : "grid-cols-2 md:grid-cols-3"
    )}>
      {children}
    </div>
  )
}
