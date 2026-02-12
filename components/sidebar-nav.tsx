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
    Home,
    Search,
    Bell,
    Settings,
    LogOut,
    PenSquare,
    User,
    Crown,
    Wallet,
    Users,
    MoreHorizontal,
    PanelLeftClose,
    PanelLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { toast } from 'sonner'

interface SidebarNavProps {
    user: SupabaseUser
    profile: Profile | null
}

interface NavItem {
    label: string
    href: string
    icon: React.ReactNode
}

export function SidebarNav({ user, profile }: SidebarNavProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [unreadCount, setUnreadCount] = useState(0)
    const [isCollapsed, setIsCollapsed] = useState(false)

    // Load saved collapse state
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed')
        if (saved !== null) {
            setIsCollapsed(saved === 'true')
        }
    }, [])

    // Save collapse state
    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', String(isCollapsed))
    }, [isCollapsed])

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

    async function handleSignOut() {
        const supabase = createClient()
        await supabase.auth.signOut()
        toast.success('ログアウトしました')
        router.push('/')
        router.refresh()
    }

    const displayName = profile?.display_name || profile?.username || 'User'
    const initials = displayName.slice(0, 2).toUpperCase()

    const navItems: NavItem[] = [
        {
            label: 'ホーム',
            href: '/dashboard',
            icon: <Home className="w-6 h-6 shrink-0" />,
        },
        {
            label: '通知',
            href: '/notifications',
            icon: <Bell className="w-6 h-6 shrink-0" />,
        },
        {
            label: '検索',
            href: '/search',
            icon: <Search className="w-6 h-6 shrink-0" />,
        },
        {
            label: 'ウォレット',
            href: '/wallet',
            icon: <Wallet className="w-6 h-6 shrink-0" />,
        },
        {
            label: 'ソーシャル',
            href: '/social',
            icon: <Users className="w-6 h-6 shrink-0" />,
        },
        {
            label: 'プロフィール',
            href: `/user/${profile?.username}`,
            icon: <User className="w-6 h-6 shrink-0" />,
        },
    ]

    return (
        <nav
            className={cn(
                'flex flex-col h-full py-2 transition-all duration-300 ease-out overflow-hidden',
                isCollapsed ? 'w-[68px] px-2' : 'w-[260px] px-3'
            )}
        >
            {/* Logo + Collapse Button */}
            <div className={cn(
                'flex items-center mb-2 p-2',
                isCollapsed ? 'justify-center' : 'justify-between'
            )}>
                {/* Logo - Not a button */}
                <div className="flex items-center gap-3">
                    <Image
                        src="/logo.png"
                        alt="R'lyeh Wallet"
                        width={32}
                        height={32}
                        className="rounded-lg shrink-0"
                    />
                    <span
                        className={cn(
                            'font-bold text-xl whitespace-nowrap transition-all duration-300',
                            isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
                        )}
                    >
                        R'lyeh
                    </span>
                </div>

                {/* Collapse Button - Next to logo */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={cn(
                        'h-8 w-8 rounded-lg shrink-0 transition-all duration-300',
                        isCollapsed && 'absolute -right-3 top-4 bg-background border shadow-sm'
                    )}
                    title={isCollapsed ? '展開' : '折りたたむ'}
                >
                    {isCollapsed ? (
                        <PanelLeft className="w-4 h-4" />
                    ) : (
                        <PanelLeftClose className="w-4 h-4" />
                    )}
                </Button>
            </div>

            {/* Nav Items */}
            <div className="flex-1 space-y-0.5">
                {navItems.map((item) => {
                    const isActive = item.href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-4 px-3 py-3 rounded-full',
                                'hover:bg-accent transition-all duration-200 group relative',
                                isActive && 'font-bold',
                                isCollapsed && 'justify-center px-3'
                            )}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <div className="relative">
                                {item.icon}
                                {item.label === '通知' && unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </div>
                            <span
                                className={cn(
                                    'text-xl whitespace-nowrap transition-all duration-300',
                                    isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
                                )}
                            >
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>

            {/* New Post Button */}
            <Link href="/reports/new" className="my-4">
                <Button
                    className={cn(
                        'h-12 rounded-full font-bold shadow-lg transition-all duration-300',
                        isCollapsed ? 'w-12 p-0' : 'w-full text-lg'
                    )}
                    size="lg"
                    title={isCollapsed ? '投稿' : undefined}
                >
                    <PenSquare className="w-5 h-5 shrink-0" />
                    <span
                        className={cn(
                            'ml-2 whitespace-nowrap transition-all duration-300',
                            isCollapsed ? 'w-0 opacity-0 overflow-hidden ml-0' : 'w-auto opacity-100'
                        )}
                    >
                        投稿
                    </span>
                </Button>
            </Link>

            {/* User Menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className={cn(
                            'flex items-center gap-3 p-3 rounded-full hover:bg-accent transition-colors w-full',
                            isCollapsed && 'justify-center p-2'
                        )}
                    >
                        <Avatar className="w-10 h-10 shrink-0">
                            <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                            <AvatarFallback className="bg-muted text-muted-foreground">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div
                            className={cn(
                                'flex flex-1 flex-col items-start min-w-0 whitespace-nowrap transition-all duration-300',
                                isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
                            )}
                        >
                            <span className="font-bold text-sm truncate max-w-full">{displayName}</span>
                            <span className="text-sm text-muted-foreground truncate max-w-full">@{profile?.username}</span>
                        </div>
                        <MoreHorizontal
                            className={cn(
                                'w-5 h-5 text-muted-foreground shrink-0 transition-all duration-300',
                                isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-5 opacity-100'
                            )}
                        />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top" className="w-56 mb-2">
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
        </nav>
    )
}
