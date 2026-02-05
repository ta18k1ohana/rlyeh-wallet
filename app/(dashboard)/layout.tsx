import React from "react"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Create profile if it doesn't exist
  if (!profile) {
    const username = user.user_metadata?.username || `user_${user.id.slice(0, 8)}`
    await supabase.from('profiles').insert({
      id: user.id,
      username,
      display_name: user.user_metadata?.display_name || username,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav user={user} profile={profile} />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
