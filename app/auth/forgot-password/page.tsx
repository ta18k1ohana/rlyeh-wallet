'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      toast.error('リセットメールの送信に失敗しました', {
        description: error.message,
      })
      setIsLoading(false)
      return
    }

    setIsSuccess(true)
    setIsLoading(false)
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
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">メールを送信しました</CardTitle>
              <CardDescription className="text-base mt-2">
                パスワードリセット用のリンクを送信しました。
                メール内のリンクをクリックしてパスワードを再設定してください。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/auth/login" className="block">
                <Button variant="outline" className="w-full gap-2 bg-transparent">
                  <ArrowLeft className="w-4 h-4" />
                  ログインページに戻る
                </Button>
              </Link>
            </CardContent>
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
            <CardTitle className="text-2xl">パスワードをリセット</CardTitle>
            <CardDescription>
              登録したメールアドレスにリセットリンクを送信します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'リセットリンクを送信'
                )}
              </Button>
            </form>

            <Link href="/auth/login" className="block">
              <Button variant="ghost" className="w-full gap-2">
                <ArrowLeft className="w-4 h-4" />
                ログインに戻る
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
