import 'server-only'

import Stripe from 'stripe'

let _stripe: Stripe | null = null

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not set')
      }
      _stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    }
    const value = (_stripe as Record<string | symbol, unknown>)[prop]
    if (typeof value === 'function') {
      return value.bind(_stripe)
    }
    return value
  },
})
