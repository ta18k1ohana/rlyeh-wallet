'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface MultiImageUploadProps {
  values: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  maxImageSize?: number // Max dimension in pixels
  disabled?: boolean
  showLimitWarning?: boolean
}

export function MultiImageUpload({ 
  values = [], 
  onChange, 
  maxImages = 10, 
  maxImageSize = 1200,
  disabled = false,
  showLimitWarning = false 
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Resize image if needed
  async function resizeImage(file: File, maxSize: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img')
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        
        // Only resize if larger than maxSize
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize
            width = maxSize
          } else {
            width = (width / height) * maxSize
            height = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Could not convert canvas to blob'))
            }
          },
          file.type,
          0.9
        )
      }
      img.onerror = () => reject(new Error('Could not load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remainingSlots = maxImages - values.length
    if (remainingSlots <= 0) {
      toast.error(`最大${maxImages}枚までアップロード可能です`)
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)
    
    // Validate all files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 5 * 1024 * 1024

    for (const file of filesToUpload) {
      if (!allowedTypes.includes(file.type)) {
        toast.error('無効なファイル形式です', {
          description: 'JPG, PNG, GIF, WebP のみ対応しています',
        })
        return
      }
      if (file.size > maxSize) {
        toast.error('ファイルが大きすぎます', {
          description: '最大5MBまでアップロード可能です',
        })
        return
      }
    }

    setIsUploading(true)
    const newUrls: string[] = []

    try {
      for (const file of filesToUpload) {
        // Resize image if needed
        const resizedBlob = await resizeImage(file, maxImageSize)
        const resizedFile = new File([resizedBlob], file.name, { type: file.type })
        
        const formData = new FormData()
        formData.append('file', resizedFile)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }

        const data = await response.json()
        newUrls.push(data.url)
      }

      onChange([...values, ...newUrls])
      toast.success(`${newUrls.length}枚の画像をアップロードしました`)
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

  async function handleRemove(urlToRemove: string) {
    try {
      await fetch('/api/upload/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToRemove }),
      })
    } catch (error) {
      console.error('Delete error:', error)
    }
    onChange(values.filter(url => url !== urlToRemove))
    toast.success('画像を削除しました')
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading || disabled}
        multiple
      />

      {/* Image Grid */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {values.map((url, index) => (
            <div 
              key={url} 
              className="relative group rounded-lg overflow-hidden bg-muted border border-border/50"
              style={{ maxWidth: '150px' }}
            >
              <Image
                src={url || "/placeholder.svg"}
                alt={`Image ${index + 1}`}
                width={150}
                height={150}
                className="w-auto h-auto max-w-[150px] max-h-[150px] object-contain"
                style={{ display: 'block' }}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(url)}
                disabled={isUploading || disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Button */}
      {values.length < maxImages && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading || disabled}
          className={cn(
            'w-full max-w-[200px] h-24 border-2 border-dashed border-border hover:border-primary/50 rounded-lg transition-colors',
            'flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground',
            'cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs">アップロード中...</span>
            </>
          ) : (
            <>
              <ImagePlus className="h-6 w-6" />
              <span className="text-xs">画像を追加</span>
              <span className="text-[10px] text-muted-foreground">
                {values.length}/{maxImages}枚
              </span>
            </>
          )}
        </button>
      )}
      
      {/* Tier limit warning */}
      {showLimitWarning && values.length >= maxImages && (
        <p className="text-xs text-amber-600">
          画像上限に達しました。Proプランにアップグレードすると最大20枚までアップロードできます。
        </p>
      )}
    </div>
  )
}
