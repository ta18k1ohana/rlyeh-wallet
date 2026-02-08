import type { UserTier, Profile } from './types'

// Tier limits configuration
export const TIER_LIMITS = {
  free: {
    maxImages: 5,
    maxImageSize: 1200, // px
    maxLinks: 5,
    maxImpressionLength: 500,
    maxFollowing: 100,
    maxFriends: 50,
    maxTagsPerReport: 1, // Free: 1 tag per report
    canExportData: false,
    canUseCustomTags: false,
    canUseFolders: false,
    canUseCustomUrl: false,
    canUseHeaderImage: false,
    canUseMiniCharacter: false,
    canUseCustomTheme: false,
    canAcceptViewerComments: false,
    canAcceptFusetter: false,
    canBeFollowed: false, // Only streamers can be followed
    hasProBadge: false,
    hasStreamerBadge: false,
    // Pro Plan: Matching features
    canUseMatching: false,
    canHideAds: false,
    maxScenarioPreferences: 0,
  },
  pro: {
    maxImages: 20,
    maxImageSize: 2400, // px
    maxLinks: 20,
    maxImpressionLength: 5000,
    maxFollowing: 500,
    maxFriends: 200,
    maxTagsPerReport: 5, // Pro+: 5 tags per report
    canExportData: true,
    canUseCustomTags: true,
    canUseFolders: true,
    canUseCustomUrl: false,
    canUseHeaderImage: false,
    canUseMiniCharacter: false,
    canUseCustomTheme: false,
    canAcceptViewerComments: false,
    canAcceptFusetter: false,
    canBeFollowed: false,
    hasProBadge: true,
    hasStreamerBadge: false,
    // Pro Plan: Matching features
    canUseMatching: true,
    canHideAds: true,
    maxScenarioPreferences: 10,
  },
  streamer: {
    maxImages: 50,
    maxImageSize: 4800, // px
    maxLinks: 50,
    maxImpressionLength: 10000,
    maxFollowing: 1000,
    maxFriends: 500,
    maxTagsPerReport: 5, // Streamer: 5 tags per report
    canExportData: true,
    canUseCustomTags: true,
    canUseFolders: true,
    canUseCustomUrl: true,
    canUseHeaderImage: true,
    canUseMiniCharacter: true,
    canUseCustomTheme: true,
    canAcceptViewerComments: true,
    canAcceptFusetter: true,
    canBeFollowed: true,
    hasProBadge: true,
    hasStreamerBadge: true,
    // Pro Plan: Matching features (inherited)
    canUseMatching: true,
    canHideAds: true,
    maxScenarioPreferences: 10,
    // Streamer Plan: Ad distribution
    canDistributeAds: true,
  },
} as const

export type TierLimits = typeof TIER_LIMITS[UserTier]

// Get limits for a given tier
export function getTierLimits(tier: UserTier): TierLimits {
  return TIER_LIMITS[tier]
}

// Get limits for a profile (handles null/undefined tier)
export function getProfileLimits(profile: Profile | null | undefined): TierLimits {
  const tier = profile?.tier || 'free'
  return TIER_LIMITS[tier]
}

// Check if user has reached a specific limit
export function hasReachedLimit(
  profile: Profile | null | undefined,
  limitKey: keyof TierLimits,
  currentValue: number
): boolean {
  const limits = getProfileLimits(profile)
  const limit = limits[limitKey]

  if (typeof limit === 'number') {
    return currentValue >= limit
  }

  return false
}

// Check if user can use a feature
export function canUseFeature(
  profile: Profile | null | undefined,
  featureKey: keyof TierLimits
): boolean {
  const limits = getProfileLimits(profile)
  const feature = limits[featureKey]

  return feature === true
}

// Get remaining count for a limit
export function getRemainingCount(
  profile: Profile | null | undefined,
  limitKey: keyof TierLimits,
  currentValue: number
): number {
  const limits = getProfileLimits(profile)
  const limit = limits[limitKey]

  if (typeof limit === 'number') {
    return Math.max(0, limit - currentValue)
  }

  return 0
}

// Tier display names
export const TIER_DISPLAY_NAMES: Record<UserTier, string> = {
  free: '無料',
  pro: 'Pro',
  streamer: '配信者',
}

// Tier pricing (monthly in JPY)
export const TIER_PRICING: Record<UserTier, number> = {
  free: 0,
  pro: 500,
  streamer: 1500,
}

// Check if tier is active (not expired)
export function isTierActive(profile: Profile | null | undefined): boolean {
  if (!profile) return false
  if (profile.tier === 'free') return true

  if (profile.tier_expires_at) {
    return new Date(profile.tier_expires_at) > new Date()
  }

  return true
}

// Get effective tier (considering expiration)
export function getEffectiveTier(profile: Profile | null | undefined): UserTier {
  if (!profile) return 'free'

  if (!isTierActive(profile)) {
    return 'free'
  }

  return profile.tier || 'free'
}

// Tier badge colors
export const TIER_BADGE_COLORS: Record<UserTier, { bg: string; text: string; border: string }> = {
  free: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
  pro: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    border: 'border-amber-500/30',
  },
  streamer: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600',
    border: 'border-purple-500/30',
  },
}
