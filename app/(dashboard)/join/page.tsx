'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, Search, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import type { PlayReport } from '@/lib/types'

export default function JoinSessionPage() {
  const router = useRouter()
  const [shareCode, setShareCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [joining, setJoining] = useState(false)
  const [foundReport, setFoundReport] = useState<PlayReport | null>(null)
  
  // Join form state
  const [characterName, setCharacterName] = useState('')
  const [handout, setHandout] = useState('')
  const [role, setRole] = useState<'KP' | 'PL'>('PL')
  const [result, setResult] = useState<'survive' | 'dead' | 'insane' | 'other' | ''>('')

  async function searchByCode() {
    if (!shareCode.trim()) {
      toast.error('共有コードを入力してください')
      return
    }

    setLoading(true)
    setFoundReport(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('play_reports')
        .select(`
          *,
          profile:profiles!play_reports_user_id_fkey(username, display_name, avatar_url)
        `)
        .eq('share_code', shareCode.trim().toUpperCase())
        .single()

      if (error || !data) {
        toast.error('共有コードが見つかりませんでした')
        return
      }

      setFoundReport(data as PlayReport)
      toast.success('セッション記録が見つかりました')
    } catch (error) {
      console.error('Search error:', error)
      toast.error('検索に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!foundReport) return

    setJoining(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('ログインが必要です')
        router.push('/auth/login')
        return
      }

      // Get user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      if (!profile) {
        toast.error('プロフィールが見つかりません')
        return
      }

      // Check if already a participant
      const { data: existingParticipant } = await supabase
        .from('play_report_participants')
        .select('id')
        .eq('play_report_id', foundReport.id)
        .eq('user_id', user.id)
        .single()

      if (existingParticipant) {
        toast.error('既にこのセッションに参加しています')
        return
      }

      // Add as participant
      const { error } = await supabase
        .from('play_report_participants')
        .insert({
          play_report_id: foundReport.id,
          user_id: user.id,
          username: profile.username,
          role: role,
          character_name: role === 'PL' ? characterName || null : null,
          handout: role === 'PL' ? handout || null : null,
          result: role === 'PL' ? result || null : null,
        })

      if (error) throw error

      toast.success('セッションに参加しました！')
      router.push(`/reports/${foundReport.id}`)
    } catch (error) {
      console.error('Join error:', error)
      toast.error('参加に失敗しました')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">共有コードで参加</h1>
          <p className="text-muted-foreground">同卓者のセッション記録に参加者として登録</p>
        </div>
      </div>

      {/* Search Card */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>共有コード入力</CardTitle>
          <CardDescription>
            KPまたは他の参加者から共有コードを受け取ってください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="shareCode">共有コード</Label>
              <Input
                id="shareCode"
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                placeholder="例: ABC123"
                maxLength={10}
                disabled={loading}
                className="uppercase"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={searchByCode} disabled={loading || !shareCode.trim()}>
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Found Report */}
      {foundReport && (
        <>
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>セッション情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">シナリオ名</span>
                  <p className="font-medium">{foundReport.scenario_name}</p>
                </div>
                {foundReport.scenario_author && (
                  <div>
                    <span className="text-muted-foreground">作者</span>
                    <p className="font-medium">{foundReport.scenario_author}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">プレイ日</span>
                  <p className="font-medium">
                    {new Date(foundReport.play_date_start).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">作成者</span>
                  <p className="font-medium">
                    {foundReport.profile?.display_name || foundReport.profile?.username}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Join Form */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>参加情報を入力</CardTitle>
              <CardDescription>あなたの参加情報を入力してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>役割</Label>
                <Select value={role} onValueChange={(v: 'KP' | 'PL') => setRole(v)} disabled={joining}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KP">KP（キーパー）</SelectItem>
                    <SelectItem value="PL">PL（プレイヤー）</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === 'PL' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="characterName">PC名</Label>
                    <Input
                      id="characterName"
                      value={characterName}
                      onChange={(e) => setCharacterName(e.target.value)}
                      placeholder="探索者名"
                      disabled={joining}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="handout">HO（ハンドアウト）</Label>
                    <Input
                      id="handout"
                      value={handout}
                      onChange={(e) => setHandout(e.target.value)}
                      placeholder="例: HO1"
                      disabled={joining}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>結果</Label>
                    <Select 
                      value={result} 
                      onValueChange={(v: typeof result) => setResult(v)} 
                      disabled={joining}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="survive">生還</SelectItem>
                        <SelectItem value="lost">ロスト</SelectItem>
                        <SelectItem value="other">その他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Button onClick={handleJoin} disabled={joining} className="w-full gap-2">
                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    参加中...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    このセッションに参加
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
