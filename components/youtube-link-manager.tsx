'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Youtube, Plus, Trash2, Loader2, ExternalLink, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import type { YouTubeLink } from '@/lib/types'

export interface YouTubeLinkInput {
  youtube_url: string
  title: string
  thumbnail_url: string | null
  link_type: 'main' | 'clip' | 'playlist'
}

interface YouTubeLinkManagerProps {
  links: YouTubeLinkInput[]
  onChange: (links: YouTubeLinkInput[]) => void
  maxLinks?: number
  disabled?: boolean
  showLimitWarning?: boolean
}

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
    /youtube\.com\/playlist\?list=([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Get thumbnail URL from video ID
function getThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
}

// Check if URL is a playlist
function isPlaylist(url: string): boolean {
  return url.includes('playlist?list=')
}

export function YouTubeLinkManager({
  links,
  onChange,
  maxLinks = 10,
  disabled = false,
  showLimitWarning = false,
}: YouTubeLinkManagerProps) {
  const [newUrl, setNewUrl] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<YouTubeLinkInput['link_type']>('main')
  const [loading, setLoading] = useState(false)

  async function handleAddLink() {
    if (!newUrl.trim()) {
      toast.error('URLを入力してください')
      return
    }

    if (links.length >= maxLinks) {
      toast.error(`最大${maxLinks}件までです`)
      return
    }

    setLoading(true)

    const videoId = extractYouTubeId(newUrl)
    if (!videoId) {
      toast.error('有効なYouTube URLを入力してください')
      setLoading(false)
      return
    }

    // Determine link type based on URL
    let detectedType = newType
    if (isPlaylist(newUrl)) {
      detectedType = 'playlist'
    } else if (newUrl.includes('/shorts/')) {
      detectedType = 'clip'
    }

    const thumbnailUrl = isPlaylist(newUrl) ? null : getThumbnailUrl(videoId)

    const newLink: YouTubeLinkInput = {
      youtube_url: newUrl.trim(),
      title: newTitle.trim() || '',
      thumbnail_url: thumbnailUrl,
      link_type: detectedType,
    }

    onChange([...links, newLink])
    setNewUrl('')
    setNewTitle('')
    setNewType('main')
    setLoading(false)
    toast.success('リンクを追加しました')
  }

  function handleRemoveLink(index: number) {
    onChange(links.filter((_, i) => i !== index))
  }

  function handleUpdateLink(index: number, field: keyof YouTubeLinkInput, value: string) {
    const updated = [...links]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const linkTypeLabels: Record<YouTubeLinkInput['link_type'], string> = {
    main: '本編',
    clip: '切り抜き',
    playlist: 'プレイリスト',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Youtube className="w-5 h-5 text-red-500" />
        <Label className="text-base">YouTube連携</Label>
      </div>

      {/* Existing Links */}
      {links.length > 0 && (
        <div className="space-y-3">
          {links.map((link, index) => (
            <Card key={index} className="bg-muted/30 border-border/50 overflow-hidden">
              <CardContent className="p-0">
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  {link.thumbnail_url ? (
                    <div className="relative w-32 h-20 flex-shrink-0 bg-muted">
                      <Image
                        src={link.thumbnail_url || "/placeholder.svg"}
                        alt={link.title || 'YouTube thumbnail'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-20 flex-shrink-0 bg-muted flex items-center justify-center">
                      <Youtube className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 py-2 pr-2 min-w-0">
                    <div className="flex items-start gap-2">
                      <GripVertical className="w-4 h-4 mt-1 text-muted-foreground cursor-grab flex-shrink-0" />
                      <div className="flex-1 min-w-0 space-y-1">
                        <Input
                          value={link.title}
                          onChange={(e) => handleUpdateLink(index, 'title', e.target.value)}
                          placeholder="タイトル（任意）"
                          className="h-7 text-sm"
                          disabled={disabled}
                        />
                        <div className="flex items-center gap-2">
                          <Select
                            value={link.link_type}
                            onValueChange={(v) => handleUpdateLink(index, 'link_type', v)}
                            disabled={disabled}
                          >
                            <SelectTrigger className="h-7 w-24 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="main">本編</SelectItem>
                              <SelectItem value="clip">切り抜き</SelectItem>
                              <SelectItem value="playlist">プレイリスト</SelectItem>
                            </SelectContent>
                          </Select>
                          <a
                            href={link.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary truncate flex-1"
                          >
                            <ExternalLink className="w-3 h-3 inline mr-1" />
                            {link.youtube_url}
                          </a>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
                        onClick={() => handleRemoveLink(index)}
                        disabled={disabled}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Link */}
      {links.length < maxLinks && (
        <div className="space-y-3 p-4 border border-dashed border-border rounded-lg">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">YouTube URL</Label>
              <Input
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                disabled={disabled || loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">タイトル（任意）</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="動画タイトル"
                disabled={disabled || loading}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={newType}
              onValueChange={(v: YouTubeLinkInput['link_type']) => setNewType(v)}
              disabled={disabled || loading}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">本編</SelectItem>
                <SelectItem value="clip">切り抜き</SelectItem>
                <SelectItem value="playlist">プレイリスト</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddLink}
              disabled={disabled || loading || !newUrl.trim()}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              追加
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {links.length}/{maxLinks}件 • 本編、切り抜き、プレイリストのリンクを追加できます
          </p>
        </div>
      )}

      {/* Limit Warning */}
      {showLimitWarning && links.length >= maxLinks && (
        <p className="text-xs text-amber-600">
          YouTube リンクの上限に達しました。
        </p>
      )}
    </div>
  )
}

// YouTube embed component for display
interface YouTubeEmbedProps {
  url: string
  title?: string
  className?: string
}

export function YouTubeEmbed({ url, title, className }: YouTubeEmbedProps) {
  const videoId = extractYouTubeId(url)
  
  if (!videoId || isPlaylist(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <Youtube className="w-4 h-4" />
        {title || 'YouTubeで視聴'}
      </a>
    )
  }

  return (
    <div className={`relative aspect-video rounded-lg overflow-hidden ${className}`}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title || 'YouTube video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  )
}
