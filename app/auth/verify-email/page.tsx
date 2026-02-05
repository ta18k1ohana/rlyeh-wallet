'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, ArrowLeft } from 'lucide-react'

export default function VerifyEmailPage() {
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
            <CardTitle className="text-2xl">メールを確認してください</CardTitle>
            <CardDescription className="text-base mt-2">
              登録したメールアドレスに確認メールを送信しました。
              メール内のリンクをクリックして登録を完了してください。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <p>メールが届かない場合は、以下をご確認ください：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>迷惑メールフォルダを確認</li>
                <li>メールアドレスが正しいか確認</li>
                <li>数分待ってから再度お試しください</li>
              </ul>
            </div>

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
