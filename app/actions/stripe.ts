'use server'

import { stripe } from '@/lib/stripe'
import { SUBSCRIPTION_PRODUCTS } from '@/lib/subscription-products'
import { createClient } from '@/lib/supabase/server'

export async function createCheckoutSession(productId: string, billingPeriod: 'monthly' | 'yearly' = 'monthly') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('認証が必要です')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email:id')
    .eq('id', user.id)
    .single()

  const product = SUBSCRIPTION_PRODUCTS.find(p => p.id === productId || p.tier === productId.replace('-monthly', '').replace('-yearly', ''))
  
  if (!product || product.tier === 'free') {
    throw new Error('無効なプランです')
  }

  const priceInYen = billingPeriod === 'yearly' ? product.priceYearlyYen : product.priceMonthlyYen

  // Get or create Stripe customer
  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        supabase_user_id: user.id,
      },
    })
    customerId = customer.id

    // Save customer ID to profile
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    line_items: [
      {
        price_data: {
          currency: 'jpy',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: priceInYen,
          recurring: {
            interval: billingPeriod === 'yearly' ? 'year' : 'month',
          },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        tier: product.tier,
        billing_period: billingPeriod,
      },
    },
    metadata: {
      supabase_user_id: user.id,
      tier: product.tier,
    },
  })

  return session.client_secret
}

export async function createCustomerPortalSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('認証が必要です')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    throw new Error('サブスクリプション情報がありません')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings`,
  })

  return session.url
}

export async function cancelSubscription() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('認証が必要です')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_subscription_id) {
    throw new Error('サブスクリプションが見つかりません')
  }

  // Cancel at period end (user keeps access until end of billing period)
  await stripe.subscriptions.update(profile.stripe_subscription_id, {
    cancel_at_period_end: true,
  })

  return { success: true }
}

export async function resumeSubscription() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('認証が必要です')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_subscription_id) {
    throw new Error('サブスクリプションが見つかりません')
  }

  // Resume subscription
  await stripe.subscriptions.update(profile.stripe_subscription_id, {
    cancel_at_period_end: false,
  })

  return { success: true }
}
