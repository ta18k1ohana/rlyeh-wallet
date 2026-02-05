'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ImagePlus, X, Loader2, Plus, Crown } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  className?: string
  aspectRatio?: 'square' | 'video' | 'wide'
  disabled?: boolean
}

export function ImageUpload({ value, onChange, className, aspectRatio = 'video', disabled = false }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[2/1]',
  }
  
  const isCircular = className?.includes('rounded-full')
  const isRoundedXl = className?.includes('rounded-xl')
  const hasCustomShape = isCircular || isRoundedXl

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('無効なファイル形式です', {
        description: 'JPG, PNG, GIF, WebP のみ対応しています',
      })
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('ファイルが大きすぎます', {
        description: '最大5MBまでアップロード可能です',
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      onChange(data.url as string)
      toast.success('画像をアップロードしました')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('アップロードに失敗しました')
    } finally {
      setIsUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  async function handleRemove() {
    if (!value) return

    try {
      await fetch('/api/upload/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: value }),
      })
      onChange(null)
      toast.success('画像を削除しました')
    } catch (error) {
      console.error('Delete error:', error)
      // Still remove from state even if delete fails
      onChange(null)
    }
  }

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />

      {value ? (
        <div className={cn(
          'relative overflow-hidden bg-muted',
          isCircular ? 'rounded-full w-full h-full' : isRoundedXl ? 'rounded-xl w-full h-full' : 'rounded-lg',
          hasCustomShape ? '' : aspectClasses[aspectRatio]
        )}>
          <Image
            src={value || "/placeholder.svg"}
            alt="Uploaded image"
            fill
            className="object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className={cn(
              'absolute h-8 w-8',
              hasCustomShape ? 'bottom-0 right-0' : 'top-2 right-2'
            )}
            onClick={handleRemove}
            disabled={isUploading || disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading || disabled}
          className={cn(
            'w-full border-2 border-dashed border-border hover:border-primary/50 transition-colors',
            'flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground',
            'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
            isCircular ? 'rounded-full w-full h-full' : isRoundedXl ? 'rounded-xl w-full h-full' : 'rounded-lg',
            hasCustomShape ? '' : aspectClasses[aspectRatio]
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className={cn('animate-spin', hasCustomShape ? 'h-6 w-6' : 'h-8 w-8')} />
              {!hasCustomShape && <span className="text-sm">アップロード中...</span>}
            </>
          ) : (
            <>
              <ImagePlus className={cn(hasCustomShape ? 'h-6 w-6' : 'h-8 w-8')} />
              {!hasCustomShape && (
                <>
                  <span className="text-sm">画像を追加</span>
                  <span className="text-xs text-muted-foreground">JPG, PNG, GIF, WebP (最大5MB)</span>
                </>
              )}
            </>
          )}
        </button>
      )}
    </div>
  )
}

// MultiImageUpload - Component for uploading multiple images
interface MultiImageUploadProps {
  values: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  maxImageSize?: number // in MB
  disabled?: boolean
  showLimitWarning?: boolean
}

export function MultiImageUpload({
  values,
  onChange,
  maxImages = 3,
  maxImageSize = 2,
  disabled = false,
  showLimitWarning = false,
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('無効なファイル形式です', {
        description: 'JPG, PNG, GIF, WebP のみ対応しています',
      })
      return
    }

    // Validate file size
    const maxSize = maxImageSize * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('ファイルが大きすぎます', {
        description: `最大${maxImageSize}MBまでアップロード可能です`,
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      onChange([...values, data.url as string])
      toast.success('画像をアップロードしました')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('アップロードに失敗しました')
    } finally {
      setIsUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  async function handleRemove(index: number) {
    const url = values[index]
    
    try {
      await fetch('/api/upload/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
    } catch (error) {
      console.error('Delete error:', error)
    }
    
    onChange(values.filter((_, i) => i !== index))
    toast.success('画像を削除しました')
  }

  const canAddMore = values.length < maxImages

  return (
    <div className="space-y-3">
      {showLimitWarning && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
          <Crown className="w-3 h-3" />
          <span>無料プランでは{maxImages}枚まで。アップグレードで最大20枚まで追加可能</span>
        </div>
      )}
      
      <div className="grid grid-cols-3 gap-3">
        {values.map((url, index) => (
          <div key={url} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <Image
              src={url || "/placeholder.svg"}
              alt={`追加画像 ${index + 1}`}
              fill
              className="object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6"
              onClick={() => handleRemove(index)}
              disabled={isUploading || disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        
        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading || disabled}
            className={cn(
              'aspect-square border-2 border-dashed border-border hover:border-primary/50 rounded-lg',
              'flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground',
              'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors'
            )}
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <Plus className="h-6 w-6" />
                <span className="text-xs">{values.length}/{maxImages}</span>
              </>
            )}
          </button>
        )}
      </div>
      
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading || disabled}
      />
    </div>
  )
}
