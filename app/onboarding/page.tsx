'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/image-upload'
import { Loader2, CheckCircle2, XCircle, AtSign } from 'lucide-react'
import { toast } from 'sonner'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Form state
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  
  // Validation state
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [usernameError, setUsernameError] = useState<string | null>(null)

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check if profile already exists and is complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile && profile.username && !profile.username.startsWith('pending_')) {
        // Profile already complete, redirect to dashboard
        router.push('/dashboard')
        return
      }

      setUserId(user.id)
      
      // Pre-fill from OAuth data
      const name = user.user_metadata?.full_name || user.user_metadata?.name || ''
      setDisplayName(name)
      
      const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || ''
      setAvatarUrl(avatar)
      
      setLoading(false)
    }

    checkUser()
  }, [router])

  // Username validation
  useEffect(() => {
    if (!username) {
      setUsernameStatus('idle')
      setUsernameError(null)
      return
    }

    // Validate format: alphanumeric and underscore only, 3-20 characters
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
  }, [username])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!userId || usernameStatus !== 'available' || !displayName.trim()) {
      toast.error('入力内容を確認してください')
      return
    }

    setSaving(true)

    const supabase = createClient()
    
    // Create or update profile
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username: username.toLowerCase(),
        display_name: displayName.trim(),
        avatar_url: avatarUrl,
        bio: bio.trim() || null,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      if (error.code === '23505') {
        toast.error('このIDは既に使用されています')
        setUsernameStatus('taken')
      } else {
        toast.error('プロフィールの作成に失敗しました')
      }
      setSaving(false)
      return
    }

    toast.success('プロフィールを作成しました')
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="R'lyeh Wallet" 
              width={48} 
              height={48} 
              className="rounded-xl"
            />
            <span className="font-bold text-xl tracking-tight">{"R'lyeh Wallet"}</span>
          </Link>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">プロフィール設定</CardTitle>
            <CardDescription>
              あなたのアカウント情報を設定してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar */}
              <div className="space-y-2">
                <Label>プロフィール画像</Label>
                <div className="flex justify-center">
                  <ImageUpload
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    disabled={saving}
                    className="w-32 h-32 rounded-full"
                    aspectRatio="square"
                  />
                </div>
              </div>

              {/* Username/Account ID */}
              <div className="space-y-2">
                <Label htmlFor="username">
                  アカウントID *
                </Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="your_account_id"
                    className="pl-9 pr-10"
                    disabled={saving}
                    required
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
                <Label htmlFor="displayName">表示名 *</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="表示名"
                  disabled={saving}
                  required
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  他のユーザーに表示される名前です
                </p>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">自己紹介（任意）</Label>
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
                type="submit" 
                className="w-full" 
                disabled={saving || usernameStatus !== 'available' || !displayName.trim()}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    作成中...
                  </>
                ) : (
                  '始める'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
