'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Users, BookOpen, Calendar, Clock, Shield } from 'lucide-react'

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

const resultColors: Record<string, string> = {
  '生還': 'bg-emerald-500',
  'ロスト': 'bg-red-500',
  '狂気': 'bg-purple-500',
  'BAD END': 'bg-gray-500',
  'GOOD END': 'bg-blue-500',
}

const resultTextColors: Record<string, string> = {
  '生還': 'text-emerald-400',
  'ロスト': 'text-red-400',
  '狂気': 'text-purple-400',
  'BAD END': 'text-gray-400',
  'GOOD END': 'text-blue-400',
}

export function SampleCardPreview() {
  const [sessionData, setSessionData] = useState({
    scenario: '',
    kp: '',
    players: '',
    result: '生還',
  })

  return (
    <section id="preview" className="py-24 bg-lp-50">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold text-center mb-4 text-lp-900"
        >
          あなたの記録を試してみよう
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-center text-lp-500 mb-12 text-lg"
        >
          実際にどう保存されるか、今すぐ体験できます
        </motion.p>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto items-start">
          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium mb-2 text-lp-700">
                シナリオ名
              </label>
              <input
                type="text"
                placeholder="例：忘却の彼方"
                value={sessionData.scenario}
                onChange={(e) =>
                  setSessionData({ ...sessionData, scenario: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg border-2 border-lp-200 bg-lp-white focus:border-lp-900 transition-colors outline-none text-lp-900 placeholder:text-lp-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-lp-700">KP名</label>
              <input
                type="text"
                placeholder="例：深海探検家"
                value={sessionData.kp}
                onChange={(e) =>
                  setSessionData({ ...sessionData, kp: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg border-2 border-lp-200 bg-lp-white focus:border-lp-900 transition-colors outline-none text-lp-900 placeholder:text-lp-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-lp-700">
                PL名（カンマ区切り）
              </label>
              <input
                type="text"
                placeholder="例：探索者A, 探索者B, 探索者C"
                value={sessionData.players}
                onChange={(e) =>
                  setSessionData({ ...sessionData, players: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg border-2 border-lp-200 bg-lp-white focus:border-lp-900 transition-colors outline-none text-lp-900 placeholder:text-lp-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-lp-700">結果</label>
              <select
                value={sessionData.result}
                onChange={(e) =>
                  setSessionData({ ...sessionData, result: e.target.value })
                }
                className="w-full px-4 py-3 rounded-lg border-2 border-lp-200 bg-lp-white focus:border-lp-900 transition-colors outline-none text-lp-900"
              >
                <option>生還</option>
                <option>ロスト</option>
                <option>狂気</option>
                <option>BAD END</option>
                <option>GOOD END</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-lp-700">
                画像（オプション）
              </label>
              <div className="border-2 border-dashed border-lp-200 rounded-lg p-6 text-center hover:border-lp-400 transition-colors cursor-pointer bg-lp-white">
                <Upload className="mx-auto mb-2 text-lp-400" size={28} />
                <p className="text-sm text-lp-400">
                  クリックまたはドラッグ＆ドロップ
                </p>
              </div>
            </div>
          </motion.div>

          {/* Live Preview Card — kept dark to match actual app appearance */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-start md:sticky md:top-24"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${sessionData.scenario}-${sessionData.result}`}
                initial={{ opacity: 0, scale: 0.95, rotateY: -5 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.95, rotateY: 5 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="w-full bg-lp-950 text-white rounded-2xl shadow-2xl shadow-lp-950/30 overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-6 md:p-8 pb-4 md:pb-6">
                  <div className="flex items-center gap-2 mb-5">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${resultColors[sessionData.result] || 'bg-gray-500'}`}
                    />
                    <span
                      className={`text-sm font-medium ${resultTextColors[sessionData.result] || 'text-gray-400'}`}
                    >
                      {sessionData.result}
                    </span>
                  </div>

                  <h3 className="text-xl md:text-2xl font-bold mb-4 min-h-[2rem]">
                    {sessionData.scenario || 'シナリオ名がここに表示されます'}
                  </h3>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-400">KP:</span>
                      <span>{sessionData.kp || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-400">PL:</span>
                      <span>{sessionData.players || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Image Preview Area */}
                <div className="aspect-video bg-lp-900/50 flex items-center justify-center border-t border-white/5">
                  <div className="text-center">
                    <BookOpen className="mx-auto mb-2 text-gray-600" size={32} />
                    <p className="text-gray-500 text-sm">画像プレビュー</p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-4 md:p-6 border-t border-white/5 bg-lp-900/30">
                  <div className="flex items-center gap-3 mb-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date().toLocaleDateString('ja-JP')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      4h
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-white text-lp-950 font-semibold py-3 rounded-lg flex items-center justify-center gap-2 text-sm"
                  >
                    <TwitterIcon className="w-4 h-4" />
                    Xに投稿
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
