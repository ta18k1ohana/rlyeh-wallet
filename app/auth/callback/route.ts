import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[auth/callback] Code exchange failed:', error.message)
      return NextResponse.redirect(new URL('/auth/error', requestUrl.origin))
    }

    if (user) {
      // Check if profile exists
      const { data: existingProfile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', user.id)
        .single()

      if (profileFetchError && profileFetchError.code !== 'PGRST116') {
        // PGRST116 = "not found" which is expected for new users
        console.error('[auth/callback] Profile fetch failed:', profileFetchError.message)
        return NextResponse.redirect(new URL('/auth/error', requestUrl.origin))
      }

      if (!existingProfile) {
        // New user - create a placeholder profile and redirect to onboarding
        // Use upsert to handle race conditions and retry scenarios
        const tempUsername = `pending_${user.id.slice(0, 12)}`

        const { error: upsertError } = await supabase.from('profiles').upsert(
          {
            id: user.id,
            username: tempUsername,
            display_name: null,
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          },
          { onConflict: 'id' }
        )

        if (upsertError) {
          console.error('[auth/callback] Profile creation failed:', upsertError.message)
          return NextResponse.redirect(new URL('/auth/error', requestUrl.origin))
        }

        // Redirect to onboarding for new users
        return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
      }

      // Check if existing user hasn't completed onboarding
      if (existingProfile.username?.startsWith('pending_')) {
        return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
      }
    }
  }

  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}
