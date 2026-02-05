import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && user) {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        // New user - create a placeholder profile and redirect to onboarding
        // Use a temporary username that will be replaced in onboarding
        const tempUsername = `pending_${user.id.slice(0, 12)}`
        
        await supabase.from('profiles').insert({
          id: user.id,
          username: tempUsername,
          display_name: null,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        })
        
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
