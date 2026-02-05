'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Wallet, 
  Users,
  Settings,
  LogOut,
  Plus,
  Bell,
  Crown,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { toast } from 'sonner'

// Icon components for cleaner nav
function CardStackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="6" width="14" height="10" rx="2" />
      <path d="M7 3h10a2 2 0 0 1 2 2v10" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="7" r="3" />
      <circle cx="17" cy="7" r="3" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M17 14a4 4 0 0 1 4 4v3" />
    </svg>
  )
}

interface DashboardNavProps {
  user: SupabaseUser
  profile: Profile | null
}

export function DashboardNav({ user, profile }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    async function fetchUnreadCount() {
      const supabase = createClient()
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
      
      setUnreadCount(count || 0)
    }

    fetchUnreadCount()

    // Set up realtime subscription for notifications
    const supabase = createClient()
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user.id])

  // Refetch unread count when navigating away from notifications page
  // This ensures the badge updates after viewing notifications
  useEffect(() => {
    if (!pathname.startsWith('/notifications')) {
      const timer = setTimeout(async () => {
        const supabase = createClient()
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false)
        
        setUnreadCount(count || 0)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [pathname, user.id])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('ログアウトしました')
    router.push('/')
    router.refresh()
  }

  const displayName = profile?.display_name || profile?.username || 'User'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <header className="border-b border-border/50 bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image 
            src="/logo.png" 
            alt="R'lyeh Wallet" 
            width={40} 
            height={40} 
            className="rounded-xl"
          />
        </Link>

        {/* Right side - Icon Navigation */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* New Record Button */}
          <Link href="/reports/new">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Plus className="w-5 h-5" />
            </Button>
          </Link>

          {/* My Wallet / Cards */}
          <Link href="/wallet">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-10 w-10",
                pathname.startsWith('/wallet') && "bg-accent"
              )}
            >
              <CardStackIcon className="w-6 h-6" />
            </Button>
          </Link>

          {/* Search */}
          <Link href="/search">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-10 w-10",
                pathname.startsWith('/search') && "bg-accent"
              )}
            >
              <Search className="w-5 h-5" />
            </Button>
          </Link>

          {/* Social - Friends & Following */}
          <Link href="/social">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-10 w-10",
                pathname.startsWith('/social') && "bg-accent"
              )}
            >
              <UsersIcon className="w-6 h-6" />
            </Button>
          </Link>

          {/* Notifications */}
          <Link href="/notifications">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-10 w-10 relative",
                pathname.startsWith('/notifications') && "bg-accent"
              )}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </Link>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl ml-1">
                <Avatar className="w-8 h-8 rounded-xl">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} className="rounded-xl" />
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs rounded-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">@{profile?.username}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/user/${profile?.username}`} className="cursor-pointer">
                  <Wallet className="w-4 h-4 mr-2" />
                  マイプロフィール
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/pricing" className="cursor-pointer">
                  <Crown className="w-4 h-4 mr-2" />
                  料金プラン
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  設定
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                ログアウト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
