'use client'

import { cn } from '@/lib/utils'
import { TIER_DISPLAY_NAMES, getEffectiveTier, getProfileLimits } from '@/lib/tier-limits'
import type { Profile } from '@/lib/types'
import { AlertTriangle, ArrowUpCircle } from 'lucide-react'
import Link from 'next/link'

interface UpgradeBannerProps {
  profile: Profile | null
  /** The limit key to check (e.g., 'maxImages', 'maxLinks') */
  limitKey?: keyof ReturnType<typeof getProfileLimits>
  /** Current count for the limit */
  currentCount?: number
  /** Custom message override */
  message?: string
  /** Custom feature name for display (e.g., '画像', 'リンク') */
  featureName?: string
  className?: string
}

/**
 * Shows a banner when user has exceeded their tier limits (e.g., after downgrade)
 * or when approaching limits. Links to pricing page for upgrade.
 */
export function UpgradeBanner({
  profile,
  limitKey,
  currentCount,
  message,
  featureName,
  className,
}: UpgradeBannerProps) {
  const tier = getEffectiveTier(profile)
  const limits = getProfileLimits(profile)

  // Determine if we should show the banner
  let shouldShow = false
  let bannerMessage = message || ''

  if (limitKey && currentCount !== undefined) {
    const limit = limits[limitKey]
    if (typeof limit === 'number' && limit !== Infinity && currentCount > limit) {
      shouldShow = true
      if (!message) {
        bannerMessage = `${featureName || limitKey}の上限（${limit}件）を超えています。現在${currentCount}件あるため、新規追加はできません。既存のデータはそのまま保持されます。`
      }
    }
  } else if (message) {
    shouldShow = true
  }

  if (!shouldShow) return null

  return (
    <div
      className={cn(
        'rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 sm:p-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {bannerMessage}
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
          >
            <ArrowUpCircle className="w-4 h-4" />
            プランをアップグレード
          </Link>
        </div>
      </div>
    </div>
  )
}

/**
 * Compact inline warning for use within forms
 */
export function UpgradeInlineWarning({
  profile,
  limitKey,
  currentCount,
  featureName,
  className,
}: Omit<UpgradeBannerProps, 'message'>) {
  const limits = getProfileLimits(profile)

  if (!limitKey || currentCount === undefined) return null

  const limit = limits[limitKey]
  if (typeof limit !== 'number' || limit === Infinity || currentCount <= limit) return null

  return (
    <p className={cn('text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1', className)}>
      <AlertTriangle className="w-3 h-3" />
      {featureName || limitKey}の上限（{limit}件）超過中 —
      <Link href="/pricing" className="underline hover:no-underline">
        アップグレード
      </Link>
    </p>
  )
}
