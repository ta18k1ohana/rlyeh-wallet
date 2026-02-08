'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden bg-lp-50">
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-lp-900">
            今すぐ始めましょう
          </h2>
          <p className="text-lp-500 mb-10 text-lg max-w-xl mx-auto">
            無料でアカウントを作成して、セッションの記録を始めましょう。
            あなたのTRPG体験を、ひとつのウォレットに。
          </p>

          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link href="/auth/login">
              <Button
                size="lg"
                className="bg-lp-900 text-white hover:bg-lp-800 font-bold text-base px-10 py-6 h-auto"
              >
                無料で登録する &rarr;
              </Button>
            </Link>
          </motion.div>

          <p className="text-xs text-lp-400 mt-6">
            クレジットカード不要 &middot; すぐに使い始められます
          </p>
        </motion.div>
      </div>
    </section>
  )
}
