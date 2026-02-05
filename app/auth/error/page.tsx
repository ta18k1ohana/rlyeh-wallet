import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, AlertCircle } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight">{"R'lyeh Wallet"}</span>
          </Link>
        </div>

        <Card className="bg-card/50 border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">認証エラー</CardTitle>
            <CardDescription>
              認証処理中にエラーが発生しました
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              リンクの有効期限が切れているか、既に使用されている可能性があります。
              もう一度お試しください。
            </p>
            <div className="pt-4 space-y-2">
              <Link href="/auth/login">
                <Button className="w-full">
                  ログインページへ
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button variant="outline" className="w-full bg-transparent">
                  新規登録
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
