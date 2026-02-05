'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { X, Plus, Tag, Crown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getProfileLimits, getEffectiveTier } from '@/lib/tier-limits'
import type { Profile, ReportTag } from '@/lib/types'

interface ReportTagInputProps {
  reportId: string
  profile: Profile | null
  initialTags?: ReportTag[]
  onTagsChange?: (tags: ReportTag[]) => void
  disabled?: boolean
}

export function ReportTagInput({
  reportId,
  profile,
  initialTags = [],
  onTagsChange,
  disabled = false
}: ReportTagInputProps) {
  const [tags, setTags] = useState<ReportTag[]>(initialTags)
  const [inputValue, setInputValue] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  
  // Get limits based on profile tier
  const limits = getProfileLimits(profile)
  const effectiveTier = getEffectiveTier(profile)
  const maxTags = limits.maxTagsPerReport
  const canAddMore = tags.length < maxTags

  // Sync with initial tags when they change
  useEffect(() => {
    setTags(initialTags)
  }, [initialTags])

  const handleAddTag = useCallback(async () => {
    const tagName = inputValue.trim()
    
    if (!tagName) return
    
    // Check if tag already exists
    if (tags.some(t => t.tag_name.toLowerCase() === tagName.toLowerCase())) {
      toast.error('同じタグが既に存在します')
      return
    }
    
    // Check limit
    if (tags.length >= maxTags) {
      if (effectiveTier === 'free') {
        toast.error('無料プランでは1つまでタグを追加できます。Proプランにアップグレードすると5つまで追加可能です。')
      } else {
        toast.error(`タグは${maxTags}つまで追加できます`)
      }
      return
    }
    
    setIsAdding(true)
    
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('report_tags')
        .insert({
          play_report_id: reportId,
          tag_name: tagName
        })
        .select()
        .single()
      
      if (error) throw error
      
      const newTags = [...tags, data]
      setTags(newTags)
      onTagsChange?.(newTags)
      setInputValue('')
      toast.success('タグを追加しました')
    } catch (error) {
      console.error('Add tag error:', error)
      toast.error('タグの追加に失敗しました')
    } finally {
      setIsAdding(false)
    }
  }, [inputValue, tags, maxTags, effectiveTier, reportId, onTagsChange])

  const handleRemoveTag = useCallback(async (tagId: string) => {
    setIsRemoving(tagId)
    
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('report_tags')
        .delete()
        .eq('id', tagId)
      
      if (error) throw error
      
      const newTags = tags.filter(t => t.id !== tagId)
      setTags(newTags)
      onTagsChange?.(newTags)
      toast.success('タグを削除しました')
    } catch (error) {
      console.error('Remove tag error:', error)
      toast.error('タグの削除に失敗しました')
    } finally {
      setIsRemoving(null)
    }
  }, [tags, onTagsChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Tag className="w-4 h-4" />
          タグ
        </Label>
        <span className="text-xs text-muted-foreground">
          {tags.length} / {maxTags}
          {effectiveTier === 'free' && tags.length >= 1 && (
            <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
              <Crown className="w-3 h-3" />
              Proで5つまで
            </span>
          )}
        </span>
      </div>
      
      {/* Current tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="pl-2 pr-1 py-1 gap-1 text-sm"
            >
              {tag.tag_name}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                disabled={disabled || isRemoving === tag.id}
                className="ml-1 p-0.5 rounded-full hover:bg-muted-foreground/20 transition-colors"
              >
                {isRemoving === tag.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <X className="w-3 h-3" />
                )}
              </button>
            </Badge>
          ))}
        </div>
      )}
      
      {/* Add tag input */}
      {canAddMore && (
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="卓名、何陣目、略称など"
            disabled={disabled || isAdding}
            className="flex-1"
            maxLength={50}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddTag}
            disabled={disabled || isAdding || !inputValue.trim()}
            className="shrink-0 bg-transparent"
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}
      
      {/* Hint text */}
      <p className="text-xs text-muted-foreground">
        例: 卓名、〇陣目、シナリオ略称などを追加できます
      </p>
    </div>
  )
}

// Simple display component for showing tags (read-only)
interface ReportTagDisplayProps {
  tags: ReportTag[]
  className?: string
  maxDisplay?: number
}

export function ReportTagDisplay({ tags, className, maxDisplay = 3 }: ReportTagDisplayProps) {
  if (!tags || tags.length === 0) return null
  
  const displayTags = maxDisplay ? tags.slice(0, maxDisplay) : tags
  const remainingCount = tags.length - displayTags.length
  
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {displayTags.map(tag => (
        <Badge
          key={tag.id}
          variant="outline"
          className="text-[10px] px-1.5 py-0 h-5 font-normal bg-muted/50"
        >
          {tag.tag_name}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 h-5 font-normal text-muted-foreground"
        >
          +{remainingCount}
        </Badge>
      )}
    </div>
  )
}
