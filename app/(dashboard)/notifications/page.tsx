'use client'

import React, { useState, useEffect } from "react"
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, User, Share2, AtSign, Info, Heart, UserPlus, Check, X, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface NotificationItem {
  id: string
  type: string
  is_read: boolean
  created_at: string
  from_user_id: string | null
  from_user?: {
    username: string
    display_name?: string
    avatar_url?: string
  }
  play_report?: {
    id: string
    scenario_name: string
  }
}

interface FriendRequest {
  id: string
  from_user_id: string
  to_user_id: string
  status: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [pendingRequests, setPendingRequests] = useState<Map<string, FriendRequest>>(new Map())
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)

  useEffect(() => {
    async function loadNotifications() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Fetch notifications
      const { data: notifs } = await supabase
        .from('notifications')
        .select(`
          *,
          from_user:profiles!notifications_from_user_id_fkey(username, display_name, avatar_url),
          play_report:play_reports(id, scenario_name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (notifs) {
        setNotifications(notifs)

        // Mark all as read
        const unreadIds = notifs.filter(n => !n.is_read).map(n => n.id)
        if (unreadIds.length > 0) {
          await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', unreadIds)
        }

        // Fetch pending friend requests for friend_request notifications
        const friendRequestNotifs = notifs.filter(n => n.type === 'friend_request' && n.from_user_id)
        if (friendRequestNotifs.length > 0) {
          const fromUserIds = friendRequestNotifs.map(n => n.from_user_id).filter(Boolean)
          
          const { data: requests } = await supabase
            .from('friend_requests')
            .select('*')
            .eq('to_user_id', user.id)
            .in('from_user_id', fromUserIds)
            .eq('status', 'pending')

          if (requests) {
            const requestMap = new Map<string, FriendRequest>()
            requests.forEach(req => {
              requestMap.set(req.from_user_id, req)
            })
            setPendingRequests(requestMap)
          }
        }
      }

      setLoading(false)
    }

    loadNotifications()
  }, [])

  async function handleAcceptRequest(fromUserId: string) {
    setProcessingRequest(fromUserId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    try {
      // Update friend request status to accepted
      const { error: updateError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('from_user_id', fromUserId)
        .eq('to_user_id', user.id)
        .eq('status', 'pending')

      if (updateError) throw updateError

      // Create mutual follows (both directions for friendship)
      // Check if follow already exists before inserting
      const { data: existingFollow1 } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', fromUserId)
        .maybeSingle()

      if (!existingFollow1) {
        const { error: follow1Error } = await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: fromUserId })
        if (follow1Error) throw follow1Error
      }

      const { data: existingFollow2 } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', fromUserId)
        .eq('following_id', user.id)
        .maybeSingle()

      if (!existingFollow2) {
        const { error: follow2Error } = await supabase
          .from('follows')
          .insert({ follower_id: fromUserId, following_id: user.id })
        if (follow2Error) throw follow2Error
      }

      // Notify the requester that their request was accepted
      await supabase
        .from('notifications')
        .insert({
          user_id: fromUserId,
          type: 'follow',
          from_user_id: user.id,
        })

      // Remove from pending requests
      setPendingRequests(prev => {
        const newMap = new Map(prev)
        newMap.delete(fromUserId)
        return newMap
      })

      toast.success('フレンド申請を承認しました')
    } catch (error) {
      console.error('Error accepting friend request:', error)
      toast.error('エラーが発生しました')
    } finally {
      setProcessingRequest(null)
    }
  }

  async function handleRejectRequest(fromUserId: string) {
    setProcessingRequest(fromUserId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    try {
      // Update friend request status to rejected
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('from_user_id', fromUserId)
        .eq('to_user_id', user.id)
        .eq('status', 'pending')

      if (error) throw error

      // Remove from pending requests
      setPendingRequests(prev => {
        const newMap = new Map(prev)
        newMap.delete(fromUserId)
        return newMap
      })

      toast.success('フレンド申請を拒否しました')
    } catch (error) {
      console.error('Error rejecting friend request:', error)
      toast.error('エラーが発生しました')
    } finally {
      setProcessingRequest(null)
    }
  }

  const notificationIcons: Record<string, React.ReactNode> = {
    mention: <AtSign className="w-4 h-4" />,
    share_code: <Share2 className="w-4 h-4" />,
    follow: <User className="w-4 h-4" />,
    like: <Heart className="w-4 h-4" />,
    friend_request: <UserPlus className="w-4 h-4" />,
    system: <Info className="w-4 h-4" />,
  }

  const getNotificationMessage = (n: NotificationItem): string => {
    const name = n.from_user?.display_name || n.from_user?.username || '誰か'
    switch (n.type) {
      case 'mention':
        return `${name}があなたを「${n.play_report?.scenario_name}」でメンションしました`
      case 'share_code':
        return `${name}が「${n.play_report?.scenario_name}」を共有しました`
      case 'follow':
        return `${name}があなたとフレンドになりました`
      case 'like':
        return `${name}が「${n.play_report?.scenario_name}」にいいねしました`
      case 'friend_request':
        return `${name}からフレンド申請が届きました`
      default:
        return 'お知らせ'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Bell className="w-7 h-7 text-primary" />
          通知
        </h1>
        <p className="text-muted-foreground">フレンド申請、いいね、メンションの通知</p>
      </div>

      {/* Notifications List */}
      {notifications && notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const icon = notificationIcons[notification.type] || notificationIcons.system
            const message = getNotificationMessage(notification)
            const hasPendingRequest = notification.type === 'friend_request' && 
              notification.from_user_id && 
              pendingRequests.has(notification.from_user_id)
            const isProcessing = processingRequest === notification.from_user_id

            const href = notification.play_report?.id 
              ? `/reports/${notification.play_report.id}`
              : notification.from_user?.username
              ? `/user/${notification.from_user.username}`
              : '#'

            return (
              <Card 
                key={notification.id} 
                className={`bg-card/50 border-border/50 hover:border-primary/30 transition-colors ${!notification.is_read ? 'border-l-2 border-l-primary' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {notification.from_user?.avatar_url ? (
                      <Avatar className="w-10 h-10 shrink-0 rounded-xl">
                        <AvatarImage src={notification.from_user.avatar_url || "/placeholder.svg"} className="rounded-xl" />
                        <AvatarFallback className="bg-primary/10 text-primary rounded-xl">
                          {(notification.from_user.display_name || notification.from_user.username).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {icon}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link href={href} className="hover:underline">
                        <p className="text-sm">{message}</p>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(notification.created_at)}
                      </p>
                      
                      {/* Friend Request Actions */}
                      {hasPendingRequest && (
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRequest(notification.from_user_id!)}
                            disabled={isProcessing}
                            className="gap-1"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            承認
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRequest(notification.from_user_id!)}
                            disabled={isProcessing}
                            className="gap-1 bg-transparent"
                          >
                            <X className="w-3 h-3" />
                            拒否
                          </Button>
                        </div>
                      )}
                      
                      {/* Already processed */}
                      {notification.type === 'friend_request' && 
                       notification.from_user_id && 
                       !pendingRequests.has(notification.from_user_id) && (
                        <p className="text-xs text-muted-foreground mt-2">
                          この申請は処理済みです
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-12 text-center">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">通知はありません</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
