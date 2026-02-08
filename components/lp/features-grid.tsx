'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Users,
  Share2,
  BarChart3,
  Shield,
  Sparkles,
} from 'lucide-react'

const features = [
  {
    icon: BookOpen,
    title: 'セッション記録',
    description:
      'シナリオ名、参加者、結果など詳細な情報を記録。画像も添付して、思い出を逃さない。',
    size: 'large' as const,
  },
  {
    icon: BarChart3,
    title: '統計ダッシュボード',
    description: 'セッション数、生存率、KP/PL回数など統計情報を自動で可視化。',
    size: 'small' as const,
  },
  {
    icon: Users,
    title: '参加者管理',
    description: 'KP/PLの情報を記録。キャラクター名や結果も一緒に保存。フレンド機能で繋がる。',
    size: 'small' as const,
  },
  {
    icon: Share2,
    title: '共有コード',
    description:
      'セッション情報を簡単に共有。共有コードを入力するだけで、同卓者のウォレットにも反映。',
    size: 'small' as const,
  },
  {
    icon: Shield,
    title: 'プライバシー設定',
    description: '公開・フォロワーのみ・非公開の3段階。ネタバレ防止も完璧。',
    size: 'small' as const,
  },
  {
    icon: Sparkles,
    title: 'タイムライン & フィード',
    description:
      'フレンドやフォロー中ユーザーの通過報告をタイムラインで確認。いいねやコメントも。',
    size: 'large' as const,
  },
]

export function FeaturesGrid() {
  return (
    <section id="features" className="py-24 bg-lp-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-lp-900">主な機能</h2>
          <p className="text-lp-500 text-lg">
            セッションの記録から共有まで、すべてをサポート
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{
                y: -6,
                transition: { duration: 0.2 },
              }}
              className={`
                bg-lp-50 p-7 rounded-2xl border border-lp-200
                transition-all cursor-default hover:bg-lp-100 hover:border-lp-300
                ${feature.size === 'large' ? 'md:col-span-2' : ''}
              `}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-lp-100 text-lp-700">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2 text-lp-900">{feature.title}</h3>
              <p className="text-sm text-lp-500 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
