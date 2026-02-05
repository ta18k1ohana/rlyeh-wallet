import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import type { UserTier } from '@/lib/types'

// Use service role for webhook to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

  // Update user profile with subscription info
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      tier,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      tier_started_at: new Date().toISOString(),
      is_pro: tier === 'pro' || tier === 'streamer',
      is_streamer: tier === 'streamer',
    })
    .eq('id', userId)

  if (error) {
    console.error('Failed to update profile after checkout:', error)
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id
  const tier = subscription.metadata?.tier as UserTier

  if (!userId) {
    // Try to find user by customer ID
    const customerId = subscription.customer as string
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (!profile) {
      console.error('Could not find user for subscription update')
      return
    }

    const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()
    const status = subscription.status

    // Determine tier from subscription items if not in metadata
    let subscriptionTier: UserTier = 'free'
    if (tier) {
      subscriptionTier = tier
    } else if (subscription.items.data[0]?.price.unit_amount) {
      const amount = subscription.items.data[0].price.unit_amount
      if (amount >= 500) {
        subscriptionTier = 'streamer'
      } else if (amount >= 300) {
        subscriptionTier = 'pro'
      }
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        tier: status === 'active' ? subscriptionTier : 'free',
        tier_expires_at: currentPeriodEnd,
        stripe_subscription_id: subscription.id,
        is_pro: status === 'active' && (subscriptionTier === 'pro' || subscriptionTier === 'streamer'),
        is_streamer: status === 'active' && subscriptionTier === 'streamer',
      })
      .eq('id', profile.id)

    if (error) {
      console.error('Failed to update profile:', error)
    }
    return
  }

  const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()
  const status = subscription.status

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      tier: status === 'active' ? (tier || 'pro') : 'free',
      tier_expires_at: currentPeriodEnd,
      stripe_subscription_id: subscription.id,
      is_pro: status === 'active' && (tier === 'pro' || tier === 'streamer'),
      is_streamer: status === 'active' && tier === 'streamer',
    })
    .eq('id', userId)

  if (error) {
    console.error('Failed to update profile:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) {
    console.error('Could not find user for subscription deletion')
    return
  }

  // Downgrade to free tier
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      tier: 'free',
      is_pro: false,
      is_streamer: false,
      stripe_subscription_id: null,
      tier_expires_at: null,
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
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profile) {
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: profile.id,
        type: 'system',
        content: 'お支払いに失敗しました。カード情報をご確認ください。',
      })
  }
}
