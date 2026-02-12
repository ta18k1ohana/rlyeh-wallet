'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImageUpload, MultiImageUpload } from '@/components/image-upload'
import { LinkManager, type ReportLink } from '@/components/link-manager'
import { UserAutocomplete } from '@/components/user-autocomplete'
import { ReportTagInput } from '@/components/report-tag-input'
import { YouTubeLinksEditor } from '@/components/youtube-embed'
import { UpgradeBanner, UpgradeInlineWarning } from '@/components/upgrade-banner'
import { getProfileLimits, canUseFeature } from '@/lib/tier-limits'
import type { Profile, ReportTag } from '@/lib/types'
import { 
  ArrowLeft, 
  Loader2, 
  Plus, 
  Trash2,
  User,
  AlertTriangle
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import type { PlayReport, PlayReportParticipant } from '@/lib/types'

interface Participant {
  id?: string
  username: string
  user_id: string | null
  role: 'KP' | 'PL'
  character_name: string
  handout: string
  result: 'survive' | 'lost' | 'other' | ''
}

export default function EditReportPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [report, setReport] = useState<PlayReport | null>(null)
  
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
  const [privacySetting, setPrivacySetting] = useState<'public' | 'followers' | 'private'>('followers')
  const [links, setLinks] = useState<ReportLink[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [tags, setTags] = useState<ReportTag[]>([])
  const [privateNotes, setPrivateNotes] = useState('')
  const [youtubeLinks, setYoutubeLinks] = useState<{ youtube_url: string; title: string; link_type: 'main' | 'clip' | 'playlist' }[]>([])

  useEffect(() => {
    async function loadReport() {
      // Validate id before making API call
      if (!id || id === 'undefined') {
        return
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

// Get user profile for tier limits
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileData) {
        setProfile(profileData)
      }

      const { data: reportData, error } = await supabase
        .from('play_reports')
        .select(`
          *,
          participants:play_report_participants(*),
          links:play_report_links(*),
          images:play_report_images(*),
          tags:report_tags(*)
        `)
        .eq('id', id)
        .single()

      if (error || !reportData) {
        toast.error('記録が見つかりませんでした')
        router.push('/wallet')
        return
      }

      if (reportData.user_id !== user.id) {
        toast.error('編集権限がありません')
        router.push('/wallet')
        return
      }

      setReport(reportData)
      setScenarioName(reportData.scenario_name)
      setScenarioAuthor(reportData.scenario_author || '')
      setEdition(reportData.edition || '')
      setCoverImageUrl(reportData.cover_image_url)
      
      // Load additional images
      if (reportData.images && reportData.images.length > 0) {
        const sortedImages = [...reportData.images]
          .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
          .map((img: { image_url: string }) => img.image_url)
        setAdditionalImages(sortedImages)
      }
      
      // Format dates for input[type="date"] (YYYY-MM-DD)
      setPlayDateStart(reportData.play_date_start ? reportData.play_date_start.split('T')[0] : '')
      setPlayDateEnd(reportData.play_date_end ? reportData.play_date_end.split('T')[0] : '')
      setPlayDuration(reportData.play_duration?.toString() || '')
      setEndType(reportData.end_type || '')
      setEndDescription(reportData.end_description || '')
      setImpression(reportData.impression || '')
      setPrivateNotes(reportData.private_notes || '')
      setPrivacySetting(reportData.privacy_setting)
      
      // Load links
      if (reportData.links && reportData.links.length > 0) {
        setLinks(reportData.links.map((l: ReportLink & { id: string }) => ({
          id: l.id,
          link_type: l.link_type,
          url: l.url,
          title: l.title || '',
        })))
      }
      
if (reportData.participants && reportData.participants.length > 0) {
		setParticipants(reportData.participants.map((p: PlayReportParticipant) => ({
		id: p.id,
		username: p.username,
		user_id: p.user_id || null,
		role: p.role,
		character_name: p.character_name || '',
		handout: p.handout || '',
		result: p.result || ''
		})))
		}

      // Load tags
      if (reportData.tags && reportData.tags.length > 0) {
        setTags(reportData.tags)
      }

      // Load YouTube links (Streamer feature)
      const { data: ytLinks } = await supabase
        .from('youtube_links')
        .select('*')
        .eq('play_report_id', id)
        .order('sort_order', { ascending: true })

      if (ytLinks && ytLinks.length > 0) {
        setYoutubeLinks(ytLinks.map((yl: { youtube_url: string; title: string | null; link_type: string }) => ({
          youtube_url: yl.youtube_url,
          title: yl.title || '',
          link_type: (yl.link_type || 'main') as 'main' | 'clip' | 'playlist',
        })))
      }

      setLoading(false)
    }

    loadReport()
  }, [id, router])

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

  async function handleDelete() {
    if (deleting) return
    setDeleting(true)

    try {
      const supabase = createClient()

      // Delete participants first (cascade should handle this, but being explicit)
      await supabase
        .from('play_report_participants')
        .delete()
        .eq('play_report_id', id)

      // Delete images
      await supabase
        .from('play_report_images')
        .delete()
        .eq('play_report_id', id)

      // Delete the report
      const { error } = await supabase
        .from('play_reports')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('記録を削除しました')
      router.push('/wallet')
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('削除に失敗しました')
      setDeleting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (saving) return // Prevent double submission
    
    if (!scenarioName || !playDateStart) {
      toast.error('シナリオ名と開始日は必須です')
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()

      // Update play report
      const { error: reportError } = await supabase
        .from('play_reports')
        .update({
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
          private_notes: privateNotes || null,
          privacy_setting: privacySetting,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (reportError) throw reportError

      // Delete existing participants and insert new ones
      await supabase
        .from('play_report_participants')
        .delete()
        .eq('play_report_id', id)

const validParticipants = participants.filter(p => p.username.trim())
	if (validParticipants.length > 0) {
	await supabase.from('play_report_participants').insert(
	validParticipants.map(p => ({
	play_report_id: id,
	username: p.username,
	user_id: p.user_id || null,
	role: p.role,
	character_name: p.character_name || null,
	handout: p.handout || null,
	result: p.result || null,
	}))
	)
	}

      // Delete existing links and insert new ones
      await supabase
        .from('play_report_links')
        .delete()
        .eq('play_report_id', id)

if (links.length > 0) {
	await supabase.from('play_report_links').insert(
	links.map((link, index) => ({
	play_report_id: id,
	link_type: link.link_type,
	url: link.url,
	title: link.title || null,
	sort_order: index,
	}))
	)
	}

      // Delete existing images and insert new ones
      await supabase
        .from('play_report_images')
        .delete()
        .eq('play_report_id', id)

      if (additionalImages.length > 0) {
        await supabase.from('play_report_images').insert(
          additionalImages.map((url, index) => ({
            play_report_id: id,
            image_url: url,
            image_type: 'other' as const,
            sort_order: index,
          }))
        )
      }

      // Save YouTube links (Streamer feature)
      if (canUseFeature(profile, 'canUseYouTubeEmbed')) {
        await supabase
          .from('youtube_links')
          .delete()
          .eq('play_report_id', id)

        const validYtLinks = youtubeLinks.filter(yl => yl.youtube_url.trim())
        if (validYtLinks.length > 0) {
          await supabase.from('youtube_links').insert(
            validYtLinks.map((yl, index) => ({
              play_report_id: id,
              youtube_url: yl.youtube_url,
              title: yl.title || null,
              link_type: yl.link_type,
              sort_order: index,
            }))
          )
        }
      }

      toast.success('更新しました')
      router.push(`/reports/${id}`)
    } catch (error) {
      console.error('Update error:', error)
      toast.error('更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/reports/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">記録を編集</h1>
            <p className="text-sm text-muted-foreground">{report?.scenario_name}</p>
          </div>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-2" disabled={deleting}>
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              削除
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                記録を削除しますか？
              </AlertDialogTitle>
              <AlertDialogDescription>
                この操作は取り消せません。「{report?.scenario_name}」の記録が完全に削除されます。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                削除する
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
	<Label>シナリオ画像</Label>
	<ImageUpload
	value={coverImageUrl}
	onChange={setCoverImageUrl}
	disabled={saving}
	/>
	</div>

    <div className="space-y-2">
      <Label>追加画像</Label>
      <MultiImageUpload
        values={additionalImages}
        onChange={setAdditionalImages}
        maxImages={profile ? getProfileLimits(profile).maxImages : 3}
        maxImageSize={profile ? getProfileLimits(profile).maxImageSize : 2}
        disabled={saving}
        showLimitWarning={profile?.tier === 'free'}
      />
    </div>
	
	<div className="space-y-2">
	<Label htmlFor="scenarioName">シナリオ名 *</Label>
              <Input
                id="scenarioName"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="例: 毒入りスープ"
                required
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scenarioAuthor">シナリオ作者</Label>
                <Input
                  id="scenarioAuthor"
                  value={scenarioAuthor}
                  onChange={(e) => setScenarioAuthor(e.target.value)}
                  placeholder="例: 作者名"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edition">システム/版</Label>
                <Select value={edition} onValueChange={setEdition} disabled={saving}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coc6">CoC 6版</SelectItem>
                    <SelectItem value="coc7">CoC 7版</SelectItem>
                    <SelectItem value="new-cthulhu">新クトゥルフ</SelectItem>
                    <SelectItem value="delta-green">Delta Green</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="playDateStart">開始日 *</Label>
                <Input
                  id="playDateStart"
                  type="date"
                  value={playDateStart}
                  onChange={(e) => setPlayDateStart(e.target.value)}
                  required
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="playDateEnd">終了日</Label>
                <Input
                  id="playDateEnd"
                  type="date"
                  value={playDateEnd}
                  onChange={(e) => setPlayDateEnd(e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="playDuration">プレイ時間（時間）</Label>
                <Input
                  id="playDuration"
                  type="number"
                  step="0.5"
                  value={playDuration}
                  onChange={(e) => setPlayDuration(e.target.value)}
                  placeholder="例: 4.5"
                  disabled={saving}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>参加者</CardTitle>
                <CardDescription>KPとPLの情報</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addParticipant} className="gap-2 bg-transparent">
                <Plus className="w-4 h-4" />
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
                      className="h-8 w-8 text-destructive"
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
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>役割</Label>
                    <Select 
                      value={participant.role} 
                      onValueChange={(v) => updateParticipant(index, 'role', v)}
                      disabled={saving}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KP">KP</SelectItem>
                        <SelectItem value="PL">PL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {participant.role === 'PL' && (
                  <>
                    <div className="space-y-2">
                      <Label>PC名</Label>
                      <Input
                        value={participant.character_name}
                        onChange={(e) => updateParticipant(index, 'character_name', e.target.value)}
                        placeholder="探索者名"
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>HO（ハンドアウト）</Label>
                      <Input
                        value={participant.handout}
                        onChange={(e) => updateParticipant(index, 'handout', e.target.value)}
                        placeholder="例: HO1、秘密の使命"
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>結果</Label>
                      <Select 
                        value={participant.result} 
                        onValueChange={(v) => updateParticipant(index, 'result', v)}
                        disabled={saving}
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
                onChange={(e) => setEndType(e.target.value)}
                placeholder="例: エンドA、トゥルーエンド、バッドエンド"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDescription">説明（ネタバレなし）</Label>
              <Input
                id="endDescription"
                value={endDescription}
                onChange={(e) => setEndDescription(e.target.value)}
                placeholder="例: 真相に辿り着いた、全員生還！"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="impression">
                感想・メモ
                {canUseFeature(profile, 'canUseMarkdownMemo') && (
                  <span className="text-xs text-muted-foreground ml-2">Markdown対応</span>
                )}
              </Label>
              <Textarea
                id="impression"
                value={impression}
                onChange={(e) => setImpression(e.target.value)}
                placeholder={canUseFeature(profile, 'canUseMarkdownMemo')
                  ? "Markdown記法が使えます（## 見出し、**太字**、- リスト など）"
                  : "感想やメモを記入..."
                }
                rows={6}
                disabled={saving}
              />
              {!canUseFeature(profile, 'canUseMarkdownMemo') && profile?.tier === 'free' && (
                <p className="text-xs text-muted-foreground">
                  Proプラン以上でMarkdown記法が使えます
                </p>
              )}
            </div>

            {/* Private Notes - Pro feature */}
            {canUseFeature(profile, 'canUsePrivateNotes') && (
              <div className="space-y-2">
                <Label htmlFor="privateNotes">
                  プライベートノート
                  <span className="text-xs text-muted-foreground ml-2">自分だけに見える</span>
                </Label>
                <Textarea
                  id="privateNotes"
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  placeholder="ネタバレや個人的なメモなど、自分だけに見えるノート..."
                  rows={3}
                  disabled={saving}
                  className="border-dashed"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* YouTube Links - Streamer feature */}
        {canUseFeature(profile, 'canUseYouTubeEmbed') && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>YouTube動画</CardTitle>
              <CardDescription>セッション動画や切り抜きを埋め込み</CardDescription>
            </CardHeader>
            <CardContent>
              <YouTubeLinksEditor
                values={youtubeLinks}
                onChange={setYoutubeLinks}
                disabled={saving}
              />
            </CardContent>
          </Card>
        )}

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
              maxLinks={profile ? getProfileLimits(profile).maxLinks : 5}
              disabled={saving}
              showLimitWarning={profile?.tier === 'free'}
            />
          </CardContent>
        </Card>

        {/* Tags */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>タグ</CardTitle>
            <CardDescription>卓名、何陣目、シナリオ略称などを追加</CardDescription>
          </CardHeader>
          <CardContent>
            <ReportTagInput
              reportId={id}
              profile={profile}
              initialTags={tags}
              onTagsChange={setTags}
              disabled={saving}
            />
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
              disabled={saving}
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
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              '保存する'
            )}
          </Button>
          <Link href={`/reports/${id}`}>
            <Button type="button" variant="outline" disabled={saving} className="bg-transparent">
              キャンセル
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
