'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!password || !confirmPassword) return

    if (password !== confirmPassword) {
      toast.error('パスワードが一致しません')
      return
    }

    if (password.length < 6) {
      toast.error('パスワードは6文字以上で設定してください')
      return
    }

    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      toast.error('パスワードの更新に失敗しました', {
        description: error.message,
      })
      setIsLoading(false)
      return
    }

    setIsSuccess(true)
    toast.success('パスワードを更新しました')
    
    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
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

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <CardTitle className="text-2xl">パスワードを更新しました</CardTitle>
              <CardDescription className="text-base mt-2">
                ダッシュボードにリダイレクトします...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">新しいパスワードを設定</CardTitle>
            <CardDescription>
              新しいパスワードを入力してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">新しいパスワード</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="6文字以上"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">パスワード（確認）</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="パスワードを再入力"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !password || !confirmPassword}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'パスワードを更新'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
