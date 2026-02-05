'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, Crown, Sparkles, Video, Loader2 } from 'lucide-react'
import { SUBSCRIPTION_PRODUCTS, type SubscriptionProduct } from '@/lib/subscription-products'
import { SubscriptionCheckout } from '@/components/subscription-checkout'
import { createCustomerPortalSession } from '@/app/actions/stripe'
import { toast } from 'sonner'
import type { Profile, UserTier } from '@/lib/types'

export default function PricingPage() {
  const router = useRouter()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
      setLoading(false)
    }
    fetchProfile()
  }, [])

  async function handleManageSubscription() {
    setPortalLoading(true)
    try {
      const url = await createCustomerPortalSession()
      window.location.href = url
    } catch (error) {
      toast.error('サブスクリプション管理ページを開けませんでした')
      setPortalLoading(false)
    }
  }

  const currentTier = profile?.tier || 'free'

  function getPriceDisplay(product: SubscriptionProduct) {
    if (product.tier === 'free') return '¥0'
    const price = billingPeriod === 'yearly' ? product.priceYearlyYen : product.priceMonthlyYen
    return `¥${price.toLocaleString()}`
  }

  function getPeriodDisplay(product: SubscriptionProduct) {
    if (product.tier === 'free') return ''
    return billingPeriod === 'yearly' ? '/年' : '/月'
  }

  function getSavings(product: SubscriptionProduct) {
    if (product.tier === 'free' || billingPeriod !== 'yearly') return null
    const monthlyCost = product.priceMonthlyYen * 12
    const yearlyCost = product.priceYearlyYen
    const savings = monthlyCost - yearlyCost
    if (savings > 0) {
      return `年間 ¥${savings.toLocaleString()} お得`
    }
    return null
  }

  function getIcon(tier: UserTier) {
    switch (tier) {
      case 'pro':
        return <Crown className="w-6 h-6 text-amber-500" />
      case 'streamer':
        return <Video className="w-6 h-6 text-purple-500" />
      default:
        return <Sparkles className="w-6 h-6 text-muted-foreground" />
    }
  }

  function getButtonContent(product: SubscriptionProduct) {
    const isCurrentPlan = currentTier === product.tier
    const isUpgrade = getTierLevel(product.tier) > getTierLevel(currentTier)
    const isDowngrade = getTierLevel(product.tier) < getTierLevel(currentTier)

    if (isCurrentPlan) {
      return (
        <Button variant="outline" disabled className="w-full bg-transparent">
          現在のプラン
        </Button>
      )
    }

    if (product.tier === 'free') {
      if (profile?.stripe_subscription_id) {
        return (
          <Button 
            variant="outline" 
            className="w-full bg-transparent"
            onClick={handleManageSubscription}
            disabled={portalLoading}
          >
            {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ダウングレード'}
          </Button>
        )
      }
      return null
    }

    return (
      <SubscriptionCheckout 
        productId={product.id}
        billingPeriod={billingPeriod}
        trigger={
          <Button 
            className="w-full" 
            variant={product.highlighted ? 'default' : 'outline'}
          >
            {isUpgrade ? 'アップグレード' : isDowngrade ? 'プラン変更' : '登録する'}
          </Button>
        }
      />
    )
  }

  function getTierLevel(tier: UserTier): number {
    switch (tier) {
      case 'free': return 0
      case 'pro': return 1
      case 'streamer': return 2
      default: return 0
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">料金プラン</h1>
        <p className="text-muted-foreground">
          あなたのTRPGライフに合わせたプランをお選びください
        </p>

        <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as 'monthly' | 'yearly')} className="inline-flex">
          <TabsList>
            <TabsTrigger value="monthly">月額</TabsTrigger>
            <TabsTrigger value="yearly">
              年額
              <Badge variant="secondary" className="ml-2 text-xs">2ヶ月分お得</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Current subscription info */}
      {profile?.stripe_subscription_id && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">現在のプラン: {SUBSCRIPTION_PRODUCTS.find(p => p.tier === currentTier)?.name}</p>
                {profile.tier_expires_at && (
                  <p className="text-sm text-muted-foreground">
                    次回更新日: {new Date(profile.tier_expires_at).toLocaleDateString('ja-JP')}
                  </p>
                )}
              </div>
              <Button 
                variant="outline" 
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="bg-transparent"
              >
                {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'サブスクリプション管理'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {SUBSCRIPTION_PRODUCTS.map((product) => (
          <Card 
            key={product.id} 
            className={`relative ${product.highlighted ? 'border-primary shadow-lg' : 'border-border/50'} ${currentTier === product.tier ? 'ring-2 ring-primary' : ''}`}
          >
            {product.highlighted && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                おすすめ
              </Badge>
            )}
            
            <CardHeader className="text-center">
              <div className="mx-auto mb-2">
                {getIcon(product.tier)}
              </div>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>

            <CardContent className="text-center space-y-6">
              <div>
                <span className="text-4xl font-bold">{getPriceDisplay(product)}</span>
                <span className="text-muted-foreground">{getPeriodDisplay(product)}</span>
                {getSavings(product) && (
                  <p className="text-sm text-green-600 mt-1">{getSavings(product)}</p>
                )}
              </div>

              <ul className="space-y-3 text-sm text-left">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              {getButtonContent(product)}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* FAQ or additional info */}
      <div className="text-center text-sm text-muted-foreground space-y-2">
        <p>* 価格は全て税込みです</p>
        <p>* いつでもキャンセル可能です（期間終了まで利用可能）</p>
        <p>* ダウングレード時、既存データは保持されます（一部機能に制限がかかります）</p>
      </div>
    </div>
  )
}
