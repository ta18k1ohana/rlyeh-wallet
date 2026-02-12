'use client'

import { cn } from '@/lib/utils'
import type { YouTubeLink } from '@/lib/types'
import { Play, ExternalLink, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

/**
 * Get YouTube thumbnail URL from video ID
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

// ================================
// Display Component (for report view)
// ================================

interface YouTubeEmbedProps {
  youtubeLinks: YouTubeLink[]
  className?: string
}

export function YouTubeEmbed({ youtubeLinks, className }: YouTubeEmbedProps) {
  const [playingId, setPlayingId] = useState<string | null>(null)

  if (!youtubeLinks || youtubeLinks.length === 0) return null

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
        <Play className="w-4 h-4" />
        関連動画
      </h3>
      <div className="space-y-3">
        {youtubeLinks.map((link) => {
          const videoId = extractYouTubeId(link.youtube_url)
          if (!videoId) return null

          const isPlaying = playingId === link.id

          return (
            <div key={link.id} className="rounded-lg overflow-hidden border border-border/50">
              {isPlaying ? (
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                    title={link.title || 'YouTube動画'}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <button
                  onClick={() => setPlayingId(link.id)}
                  className="relative w-full group cursor-pointer"
                >
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <img
                      src={link.thumbnail_url || getYouTubeThumbnail(videoId)}
                      alt={link.title || 'YouTube動画'}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                </button>
              )}
              {link.title && (
                <div className="p-2 flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{link.title}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {link.link_type === 'clip' && (
                      <span className="bg-muted px-1.5 py-0.5 rounded">切り抜き</span>
                    )}
                    {link.link_type === 'playlist' && (
                      <span className="bg-muted px-1.5 py-0.5 rounded">プレイリスト</span>
                    )}
                    <a
                      href={link.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ================================
// Edit Component (for report edit form)
// ================================

interface YouTubeLinkInput {
  youtube_url: string
  title: string
  link_type: 'main' | 'clip' | 'playlist'
}

interface YouTubeLinksEditorProps {
  values: YouTubeLinkInput[]
  onChange: (values: YouTubeLinkInput[]) => void
  disabled?: boolean
  className?: string
}

export function YouTubeLinksEditor({
  values,
  onChange,
  disabled = false,
  className,
}: YouTubeLinksEditorProps) {
  const addLink = () => {
    onChange([...values, { youtube_url: '', title: '', link_type: 'main' }])
  }

  const removeLink = (index: number) => {
    onChange(values.filter((_, i) => i !== index))
  }

  const updateLink = (index: number, field: keyof YouTubeLinkInput, value: string) => {
    const updated = [...values]
    updated[index] = { ...updated[index], [field]: value }

    // Auto-fill thumbnail preview
    if (field === 'youtube_url') {
      const videoId = extractYouTubeId(value)
      if (videoId && !updated[index].title) {
        // Title will be fetched or entered manually
      }
    }

    onChange(updated)
  }

  return (
    <div className={cn('space-y-3', className)}>
      {values.map((link, index) => {
        const videoId = extractYouTubeId(link.youtube_url)

        return (
          <div key={index} className="rounded-lg border border-border/50 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <div>
                  <Label className="text-xs">YouTube URL</Label>
                  <Input
                    value={link.youtube_url}
                    onChange={(e) => updateLink(index, 'youtube_url', e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    disabled={disabled}
                    className="text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">タイトル</Label>
                    <Input
                      value={link.title}
                      onChange={(e) => updateLink(index, 'title', e.target.value)}
                      placeholder="動画タイトル"
                      disabled={disabled}
                      className="text-sm"
                    />
                  </div>
                  <div className="w-32">
                    <Label className="text-xs">種類</Label>
                    <Select
                      value={link.link_type}
                      onValueChange={(v) => updateLink(index, 'link_type', v)}
                      disabled={disabled}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">本編</SelectItem>
                        <SelectItem value="clip">切り抜き</SelectItem>
                        <SelectItem value="playlist">プレイリスト</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeLink(index)}
                disabled={disabled}
                className="shrink-0 mt-5"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            {videoId && (
              <div className="rounded overflow-hidden">
                <img
                  src={getYouTubeThumbnail(videoId)}
                  alt="プレビュー"
                  className="w-full max-w-xs h-auto object-cover rounded"
                />
              </div>
            )}
          </div>
        )
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addLink}
        disabled={disabled}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-1" />
        YouTube動画を追加
      </Button>
    </div>
  )
}
