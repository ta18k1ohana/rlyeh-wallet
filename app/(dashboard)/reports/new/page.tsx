'use client'

import React from "react"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageUpload } from '@/components/image-upload'
import { MultiImageUpload } from '@/components/multi-image-upload'
import { SuccessAnimation } from '@/components/success-animation'
import { LinkManager, type ReportLink } from '@/components/link-manager'
import { UserAutocomplete } from '@/components/user-autocomplete'
import { ScenarioAuthorSuggest } from '@/components/scenario-author-suggest'
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  User,
  Copy,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { generateShareCode } from '@/lib/utils'
import { getProfileLimits, TIER_LIMITS } from '@/lib/tier-limits'
import type { Profile } from '@/lib/types'

interface Participant {
  username: string
  user_id: string | null  // Linked user ID from autocomplete
  role: 'KP' | 'PL'
  character_name: string
  handout: string
  result: 'survive' | 'lost' | 'other' | ''
}

export default function NewReportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdReportId, setCreatedReportId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  // Fetch user profile for tier limits
  React.useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
    }
    fetchProfile()
  }, [])

  const limits = getProfileLimits(profile)

  // Form state
  const [scenarioName, setScenarioName] = useState('')
  const [scenarioAuthor, setScenarioAuthor] = useState('')
  const [edition, setEdition] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [additionalImages, setAdditionalImages] = useState<string[]>([])
  const [playDateStart, setPlayDateStart] = useState('')
  const [playDateEnd, setPlayDateEnd] = useState('')
  const [playDuration, setPlayDuration] = useState('')
  const [endType, setEndType] = useState('')
  const [endDescription, setEndDescription] = useState('')
  const [impression, setImpression] = useState('')
  const [xCopied, setXCopied] = useState(false)
  const [privacySetting, setPrivacySetting] = useState<'public' | 'followers' | 'private'>('followers')
  const [links, setLinks] = useState<ReportLink[]>([])
  const [participants, setParticipants] = useState<Participant[]>([
    { username: '', user_id: null, role: 'PL', character_name: '', handout: '', result: '' }
  ])

  function addParticipant() {
    setParticipants([...participants, { username: '', user_id: null, role: 'PL', character_name: '', handout: '', result: '' }])
  }

  function removeParticipant(index: number) {
    setParticipants(participants.filter((_, i) => i !== index))
  }

  function updateParticipant(index: number, field: keyof Participant, value: string | null) {
    const updated = [...participants]
    updated[index] = { ...updated[index], [field]: value }
    setParticipants(updated)
  }

  function updateParticipantWithUser(index: number, username: string, userId: string | null) {
    const updated = [...participants]
    updated[index] = { ...updated[index], username, user_id: userId }
    setParticipants(updated)
  }

  function generateXText(): string {
    const kpParticipants = participants.filter(p => p.role === 'KP')
    const plParticipants = participants.filter(p => p.role === 'PL')

    let text = `クトゥルフ神話TRPG【${scenarioName}】\n`

    // KP
    if (kpParticipants.length > 0) {
      text += '\n'
      kpParticipants.forEach(p => {
        const name = p.character_name || p.username || 'KP'
        text += `KP：${name}\n`
      })
    }

    // PC/PL
    if (plParticipants.length > 0) {
      text += '\nPC/PL\n'
      plParticipants.forEach(p => {
        const hoPrefix = p.handout ? `${p.handout}：` : ''
        const charPart = p.character_name || ''
        const playerPart = p.username || ''
        const resultIcon = p.result === 'lost' ? '†' : ''
        if (charPart && playerPart) {
          text += `${hoPrefix}${charPart}${resultIcon}/${playerPart}\n`
        } else if (charPart) {
          text += `${hoPrefix}${charPart}${resultIcon}\n`
        } else if (playerPart) {
          text += `${hoPrefix}${playerPart}\n`
        }
      })
    }

    // エンド結果
    if (endType || endDescription) {
      text += '\n'
      if (endType) text += `― ${endType} ―\n`
      if (endDescription) text += `${endDescription}\n`
    }

    // 感想
    if (impression) {
      text += `\n${impression}\n`
    }

    text += '\n#TRPG #クトゥルフ神話TRPG #ルルイエウォレット'

    return text
  }

  function copyXText() {
    const text = generateXText()
    navigator.clipboard.writeText(text)
    setXCopied(true)
    toast.success('クリップボードにコピーしました')
    setTimeout(() => setXCopied(false), 2000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('ログインが必要です')
        router.push('/auth/login')
        return
      }

      // Create play report
      const shareCode = generateShareCode()
      const { data: report, error: reportError } = await supabase
        .from('play_reports')
        .insert({
          user_id: user.id,
          scenario_name: scenarioName,
          scenario_author: scenarioAuthor || null,
          edition: edition || null,
          cover_image_url: coverImageUrl,
          play_date_start: playDateStart,
          play_date_end: playDateEnd || null,
          play_duration: playDuration ? Number.parseFloat(playDuration) : null,
          end_type: endType || null,
          end_description: endDescription || null,
          impression: impression || null,
          share_code: shareCode,
          privacy_setting: privacySetting,
        })
        .select()
        .single()

      if (reportError) {
        console.error('Report creation error:', reportError)
        throw reportError
      }

      // Add participants
      const validParticipants = participants.filter(p => p.username.trim())
      if (validParticipants.length > 0) {
        const { error: participantsError } = await supabase
          .from('play_report_participants')
          .insert(
            validParticipants.map(p => ({
              play_report_id: report.id,
              username: p.username,
              user_id: p.user_id || null,
              role: p.role,
              character_name: p.character_name || null,
              handout: p.handout || null,
              result: p.result || null,
            }))
          )

        if (participantsError) {
          console.error('Participants creation error:', participantsError)
          throw participantsError
        }
      }

      // Add additional images
      if (additionalImages.length > 0) {
        const { error: imagesError } = await supabase
          .from('play_report_images')
          .insert(
            additionalImages.map((url, index) => ({
              play_report_id: report.id,
              image_url: url,
              image_type: 'other' as const,
              sort_order: index,
            }))
          )

        if (imagesError) {
          console.error('Images creation error:', imagesError)
          throw imagesError
        }
      }

      // Add links
      if (links.length > 0) {
        const { error: linksError } = await supabase
          .from('play_report_links')
          .insert(
            links.map((link, index) => ({
              play_report_id: report.id,
              link_type: link.link_type,
              url: link.url,
              title: link.title || null,
              sort_order: index,
            }))
          )

        if (linksError) {
          console.error('Links creation error:', linksError)
          throw linksError
        }
      }

      // Success
      setCreatedReportId(report.id)
      setShowSuccess(true)
      // Don't set loading to false here - let the animation complete first
    } catch (error: any) {
      console.error('Error creating report:', error)
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      })
      toast.error(error?.message || '作成に失敗しました')
      setLoading(false)
    }
  }

  return (
    <>
      <SuccessAnimation
        show={showSuccess}
        onComplete={() => {
          setLoading(false)
          if (createdReportId) {
            router.push(`/reports/${createdReportId}`)
          }
        }}
      />
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">新規セッション記録</h1>
            <p className="text-muted-foreground">プレイしたセッションの情報を記録</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>シナリオと日時の情報</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>カバー画像</Label>
                <ImageUpload
                  value={coverImageUrl}
                  onChange={setCoverImageUrl}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  メインのカバー画像（推奨: 16:9 または 4:3）
                </p>
              </div>

              <div className="space-y-2">
                <Label>追加画像</Label>
                <MultiImageUpload
                  values={additionalImages}
                  onChange={setAdditionalImages}
                  maxImages={limits.maxImages}
                  maxImageSize={limits.maxImageSize}
                  disabled={loading}
                  showLimitWarning={profile?.tier === 'free'}
                />
                <p className="text-xs text-muted-foreground">
                  キャラシ、シーン画像など（最大{limits.maxImages}枚、{limits.maxImageSize}px以下にリサイズ）
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scenarioName">シナリオ名 *</Label>
                <Input
                  id="scenarioName"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="例: 毒入りスープ"
                  required
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scenarioAuthor">シナリオ作者</Label>
                  <ScenarioAuthorSuggest
                    scenarioName={scenarioName}
                    value={scenarioAuthor}
                    onChange={setScenarioAuthor}
                    placeholder="作者名"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edition">版・システム</Label>
                  <Select value={edition} onValueChange={setEdition} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coc6">CoC 6版</SelectItem>
                      <SelectItem value="coc7">CoC 7版</SelectItem>
                      <SelectItem value="new-cthulhu">新クトゥルフ神話TRPG</SelectItem>
                      <SelectItem value="delta-green">Delta Green</SelectItem>
                      <SelectItem value="other">その他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="playDateStart">プレイ開始日 *</Label>
                  <Input
                    id="playDateStart"
                    type="date"
                    value={playDateStart}
                    onChange={(e) => setPlayDateStart(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="playDateEnd">プレイ終了日</Label>
                  <Input
                    id="playDateEnd"
                    type="date"
                    value={playDateEnd}
                    onChange={(e) => setPlayDateEnd(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="playDuration">プレイ時間（時間）</Label>
                <Input
                  id="playDuration"
                  type="number"
                  step="0.5"
                  min="0"
                  value={playDuration}
                  onChange={(e) => setPlayDuration(e.target.value)}
                  placeholder="例: 4.5"
                  disabled={loading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>参加者</CardTitle>
                  <CardDescription>KP/PLの情報を追加</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addParticipant}
                  disabled={loading}
                  className="bg-transparent"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  追加
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {participants.map((participant, index) => (
                <div key={index} className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">参加者 {index + 1}</span>
                    </div>
                    {participants.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeParticipant(index)}
                        disabled={loading}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>PL名</Label>
                      <UserAutocomplete
                        value={participant.username}
                        onChange={(value) => updateParticipant(index, 'username', value)}
                        onUserSelect={(profile) => updateParticipantWithUser(index, `@${profile.username}`, profile.id)}
                        placeholder="@username またはPL名"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>役割</Label>
                      <Select
                        value={participant.role}
                        onValueChange={(v) => updateParticipant(index, 'role', v)}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="KP">KP（キーパー）</SelectItem>
                          <SelectItem value="PL">PL（プレイヤー）</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {participant.role === 'PL' && (
                      <>
                        <div className="space-y-2">
                          <Label>PC名</Label>
                          <Input
                            value={participant.character_name}
                            onChange={(e) => updateParticipant(index, 'character_name', e.target.value)}
                            placeholder="探索者名"
                            disabled={loading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>HO（ハンドアウト）</Label>
                          <Input
                            value={participant.handout}
                            onChange={(e) => updateParticipant(index, 'handout', e.target.value)}
                            placeholder="例: HO1、秘密の使命"
                            disabled={loading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>結果</Label>
                          <Select
                            value={participant.result}
                            onValueChange={(v) => updateParticipant(index, 'result', v)}
                            disabled={loading}
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
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Ending */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>エンディング</CardTitle>
              <CardDescription>セッションの結末を記録</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="endType">エンド</Label>
                <Input
                  id="endType"
                  value={endType}
                  onChange={(e) => setEndType(e.target.value as typeof endType)}
                  placeholder="例: エンドA、トゥルーエンド、バッドエンド"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  エンドA、トゥルーエンドなど
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDescription">説明（ネタバレなし）</Label>
                <Input
                  id="endDescription"
                  value={endDescription}
                  onChange={(e) => setEndDescription(e.target.value)}
                  placeholder="例: 真相に辿り着いた、全員生還！"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  公開される結末の説明（ネタバレは避けてください）
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="impression">感想・メモ（自分だけに見える）</Label>
                <Textarea
                  id="impression"
                  value={impression}
                  onChange={(e) => {
                    if (e.target.value.length <= limits.maxImpressionLength) {
                      setImpression(e.target.value)
                    }
                  }}
                  placeholder="自分だけに見える感想やメモを記入..."
                  rows={4}
                  disabled={loading}
                  maxLength={limits.maxImpressionLength}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>この内容は他のユーザーには表示されません</span>
                  <span className={impression.length >= limits.maxImpressionLength ? 'text-amber-600' : ''}>
                    {impression.length}/{limits.maxImpressionLength}文字
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Links */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>関連リンク</CardTitle>
              <CardDescription>シナリオ、リプレイ、キャラシなどのリンクを追加</CardDescription>
            </CardHeader>
            <CardContent>
              <LinkManager
                links={links}
                onChange={setLinks}
                maxLinks={limits.maxLinks}
                disabled={loading}
                showLimitWarning={profile?.tier === 'free'}
              />
            </CardContent>
          </Card>

          {/* X Post Text */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center font-black text-base leading-none">𝕏</span>
                    X投稿テキスト
                  </CardTitle>
                  <CardDescription>通過報告用のテキストを生成</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyXText}
                  disabled={!scenarioName}
                  className="gap-2 bg-transparent"
                >
                  {xCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      コピー完了
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      コピー
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {scenarioName ? (
                <div className="rounded-xl border border-border/50 bg-background p-4">
                  {/* X post style preview */}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {generateXText()}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-border/50 bg-muted/30 p-4 text-center">
                  <p className="text-sm text-muted-foreground">シナリオ名を入力するとプレビューが表示されます</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>公開設定</CardTitle>
              <CardDescription>この記録の公開範囲を設定</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={privacySetting}
                onValueChange={(v: typeof privacySetting) => setPrivacySetting(v)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">公開（誰でも閲覧可能）</SelectItem>
                  <SelectItem value="followers">フォロワーのみ</SelectItem>
                  <SelectItem value="private">非公開（自分のみ）</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存する'
              )}
            </Button>
            <Link href="/dashboard">
              <Button type="button" variant="outline" disabled={loading} className="bg-transparent">
                キャンセル
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </>
  )
}
