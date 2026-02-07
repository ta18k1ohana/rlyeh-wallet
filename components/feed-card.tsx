'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Calendar, Clock, BookOpen, Loader2, Sparkles, Users, MessageCircle, Share, Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { PlayReport } from '@/lib/types'
import { ReportTagDisplay } from '@/components/report-tag-input'

interface FeedCardProps {
  report: PlayReport
  source?: 'friend' | 'following' | 'recommended'
}

function formatRelativeTime(dateString: string): string {
  const now = Date.now()
  const date = new Date(dateString).getTime()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / (1000 * 60))
  const diffHour = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)

  if (diffMin < 1) return 'たった今'
  if (diffMin < 60) return `${diffMin}分前`
  if (diffHour < 24) return `${diffHour}時間前`
  if (diffDay < 7) return `${diffDay}日前`
  if (diffWeek < 5) return `${diffWeek}週間前`
  if (diffMonth < 12) return `${diffMonth}ヶ月前`

  const d = new Date(dateString)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

export function FeedCard({ report, source }: FeedCardProps) {
  const router = useRouter()
  const [likesCount, setLikesCount] = useState(report.likes_count || 0)
  const [hasLiked, setHasLiked] = useState(report.user_has_liked || false)
  const [isLiking, setIsLiking] = useState(false)

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
        await supabase
          .from('likes')
          .delete()
          .eq('play_report_id', report.id)
          .eq('user_id', user.id)

        setLikesCount(prev => Math.max(0, prev - 1))
        setHasLiked(false)
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({
            play_report_id: report.id,
            user_id: user.id
          })

        if (error && error.code !== '23505') {
          throw error
        }

        setLikesCount(prev => prev + 1)
        setHasLiked(true)

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

  const profile = report.profile

  return (
    <div className="group">
      {/* Recommended badge — above post, like Twitter's "Suggested" */}
      {source === 'recommended' && (
        <div className="flex items-center gap-1.5 pl-16 px-4 pt-2.5 pb-0.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-medium text-muted-foreground">おすすめ</span>
        </div>
      )}

      <Link href={`/reports/${report.id}`} className="block">
        <article className="px-4 py-3 hover:bg-accent/50 transition-colors">
          {/* Twitter-style: Avatar left, content right */}
          <div className="flex gap-3">
            {/* Left column: Avatar */}
            {profile && (
              <div className="shrink-0 pt-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    router.push(`/user/${profile.username}`)
                  }}
                >
                  <Avatar className="w-10 h-10 rounded-full hover:opacity-80 transition-opacity">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-sm">
                      {(profile.display_name || profile.username)?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </div>
            )}

            {/* Right column: All content */}
            <div className="flex-1 min-w-0">
              {/* Name / handle / time row */}
              {profile && (
                <div className="flex items-center gap-1 text-[15px] leading-5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      router.push(`/user/${profile.username}`)
                    }}
                    className="font-bold truncate hover:underline"
                  >
                    {profile.display_name || profile.username}
                  </button>
                  <span className="text-muted-foreground truncate">
                    @{profile.username}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground whitespace-nowrap text-sm">
                    {formatRelativeTime(report.created_at)}
                  </span>
                </div>
              )}

              {/* Scenario title */}
              <h3 className="text-[15px] font-semibold leading-snug mt-0.5">
                {report.scenario_name}
              </h3>

              {/* Meta line */}
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground mt-1 flex-wrap">
                {report.scenario_author && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {report.scenario_author}
                  </span>
                )}
                {report.edition && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                    {report.edition}
                  </Badge>
                )}
                {report.play_duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {report.play_duration}h
                  </span>
                )}
                {report.play_date_start && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(report.play_date_start).toLocaleDateString('ja-JP')}
                  </span>
                )}
              </div>

              {/* Impression preview */}
              {report.impression && (
                <p className="text-[15px] text-foreground/90 line-clamp-3 mt-1 leading-normal">
                  {report.impression}
                </p>
              )}

              {/* Cover image */}
              {report.cover_image_url && (
                <div className="flex items-center justify-center rounded-2xl overflow-hidden bg-muted/30 mt-3 border border-border/60 max-h-[280px]">
                  <Image
                    src={report.cover_image_url}
                    alt={report.scenario_name}
                    width={600}
                    height={400}
                    className="max-w-full max-h-[278px] w-auto h-auto object-contain"
                    sizes="(max-width: 600px) 100vw, 600px"
                    unoptimized
                  />
                </div>
              )}

              {/* Participants */}
              {report.participants && report.participants.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                  <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <div className="flex items-center gap-1 flex-wrap">
                    {report.participants.map((p, idx) => {
                      const isTagged = p.user_id && p.username?.startsWith('@')
                      const participantProfile = p.profile
                      const displayName = isTagged && participantProfile
                        ? (participantProfile.display_name || participantProfile.username)
                        : (isTagged ? p.username.slice(1) : p.username)

                      return (
                        <span key={p.id || idx} className="inline-flex items-center">
                          {idx > 0 && <span className="text-muted-foreground/40 mr-1">,</span>}
                          {isTagged ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                const uname = participantProfile?.username || p.username.slice(1)
                                router.push(`/user/${uname}`)
                              }}
                              className="inline-flex items-center gap-1 hover:underline"
                            >
                              <Avatar className="w-4 h-4 rounded-full">
                                <AvatarImage src={participantProfile?.avatar_url || undefined} />
                                <AvatarFallback className="text-[8px]">
                                  {displayName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium">{displayName}</span>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  'text-[9px] px-1 py-0 h-3.5 leading-none',
                                  p.role === 'KP'
                                    ? 'bg-blue-500/10 text-blue-600'
                                    : 'bg-green-500/10 text-green-600'
                                )}
                              >
                                {p.role}
                              </Badge>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">{displayName}</span>
                              <Badge
                                variant="secondary"
                                className={cn(
                                  'text-[9px] px-1 py-0 h-3.5 leading-none',
                                  p.role === 'KP'
                                    ? 'bg-blue-500/10 text-blue-600'
                                    : 'bg-green-500/10 text-green-600'
                                )}
                              >
                                {p.role}
                              </Badge>
                            </span>
                          )}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Tags */}
              {report.tags && report.tags.length > 0 && (
                <div className="mt-2">
                  <ReportTagDisplay tags={report.tags} maxDisplay={3} />
                </div>
              )}

              {/* Actions row — Twitter-style spread */}
              <div className="flex items-center justify-between max-w-[300px] mt-1.5 -ml-2">
                {/* Comment (placeholder) */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary text-muted-foreground"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  disabled
                >
                  <MessageCircle className="h-[18px] w-[18px]" />
                </Button>

                {/* Like */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 rounded-full gap-1.5 hover:bg-red-500/10 hover:text-red-500"
                  onClick={handleLike}
                  disabled={isLiking}
                >
                  {isLiking ? (
                    <Loader2 className="h-[18px] w-[18px] animate-spin" />
                  ) : (
                    <Heart
                      className={cn(
                        'h-[18px] w-[18px] transition-all',
                        hasLiked
                          ? 'fill-red-500 text-red-500'
                          : 'text-muted-foreground'
                      )}
                    />
                  )}
                  {likesCount > 0 && (
                    <span className={cn(
                      "text-[13px]",
                      hasLiked ? "text-red-500" : "text-muted-foreground"
                    )}>
                      {likesCount}
                    </span>
                  )}
                </Button>

                {/* Bookmark (placeholder) */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary text-muted-foreground"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  disabled
                >
                  <Bookmark className="h-[18px] w-[18px]" />
                </Button>

                {/* Share (placeholder) */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary text-muted-foreground"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  disabled
                >
                  <Share className="h-[18px] w-[18px]" />
                </Button>
              </div>
            </div>
          </div>
        </article>
      </Link>

      {/* Separator */}
      <div className="border-b border-border/50" />
    </div>
  )
}
