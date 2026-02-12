import type { UserTier } from './types'

export interface SubscriptionProduct {
  id: string
  tier: UserTier
  name: string
  description: string
  priceMonthlyYen: number
  priceYearlyYen: number
  features: string[]
  highlighted?: boolean
}

// Subscription products - prices in JPY (Japanese Yen)
export const SUBSCRIPTION_PRODUCTS: SubscriptionProduct[] = [
  {
    id: 'free',
    tier: 'free',
    name: '無料プラン',
    description: '基本的な記録機能',
    priceMonthlyYen: 0,
    priceYearlyYen: 0,
    features: [
      'セッション記録（無制限）',
      '画像アップロード（5枚/1200px）',
      '関連リンク（5個）',
      '感想メモ（500文字）',
      'フォロー（100人）/ フレンド（50人）',
      'タグ（1個/レポート）',
    ],
  },
  {
    id: 'pro-monthly',
    tier: 'pro',
    name: 'Proプラン',
    description: 'ヘビーユーザー向け',
    priceMonthlyYen: 500,
    priceYearlyYen: 5000, // 2ヶ月分お得
    highlighted: true,
    features: [
      '無料プランの全機能',
      '画像アップロード（無制限/2400px）',
      '関連リンク（無制限）',
      '感想メモ（無制限・Markdown対応）',
      'フォロー・フレンド（無制限）',
      'カスタムタグ（5個）・フォルダ',
      'プライベートノート',
      'データエクスポート',
      'Proバッジ表示',
      '広告非表示',
    ],
  },
  {
    id: 'streamer-monthly',
    tier: 'streamer',
    name: '配信者プラン',
    description: 'TRPGストリーマー向け',
    priceMonthlyYen: 1200,
    priceYearlyYen: 12000, // 2ヶ月分お得
    features: [
      'Proプランの全機能',
      '画像アップロード（無制限/原寸）',
      '関連リンク（無制限）',
      'YouTube動画埋め込み',
      'カスタムプロフィールURL',
      'ヘッダー画像設定',
      'ミニキャラクター設定',
      'フォロワー専用機能',
      '視聴者コメント受付',
      'ふせったー連携',
      '配信者バッジ表示',
    ],
  },
]

export function getProductByTier(tier: UserTier): SubscriptionProduct | undefined {
  return SUBSCRIPTION_PRODUCTS.find(p => p.tier === tier)
}

export function getProductById(productId: string): SubscriptionProduct | undefined {
  return SUBSCRIPTION_PRODUCTS.find(p => p.id === productId)
}
