'use client'

import React from "react"
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Users, 
  Share2, 
  BarChart3,
  Shield,
  Sparkles,
  BookOpen
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="R'lyeh Wallet" 
              width={36} 
              height={36} 
              className="rounded-lg"
            />
            <span className="font-bold text-lg tracking-tight">{"R'lyeh Wallet"}</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button size="sm">ログイン / 登録</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-balance">
              TRPGの思い出を
              <br />
              <span className="text-primary">永遠に刻む</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty">
              クトゥルフ神話TRPGのセッション履歴を記録・管理・共有。
              <br className="hidden md:block" />
              あなたの冒険の軌跡を、美しく残しましょう。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/login">
                <Button size="lg" className="w-full sm:w-auto">
                  無料で始める
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent">
                  機能を見る
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">主な機能</h2>
            <p className="text-muted-foreground">セッションの記録から共有まで、すべてをサポート</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <FeatureCard 
              icon={<BookOpen className="w-6 h-6" />}
              title="セッション記録"
              description="シナリオ名、参加者、結果など詳細な情報を記録。思い出を逃さない。"
            />
            <FeatureCard 
              icon={<Users className="w-6 h-6" />}
              title="参加者管理"
              description="KP/PLの情報を記録。キャラクター名や結果も一緒に保存。"
            />
            <FeatureCard 
              icon={<Share2 className="w-6 h-6" />}
              title="共有コード"
              description="セッション情報を簡単に共有。参加者同士で思い出を共有。"
            />
            <FeatureCard 
              icon={<BarChart3 className="w-6 h-6" />}
              title="統計ダッシュボード"
              description="セッション数、生存率、よく遊んだシナリオなど統計情報を可視化。"
            />
            <FeatureCard 
              icon={<Shield className="w-6 h-6" />}
              title="プライバシー設定"
              description="公開範囲を細かく設定。ネタバレ防止も完璧。"
            />
            <FeatureCard 
              icon={<Sparkles className="w-6 h-6" />}
              title="Twitter連携"
              description="セッション終了後、ワンクリックでTwitterに投稿。"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                今すぐ始めましょう
              </h2>
              <p className="text-muted-foreground mb-8">
                無料でアカウントを作成して、セッションの記録を始めましょう。
              </p>
              <Link href="/auth/login">
                <Button size="lg">
                  無料で登録する
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image 
                src="/logo.png" 
                alt="R'lyeh Wallet" 
                width={24} 
                height={24} 
                className="rounded"
              />
              <span className="text-sm text-muted-foreground">{"R'lyeh Wallet"}</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors">
                利用規約
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                プライバシーポリシー
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                お問い合わせ
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode
  title: string
  description: string 
}) {
  return (
    <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
          {icon}
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
