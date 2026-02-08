'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

function ElderSign({ className, delay }: { className: string; delay: number }) {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className={className}
      initial={{ opacity: 0, rotate: 0 }}
      animate={{ opacity: [0, 0.06, 0.03, 0.06, 0], rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, delay, ease: 'linear' }}
    >
      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <polygon
        points="50,12 61,38 90,38 67,56 76,84 50,66 24,84 33,56 10,38 39,38"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" strokeWidth="1" />
    </motion.svg>
  )
}

function TentacleDecoration() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Bottom-left tentacles */}
      <motion.svg
        viewBox="0 0 400 600"
        className="absolute -bottom-20 -left-20 w-[300px] md:w-[400px] h-auto text-lp-300/60"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2, delay: 1 }}
      >
        <motion.path
          d="M50,600 Q80,400 40,300 T80,100 Q90,60 120,40"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 4, delay: 1.2, ease: 'easeOut' }}
        />
        <motion.path
          d="M100,600 Q140,450 90,320 T130,150 Q150,100 180,70"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 4, delay: 1.5, ease: 'easeOut' }}
        />
        <motion.path
          d="M20,600 Q40,500 10,380 T50,200 Q60,150 90,120"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 4, delay: 1.8, ease: 'easeOut' }}
        />
        {[300, 340, 380, 420, 460].map((y, i) => (
          <motion.circle
            key={i}
            cx={60 + Math.sin(y * 0.02) * 20}
            cy={y}
            r="3"
            fill="currentColor"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 3, delay: 2 + i * 0.3, repeat: Infinity }}
          />
        ))}
      </motion.svg>

      {/* Top-right tentacles */}
      <motion.svg
        viewBox="0 0 400 500"
        className="absolute -top-10 -right-10 w-[250px] md:w-[350px] h-auto text-lp-300/40"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2, delay: 1.5 }}
      >
        <motion.path
          d="M350,0 Q320,100 360,200 T300,380 Q280,420 250,440"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 4, delay: 2, ease: 'easeOut' }}
        />
        <motion.path
          d="M380,0 Q360,80 390,180 T340,340 Q310,380 280,400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 4, delay: 2.3, ease: 'easeOut' }}
        />
      </motion.svg>
    </div>
  )
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${
            i % 3 === 0
              ? 'w-1 h-1 bg-lp-400/30'
              : i % 3 === 1
                ? 'w-1.5 h-1.5 bg-lp-300/25'
                : 'w-0.5 h-0.5 bg-lp-500/20'
          }`}
          animate={{
            y: [0, -120, 0],
            x: [0, Math.sin(i * 1.3) * 25, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 8 + (i % 5) * 2,
            repeat: Infinity,
            delay: (i * 0.9) % 6,
            ease: 'easeInOut',
          }}
          style={{
            left: `${(i * 8.33) % 100}%`,
            top: `${(i * 9.17) % 100}%`,
          }}
        />
      ))}
    </div>
  )
}

const heroContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
}

const heroItemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center bg-lp-white">
      {/* Subtle radial background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#f5f5f5_0%,_#ffffff_70%)]" />

      {/* Decorations */}
      <TentacleDecoration />
      <FloatingParticles />

      {/* Elder signs */}
      <ElderSign className="absolute top-[15%] left-[8%] w-20 md:w-28 text-lp-400" delay={0} />
      <ElderSign className="absolute bottom-[20%] right-[12%] w-16 md:w-24 text-lp-300" delay={5} />
      <ElderSign className="absolute top-[40%] right-[5%] w-12 md:w-16 text-lp-200" delay={10} />

      <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
        <motion.div
          variants={heroContainerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl mx-auto text-center"
        >
          <motion.div variants={heroItemVariants} className="mb-6">
            <Image
              src="/logo.png"
              alt="R'lyeh Wallet"
              width={64}
              height={64}
              className="mx-auto rounded-xl"
            />
          </motion.div>

          <motion.h1
            variants={heroItemVariants}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-lp-900 text-balance"
          >
            クトゥルフの記憶を、
            <br />
            永遠に
          </motion.h1>

          <motion.p
            variants={heroItemVariants}
            className="text-lg md:text-xl text-lp-500 mb-10 text-pretty max-w-2xl mx-auto"
          >
            プレイ履歴を美しく保存。フレンドとの共有も、統計の可視化も。
            <br className="hidden md:block" />
            あなたのTRPG体験を、ひとつのウォレットに。
          </motion.p>

          <motion.div
            variants={heroItemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/auth/login">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-lp-900 text-white hover:bg-lp-800 font-bold text-base px-8"
              >
                今すぐ記録を始める &rarr;
              </Button>
            </Link>
            <Link href="#preview">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-lp-300 text-lp-600 hover:bg-lp-50 bg-transparent"
              >
                体験してみる
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-lp-50 to-transparent" />
    </section>
  )
}
