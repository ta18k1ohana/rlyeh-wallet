import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import type { UserTier } from '@/lib/types'

// Lazy-initialize to avoid build-time errors when env vars aren't available
let _supabaseAdmin: SupabaseClient | null = null
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _supabaseAdmin
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutComplete(session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id
  const tier = session.metadata?.tier as UserTier

  if (!userId || !tier) {
    console.error('Missing metadata in checkout session')
    return
  }

  // Retrieve subscription to get current_period_end for tier_expires_at
  let tierExpiresAt: string | null = null
  if (session.subscription) {
    try {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      tierExpiresAt = new Date(subscription.current_period_end * 1000).toISOString()
    } catch (err) {
      console.error('Failed to retrieve subscription for expiry:', err)
    }
  }

  // Update user profile with subscription info
  const { error } = await getSupabaseAdmin()
    .from('profiles')
    .update({
      tier,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      tier_started_at: new Date().toISOString(),
      tier_expires_at: tierExpiresAt,
      is_pro: tier === 'pro' || tier === 'streamer',
      is_streamer: tier === 'streamer',
      former_tier: null, // Clear former_tier on new subscription
    })
    .eq('id', userId)

  if (error) {
    console.error('Failed to update profile after checkout:', error)
  }
}

async function determineTierFromSubscription(subscription: Stripe.Subscription): Promise<UserTier> {
  // Priority 1: metadata.tier (set during checkout)
  const metadataTier = subscription.metadata?.tier as UserTier
  if (metadataTier && ['pro', 'streamer'].includes(metadataTier)) {
    return metadataTier
  }

  // Priority 2: determine from price amount (JPY)
  // Pro = ¥500/month or ¥5,000/year
  // Streamer = ¥1,200/month or ¥12,000/year
  const priceItem = subscription.items.data[0]?.price
  if (priceItem?.unit_amount) {
    const amount = priceItem.unit_amount
    const interval = priceItem.recurring?.interval
    if (interval === 'year') {
      // Yearly: Streamer ¥12,000, Pro ¥5,000
      if (amount >= 10000) return 'streamer'
      if (amount >= 4000) return 'pro'
    } else {
      // Monthly: Streamer ¥1,200, Pro ¥500
      if (amount >= 1000) return 'streamer'
      if (amount >= 400) return 'pro'
    }
  }

  return 'free'
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()
  const status = subscription.status
  const subscriptionTier = await determineTierFromSubscription(subscription)

  // Find user: by metadata or by customer ID
  let profileId = userId
  if (!profileId) {
    const customerId = subscription.customer as string
    const { data: profile } = await getSupabaseAdmin()
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (!profile) {
      console.error('Could not find user for subscription update')
      return
    }
    profileId = profile.id
  }

  const isActive = status === 'active'
  const effectiveTier = isActive ? subscriptionTier : 'free'

  const { error } = await getSupabaseAdmin()
    .from('profiles')
    .update({
      tier: effectiveTier,
      tier_expires_at: currentPeriodEnd,
      stripe_subscription_id: subscription.id,
      is_pro: isActive && (subscriptionTier === 'pro' || subscriptionTier === 'streamer'),
      is_streamer: isActive && subscriptionTier === 'streamer',
    })
    .eq('id', profileId)

  if (error) {
    console.error('Failed to update profile:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const { data: profile } = await getSupabaseAdmin()
    .from('profiles')
    .select('id, tier')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) {
    console.error('Could not find user for subscription deletion')
    return
  }

  // Save current tier as former_tier for grey badge display
  const formerTier = profile.tier !== 'free' ? profile.tier : null

  // Downgrade to free tier — data is preserved, only new additions are restricted
  const { error } = await getSupabaseAdmin()
    .from('profiles')
    .update({
      tier: 'free',
      is_pro: false,
      is_streamer: false,
      stripe_subscription_id: null,
      tier_expires_at: null,
      former_tier: formerTier,
    })
    .eq('id', profile.id)

  if (error) {
    console.error('Failed to downgrade profile:', error)
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Payment succeeded, subscription continues
  console.log('Payment succeeded for invoice:', invoice.id)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Payment failed - Stripe will retry automatically
  // You could send a notification to the user here
  console.log('Payment failed for invoice:', invoice.id)
  
  const customerId = invoice.customer as string
  
  // Optionally create a notification for the user
  const { data: profile } = await getSupabaseAdmin()
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profile) {
    await getSupabaseAdmin()
      .from('notifications')
      .insert({
        user_id: profile.id,
        type: 'system',
        content: 'お支払いに失敗しました。カード情報をご確認ください。',
      })
  }
}
