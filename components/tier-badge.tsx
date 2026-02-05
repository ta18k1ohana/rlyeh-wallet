'use client'

import { cn } from '@/lib/utils'
import { TIER_BADGE_COLORS, TIER_DISPLAY_NAMES, getEffectiveTier } from '@/lib/tier-limits'
import type { Profile, UserTier } from '@/lib/types'
import { Crown, Star } from 'lucide-react'

interface TierBadgeProps {
  profile?: Profile | null
  tier?: UserTier
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

export function TierBadge({ 
  profile, 
  tier: tierProp, 
  size = 'sm',
  showIcon = true,
  className 
}: TierBadgeProps) {
  const tier = tierProp || getEffectiveTier(profile)
  
  // Don't show badge for free tier
  if (tier === 'free') return null
  
  const colors = TIER_BADGE_COLORS[tier]
  const displayName = TIER_DISPLAY_NAMES[tier]
  
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-0.5',
    md: 'text-xs px-2 py-0.5 gap-1',
    lg: 'text-sm px-2.5 py-1 gap-1.5',
  }
  
  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }
  
  const Icon = tier === 'streamer' ? Crown : Star
  
  return (
    <span 
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        colors.bg,
        colors.text,
        colors.border,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {displayName}
    </span>
  )
}

// Compact version for tight spaces
export function TierIcon({ 
  profile, 
  tier: tierProp, 
  size = 'sm',
  className 
}: Omit<TierBadgeProps, 'showIcon'>) {
  const tier = tierProp || getEffectiveTier(profile)
  
  // Don't show icon for free tier
  if (tier === 'free') return null
  
  const colors = TIER_BADGE_COLORS[tier]
  
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }
  
  const Icon = tier === 'streamer' ? Crown : Star
  
  return (
    <Icon className={cn(sizeClasses[size], colors.text, className)} />
  )
}
