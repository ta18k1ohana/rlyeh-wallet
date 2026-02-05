'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ImageUpload } from '@/components/image-upload'
import { 
  Settings, 
  User, 
  Bell, 
  Shield,
  Loader2,
  Save,
  Palette,
  Sun,
  Moon,
  Monitor,
  CheckCircle2,
  XCircle,
  AtSign,
  Crown,
  Video,
  Tag,
  Folder,
  Download,
  Link2,
  ImageIcon,
  MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'
import type { Profile, NotificationSettings } from '@/lib/types'
import { getProfileLimits, canUseFeature } from '@/lib/tier-limits'
import { TagManager } from '@/components/tag-manager'
import { FolderManager } from '@/components/folder-manager'
import { DataExport } from '@/components/data-export'
import { TierBadge } from '@/components/tier-badge'

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Profile form state
  const [username, setUsername] = useState('')
  const [originalUsername, setOriginalUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [privacySetting, setPrivacySetting] = useState<'public' | 'followers' | 'private'>('followers')
  
  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'unchanged'>('unchanged')
  const [usernameError, setUsernameError] = useState<string | null>(null)

  // Notification settings state
  const [mentionNotification, setMentionNotification] = useState(true)
  const [shareCodeNotification, setShareCodeNotification] = useState(true)
  const [followNotification, setFollowNotification] = useState(true)
  const [likeNotification, setLikeNotification] = useState(true)
  const [emailWeeklySummary, setEmailWeeklySummary] = useState(false)

  // Streamer settings state
  const [customUrlSlug, setCustomUrlSlug] = useState('')
  const [headerImageUrl, setHeaderImageUrl] = useState<string | null>(null)
  const [miniCharacterUrl, setMiniCharacterUrl] = useState<string | null>(null)
  const [acceptViewerComments, setAcceptViewerComments] = useState(false)
  const [acceptFusetter, setAcceptFusetter] = useState(false)
  const [requireMentionApproval, setRequireMentionApproval] = useState(false)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setUsername(profileData.username || '')
        setOriginalUsername(profileData.username || '')
        setDisplayName(profileData.display_name || '')
        setAvatarUrl(profileData.avatar_url || null)
        setBio(profileData.bio || '')
        setPrivacySetting(profileData.privacy_setting || 'followers')
        // Streamer settings
        setCustomUrlSlug(profileData.custom_url_slug || '')
        setHeaderImageUrl(profileData.header_image_url || null)
        setMiniCharacterUrl(profileData.mini_character_url || null)
        setAcceptViewerComments(profileData.accept_viewer_comments || false)
        setAcceptFusetter(profileData.accept_fusetter || false)
        setRequireMentionApproval(profileData.require_mention_approval || false)
      }

      // Load notification settings
      const { data: notifData } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (notifData) {
        setNotificationSettings(notifData)
        setMentionNotification(notifData.mention_notification)
        setShareCodeNotification(notifData.share_code_notification)
        setFollowNotification(notifData.follow_notification)
        setLikeNotification(notifData.like_notification ?? true)
        setEmailWeeklySummary(notifData.email_weekly_summary)
      }

      setLoading(false)
    }

    loadData()
  }, [router])

  // Username validation
  useEffect(() => {
    if (!username || username === originalUsername) {
      setUsernameStatus('unchanged')
      setUsernameError(null)
      return
    }

    const isValidFormat = /^[a-zA-Z0-9_]{3,20}$/.test(username)
    if (!isValidFormat) {
      setUsernameStatus('invalid')
      if (username.length < 3) {
        setUsernameError('3文字以上で入力してください')
      } else if (username.length > 20) {
        setUsernameError('20文字以下で入力してください')
      } else {
        setUsernameError('英数字とアンダースコア(_)のみ使用できます')
      }
      return
    }

    setUsernameStatus('checking')
    setUsernameError(null)

    const timer = setTimeout(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .single()

      if (data) {
        setUsernameStatus('taken')
        setUsernameError('このIDは既に使用されています')
      } else {
        setUsernameStatus('available')
        setUsernameError(null)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [username, originalUsername])

  async function saveProfile() {
    if (!profile) return
    
    // Validate username if changed
    if (username !== originalUsername && usernameStatus !== 'available') {
      toast.error('アカウントIDを確認してください')
      return
    }
    
    setSaving(true)

    const supabase = createClient()
    
    const updateData: Record<string, unknown> = {
      display_name: displayName || null,
      avatar_url: avatarUrl,
      bio: bio || null,
      privacy_setting: privacySetting,
      updated_at: new Date().toISOString(),
    }
    
    // Only update username if changed and valid
    if (username !== originalUsername && usernameStatus === 'available') {
      updateData.username = username.toLowerCase()
    }
    
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profile.id)

    if (error) {
      if (error.code === '23505') {
        toast.error('このIDは既に使用されています')
        setUsernameStatus('taken')
      } else {
        toast.error('保存に失敗しました')
      }
    } else {
      toast.success('プロフィールを更新しました')
      if (username !== originalUsername) {
        setOriginalUsername(username.toLowerCase())
        setUsernameStatus('unchanged')
      }
    }
    setSaving(false)
  }

  async function saveNotificationSettings() {
    if (!profile) return
    setSaving(true)

    const supabase = createClient()
    
    const settings = {
      user_id: profile.id,
      mention_notification: mentionNotification,
      share_code_notification: shareCodeNotification,
      follow_notification: followNotification,
      like_notification: likeNotification,
      email_weekly_summary: emailWeeklySummary,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('notification_settings')
      .upsert(settings)

    if (error) {
      toast.error('保存に失敗しました')
    } else {
      toast.success('通知設定を更新しました')
    }
    setSaving(false)
  }

  async function saveStreamerSettings() {
    if (!profile) return
    setSaving(true)

    const supabase = createClient()
    
    const { error } = await supabase
      .from('profiles')
      .update({
        custom_url_slug: customUrlSlug || null,
        header_image_url: headerImageUrl,
        mini_character_url: miniCharacterUrl,
        accept_viewer_comments: acceptViewerComments,
        accept_fusetter: acceptFusetter,
        require_mention_approval: requireMentionApproval,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (error) {
      if (error.code === '23505') {
        toast.error('このカスタムURLは既に使用されています')
      } else {
        toast.error('保存に失敗しました')
      }
    } else {
      toast.success('配信者設定を更新しました')
    }
    setSaving(false)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('ログアウトしました')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Settings className="w-7 h-7 text-primary" />
          設定
        </h1>
        <p className="text-muted-foreground">プロフィールと通知の設定</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-card/50 flex-wrap h-auto">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            プロフィール
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="w-4 h-4" />
            外観
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            通知
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Shield className="w-4 h-4" />
            プライバシー
          </TabsTrigger>
          <TabsTrigger value="pro" className="gap-2">
            <Crown className="w-4 h-4" />
            Pro機能
          </TabsTrigger>
          {canUseFeature(profile, 'canUseCustomUrl') && (
            <TabsTrigger value="streamer" className="gap-2">
              <Video className="w-4 h-4" />
              配信者設定
            </TabsTrigger>
          )}
        </TabsList>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>テーマ設定</CardTitle>
              <CardDescription>アプリの外観を変更</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>カラーテーマ</Label>
                {mounted && (
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      className={`h-auto py-4 flex flex-col gap-2 ${theme !== 'light' ? 'bg-transparent' : ''}`}
                      onClick={() => setTheme('light')}
                    >
                      <Sun className="w-5 h-5" />
                      <span className="text-xs">ライト</span>
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      className={`h-auto py-4 flex flex-col gap-2 ${theme !== 'dark' ? 'bg-transparent' : ''}`}
                      onClick={() => setTheme('dark')}
                    >
                      <Moon className="w-5 h-5" />
                      <span className="text-xs">ダーク</span>
                    </Button>
                    <Button
                      variant={theme === 'system' ? 'default' : 'outline'}
                      className={`h-auto py-4 flex flex-col gap-2 ${theme !== 'system' ? 'bg-transparent' : ''}`}
                      onClick={() => setTheme('system')}
                    >
                      <Monitor className="w-5 h-5" />
                      <span className="text-xs">システム</span>
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  システムを選択すると、デバイスの設定に合わせて自動的に切り替わります
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>プロフィール情報</CardTitle>
              <CardDescription>公開される基本情報を設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="space-y-2">
                <Label>プロフィール画像</Label>
                <div className="flex justify-center">
                  <ImageUpload
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    disabled={saving}
                    className="w-32 h-32 rounded-xl"
                    aspectRatio="square"
                  />
                </div>
              </div>

              {/* Username/Account ID */}
              <div className="space-y-2">
                <Label htmlFor="username">アカウントID</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="your_account_id"
                    className="pl-9 pr-10"
                    disabled={saving}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                    {usernameStatus === 'available' && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                      <XCircle className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                </div>
                {usernameError && (
                  <p className="text-xs text-destructive">{usernameError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Twitter/X のIDと同じにすることを推奨します。英数字と_のみ、3〜20文字
                </p>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">表示名</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="表示名を入力"
                  disabled={saving}
                  maxLength={50}
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">自己紹介</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="TRPGの経験や好きなシナリオなど..."
                  rows={3}
                  disabled={saving}
                  maxLength={500}
                />
              </div>

              <Button 
                onClick={saveProfile} 
                disabled={saving || (usernameStatus !== 'unchanged' && usernameStatus !== 'available')} 
                className="gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                保存
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>通知設定</CardTitle>
              <CardDescription>受け取る通知の種類を設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">メンション通知</p>
                  <p className="text-sm text-muted-foreground">
                    セッション記録であなたがメンションされた時
                  </p>
                </div>
                <Switch
                  checked={mentionNotification}
                  onCheckedChange={setMentionNotification}
                  disabled={saving}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">共有コード通知</p>
                  <p className="text-sm text-muted-foreground">
                    あなたの記録が共有された時
                  </p>
                </div>
                <Switch
                  checked={shareCodeNotification}
                  onCheckedChange={setShareCodeNotification}
                  disabled={saving}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">フォロー通知</p>
                  <p className="text-sm text-muted-foreground">
                    新しいフォロワーがいる時
                  </p>
                </div>
                <Switch
                  checked={followNotification}
                  onCheckedChange={setFollowNotification}
                  disabled={saving}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">いいね通知</p>
                  <p className="text-sm text-muted-foreground">
                    あなたのセッションにいいねがついた時
                  </p>
                </div>
                <Switch
                  checked={likeNotification}
                  onCheckedChange={setLikeNotification}
                  disabled={saving}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">週間サマリーメール</p>
                  <p className="text-sm text-muted-foreground">
                    週に一度、活動のまとめをメールで受け取る
                  </p>
                </div>
                <Switch
                  checked={emailWeeklySummary}
                  onCheckedChange={setEmailWeeklySummary}
                  disabled={saving}
                />
              </div>

              <Button onClick={saveNotificationSettings} disabled={saving} className="gap-2">
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                保存
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>プライバシー設定</CardTitle>
              <CardDescription>デフォルトの公開範囲を設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>デフォルトの公開設定</Label>
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
                <p className="text-xs text-muted-foreground">
                  新規作成時のデフォルト設定です。個別に変更できます。
                </p>
              </div>

              <Button onClick={saveProfile} disabled={saving} className="gap-2">
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                保存
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">アカウント</CardTitle>
              <CardDescription>ログアウトとアカウント管理</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={handleSignOut} className="bg-transparent">
                ログアウト
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pro Features Tab */}
        <TabsContent value="pro" className="space-y-6">
          {canUseFeature(profile, 'canUseCustomTags') ? (
            <>
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="w-5 h-5" />
                        カスタムタグ
                      </CardTitle>
                      <CardDescription>
                        タグでセッション記録を分類・管理
                      </CardDescription>
                    </div>
                    <TierBadge profile={profile} size="sm" />
                  </div>
                </CardHeader>
                <CardContent>
                  {profile && <TagManager userId={profile.id} disabled={saving} />}
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Folder className="w-5 h-5" />
                    カスタムフォルダ
                  </CardTitle>
                  <CardDescription>
                    フォルダでセッション記録をコレクション
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {profile && <FolderManager userId={profile.id} disabled={saving} />}
                </CardContent>
              </Card>

              {profile && <DataExport userId={profile.id} disabled={saving} />}
            </>
          ) : (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="py-12 text-center">
                <Crown className="w-12 h-12 mx-auto text-amber-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Pro機能を利用するには</h3>
                <p className="text-muted-foreground mb-4">
                  カスタムタグ、フォルダ、データエクスポートなどの機能はProプランでご利用いただけます。
                </p>
                <Button asChild>
                  <a href="/pricing">料金プランを見る</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Streamer Features Tab */}
        {canUseFeature(profile, 'canUseCustomUrl') && (
          <TabsContent value="streamer" className="space-y-6">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Link2 className="w-5 h-5" />
                      カスタムURL
                    </CardTitle>
                    <CardDescription>
                      あなた専用のプロフィールURL
                    </CardDescription>
                  </div>
                  <TierBadge profile={profile} size="sm" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>カスタムURL</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">rlyeh-wallet.com/u/</span>
                    <Input
                      value={customUrlSlug}
                      onChange={(e) => setCustomUrlSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="your-name"
                      className="max-w-xs"
                      disabled={saving}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    英数字とハイフンのみ使用可能
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  プロフィールカスタマイズ
                </CardTitle>
                <CardDescription>
                  ヘッダー画像とミニキャラアイコン
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>ヘッダー画像</Label>
                  <ImageUpload
                    value={headerImageUrl}
                    onChange={setHeaderImageUrl}
                    disabled={saving}
                    className="w-full h-32 rounded-lg"
                    aspectRatio="wide"
                  />
                  <p className="text-xs text-muted-foreground">
                    推奨サイズ: 1500x500px
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>ミニキャラアイコン</Label>
                  <ImageUpload
                    value={miniCharacterUrl}
                    onChange={setMiniCharacterUrl}
                    disabled={saving}
                    className="w-24 h-24 rounded-lg"
                    aspectRatio="square"
                  />
                  <p className="text-xs text-muted-foreground">
                    透過PNG推奨。プロフィールの装飾に使用されます。
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  視聴者インタラクション
                </CardTitle>
                <CardDescription>
                  視聴者からのコメントやふせったーを受け付ける
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">視聴者コメント受付</p>
                    <p className="text-sm text-muted-foreground">
                      セッション記録への視聴者コメントを許可
                    </p>
                  </div>
                  <Switch
                    checked={acceptViewerComments}
                    onCheckedChange={setAcceptViewerComments}
                    disabled={saving}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">ふせったー受付</p>
                    <p className="text-sm text-muted-foreground">
                      視聴者からのふせったー投稿を許可
                    </p>
                  </div>
                  <Switch
                    checked={acceptFusetter}
                    onCheckedChange={setAcceptFusetter}
                    disabled={saving}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">メンション承認制</p>
                    <p className="text-sm text-muted-foreground">
                      他のユーザーからのメンションを承認制にする
                    </p>
                  </div>
                  <Switch
                    checked={requireMentionApproval}
                    onCheckedChange={setRequireMentionApproval}
                    disabled={saving}
                  />
                </div>

                <Button onClick={saveStreamerSettings} disabled={saving} className="gap-2">
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  保存
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
