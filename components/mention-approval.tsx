'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Check, X, Clock, AtSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'
import { useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'

interface MentionApproval {
  id: string
  mentioned_user_id: string
  play_report_id: string
  mentioned_by_user_id: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  // Joined
  mentioned_by_user?: Profile
  play_report?: { scenario_name: string }
}

interface MentionApprovalListProps {
  approvals: MentionApproval[]
  onApprovalChange?: () => void
  className?: string
}

export function MentionApprovalList({
  approvals,
  onApprovalChange,
  className,
}: MentionApprovalListProps) {
  const [processing, setProcessing] = useState<string | null>(null)
  const supabase = createClient()

  const handleAction = async (approvalId: string, action: 'approved' | 'rejected') => {
    setProcessing(approvalId)
    try {
      const { error } = await supabase
        .from('mention_approvals')
        .update({
          status: action,
          updated_at: new Date().toISOString(),
        })
        .eq('id', approvalId)

      if (error) throw error

      toast.success(action === 'approved' ? 'メンションを承認しました' : 'メンションを拒否しました')
      onApprovalChange?.()
    } catch {
      toast.error('操作に失敗しました')
    } finally {
      setProcessing(null)
    }
  }

  const pendingApprovals = approvals.filter(a => a.status === 'pending')

  if (pendingApprovals.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <AtSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">承認待ちのメンションはありません</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {pendingApprovals.map((approval) => {
        const fromUser = approval.mentioned_by_user
        const isProcessing = processing === approval.id

        return (
          <div
            key={approval.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={fromUser?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {(fromUser?.display_name || fromUser?.username || '?').slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <Link
                  href={`/user/${fromUser?.username}`}
                  className="font-medium hover:underline"
                >
                  {fromUser?.display_name || fromUser?.username || '不明'}
                </Link>
                {' '}があなたをメンションしました
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {approval.play_report?.scenario_name && (
                  <>「{approval.play_report.scenario_name}」のレポート • </>
                )}
                <Clock className="w-3 h-3 inline" />{' '}
                {new Date(approval.created_at).toLocaleDateString('ja-JP')}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={() => handleAction(approval.id, 'approved')}
                disabled={isProcessing}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleAction(approval.id, 'rejected')}
                disabled={isProcessing}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Compact badge showing pending mention approval count
 */
interface MentionApprovalBadgeProps {
  count: number
  className?: string
}

export function MentionApprovalBadge({ count, className }: MentionApprovalBadgeProps) {
  if (count === 0) return null

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold',
        'bg-amber-500 text-white rounded-full px-1',
        className
      )}
    >
      {count}
    </span>
  )
}
