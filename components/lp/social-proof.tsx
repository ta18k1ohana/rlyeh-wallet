'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'

interface TestimonialProps {
  quote: string
  author: string
  role: string
}

const testimonials: TestimonialProps[] = [
  {
    quote: 'セッションの記録がこんなに楽になるとは思わなかった。もう手書きメモには戻れない。',
    author: 'ユーザーA',
    role: 'KPメイン / 50+卓',
  },
  {
    quote: '共有コードで同卓者と一瞬で記録を共有できるのが最高。既プレイ確認も助かってます。',
    author: 'ユーザーB',
    role: 'PLメイン / 30+卓',
  },
  {
    quote: 'ウォレットを眺めるのが楽しい。自分のTRPG人生が可視化されていく感覚がたまらない。',
    author: 'ユーザーC',
    role: 'KP&PL / 80+卓',
  },
]

function TestimonialCard({ quote, author, role }: TestimonialProps) {
  return (
    <div className="bg-lp-white border border-lp-200 rounded-2xl p-6 flex flex-col">
      <Quote className="w-5 h-5 text-lp-300 mb-3 shrink-0" />
      <p className="text-lp-700 text-sm leading-relaxed flex-1">
        {quote}
      </p>
      <div className="mt-4 pt-4 border-t border-lp-100">
        <p className="text-lp-900 text-sm font-medium">{author}</p>
        <p className="text-lp-400 text-xs mt-0.5">{role}</p>
      </div>
    </div>
  )
}

export function SocialProof() {
  return (
    <section className="py-20 bg-lp-50 border-y border-lp-200">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-lp-900 mb-2">
            プレイヤーの声
          </h2>
          <p className="text-lp-400 text-sm">
            ※ テスト用の仮テキストです。正式リリース時にユーザーの声に差し替えます。
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
            >
              <TestimonialCard {...t} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
