'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Check, Sparkles } from 'lucide-react'

interface SuccessAnimationProps {
  show: boolean
  onComplete?: () => void
  message?: string
  duration?: number
}

export function SuccessAnimation({ 
  show, 
  onComplete, 
  message = 'セッション記録を作成しました',
  duration = 2000 
}: SuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      setIsAnimating(true)
      
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setTimeout(() => {
          setIsVisible(false)
          onComplete?.()
        }, 300)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [show, duration, onComplete])

  if (!isVisible) return null

  return (
    <div 
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300',
        isAnimating ? 'opacity-100' : 'opacity-0'
      )}
    >
      <div 
        className={cn(
          'flex flex-col items-center gap-6 transition-all duration-500',
          isAnimating ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        )}
      >
        {/* Animated Circle */}
        <div className="relative">
          {/* Outer ring animation */}
          <div className="absolute inset-0 animate-ping">
            <div className="w-24 h-24 rounded-full bg-primary/20" />
          </div>
          
          {/* Main circle */}
          <div className="relative w-24 h-24 rounded-full bg-primary flex items-center justify-center animate-scale-in">
            <Check className="w-12 h-12 text-primary-foreground animate-draw-check" />
          </div>

          {/* Sparkles */}
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-sparkle-1" />
          <Sparkles className="absolute -bottom-1 -left-3 w-5 h-5 text-yellow-400 animate-sparkle-2" />
          <Sparkles className="absolute top-0 -left-4 w-4 h-4 text-yellow-400 animate-sparkle-3" />
        </div>

        {/* Message */}
        <div className="text-center animate-fade-in-up">
          <h3 className="text-xl font-bold text-foreground">{message}</h3>
          <p className="text-muted-foreground mt-1">記録がウォレットに追加されました</p>
        </div>

        {/* Confetti-like particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'][i % 5],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
