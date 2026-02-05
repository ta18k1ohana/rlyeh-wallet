'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MessageSquare, Send, Loader2, Trash2, CheckCircle, XCircle, User } from 'lucide-react'
import { toast } from 'sonner'
import type { ViewerComment, Profile } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

interface ViewerCommentsProps {
  playReportId: string
  reportOwnerId: string
  acceptComments: boolean
  isOwner: boolean
}

export function ViewerComments({ 
  playReportId, 
  reportOwnerId, 
  acceptComments, 
  isOwner 
}: ViewerCommentsProps) {
  const [comments, setComments] = useState<ViewerComment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [currentUser, setCurrentUser] = useState<{ id: string; profile: Profile | null } | null>(null)

  useEffect(() => {
    fetchComments()
    fetchCurrentUser()
  }, [playReportId])

  async function fetchCurrentUser() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setCurrentUser({ id: user.id, profile })
    }
  }

  async function fetchComments() {
    const supabase = createClient()
    
    let query = supabase
      .from('viewer_comments')
      .select(`
        *,
        profile:profiles(id, username, display_name, avatar_url)
      `)
      .eq('play_report_id', playReportId)
      .order('created_at', { ascending: true })

    // Non-owners only see approved comments
    if (!isOwner) {
      query = query.eq('is_approved', true)
    }

    const { data, error } = await query

    if (!error && data) {
      setComments(data)
    }
    setLoading(false)
  }

  async function handleSubmitComment() {
    if (!newComment.trim()) {
      toast.error('コメントを入力してください')
      return
    }

    if (!currentUser && !authorName.trim()) {
      toast.error('名前を入力してください')
      return
    }

    setSubmitting(true)

    const supabase = createClient()
    
    const { error } = await supabase
      .from('viewer_comments')
      .insert({
        play_report_id: playReportId,
        user_id: currentUser?.id || null,
        author_name: currentUser ? null : authorName.trim(),
        content: newComment.trim(),
        is_approved: false, // Needs approval by owner
      })

    if (error) {
      toast.error('コメントの投稿に失敗しました')
    } else {
      toast.success('コメントを投稿しました。承認後に表示されます。')
      setNewComment('')
      setAuthorName('')
      
      // Create notification for report owner
      await supabase
        .from('notifications')
        .insert({
          user_id: reportOwnerId,
          type: 'system',
          from_user_id: currentUser?.id || null,
          play_report_id: playReportId,
        })
      
      if (isOwner) {
        fetchComments()
      }
    }

    setSubmitting(false)
  }

  async function handleApproveComment(commentId: string) {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('viewer_comments')
      .update({ is_approved: true })
      .eq('id', commentId)

    if (error) {
      toast.error('承認に失敗しました')
    } else {
      toast.success('コメントを承認しました')
      setComments(comments.map(c => 
        c.id === commentId ? { ...c, is_approved: true } : c
      ))
    }
  }

  async function handleDeleteComment(commentId: string) {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('viewer_comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      toast.error('削除に失敗しました')
    } else {
      toast.success('コメントを削除しました')
      setComments(comments.filter(c => c.id !== commentId))
    }
  }

  const approvedComments = comments.filter(c => c.is_approved)
  const pendingComments = comments.filter(c => !c.is_approved)

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        <h3 className="font-semibold">視聴者コメント</h3>
        <Badge variant="secondary">{approvedComments.length}</Badge>
      </div>

      {/* Pending comments (owner only) */}
      {isOwner && pendingComments.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-amber-600 font-medium">
            承認待ち ({pendingComments.length}件)
          </p>
          {pendingComments.map((comment) => (
            <Card key={comment.id} className="bg-amber-500/5 border-amber-500/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8 rounded-xl">
                    {comment.profile?.avatar_url ? (
                      <AvatarImage src={comment.profile.avatar_url || "/placeholder.svg"} className="rounded-xl" />
                    ) : null}
                    <AvatarFallback className="rounded-xl">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {comment.profile?.display_name || 
                         comment.profile?.username || 
                         comment.author_name || 
                         '匿名'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { 
                          addSuffix: true, 
                          locale: ja 
                        })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApproveComment(comment.id)}
                        className="gap-1 h-7 text-green-600 hover:text-green-700 bg-transparent"
                      >
                        <CheckCircle className="w-3 h-3" />
                        承認
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="gap-1 h-7 text-destructive hover:text-destructive bg-transparent"
                      >
                        <XCircle className="w-3 h-3" />
                        削除
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Separator />
        </div>
      )}

      {/* Approved comments */}
      {approvedComments.length > 0 ? (
        <div className="space-y-3">
          {approvedComments.map((comment) => (
            <Card key={comment.id} className="bg-muted/30 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8 rounded-xl">
                    {comment.profile?.avatar_url ? (
                      <AvatarImage src={comment.profile.avatar_url || "/placeholder.svg"} className="rounded-xl" />
                    ) : null}
                    <AvatarFallback className="rounded-xl">
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {comment.profile?.display_name || 
                         comment.profile?.username || 
                         comment.author_name || 
                         '匿名'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { 
                          addSuffix: true, 
                          locale: ja 
                        })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          まだコメントはありません
        </p>
      )}

      {/* Comment form */}
      {acceptComments && (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-4 space-y-3">
            {!currentUser && (
              <Input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="お名前"
                maxLength={50}
                disabled={submitting}
              />
            )}
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="コメントを入力..."
              rows={3}
              maxLength={1000}
              disabled={submitting}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                コメントは配信者の承認後に表示されます
              </p>
              <Button
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
                className="gap-2"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                投稿
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
