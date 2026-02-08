'use client'

import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Pencil, Share2, BookOpen } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const steps = [
  {
    number: '01',
    title: '入力',
    description: 'シナリオ名、参加者、結果を簡単フォームで入力。画像も添付できます。',
    icon: Pencil,
    color: 'text-lp-700',
    bgColor: 'bg-lp-100 border-lp-200',
  },
  {
    number: '02',
    title: '保存・共有',
    description: 'ワンクリックで保存完了。共有コードで同卓者にも簡単共有。',
    icon: Share2,
    color: 'text-lp-600',
    bgColor: 'bg-lp-100 border-lp-200',
  },
  {
    number: '03',
    title: 'アーカイブ化',
    description: 'プレイ統計も自動生成。既プレイ確認も瞬時に。美しいウォレットに。',
    icon: BookOpen,
    color: 'text-lp-700',
    bgColor: 'bg-lp-100 border-lp-200',
  },
]

export function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const isMobile = window.innerWidth < 768

    if (isMobile) {
      stepsRef.current.forEach((step) => {
        if (!step) return
        gsap.fromTo(
          step,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            scrollTrigger: {
              trigger: step,
              start: 'top 80%',
              end: 'top 50%',
              scrub: 1,
            },
          }
        )
      })
      return
    }

    const ctx = gsap.context(() => {
      const validSteps = stepsRef.current.filter(Boolean) as HTMLDivElement[]

      ScrollTrigger.create({
        trigger: container,
        start: 'top top',
        end: `+=${validSteps.length * 100}%`,
        pin: true,
        anticipatePin: 1,
      })

      validSteps.forEach((step, index) => {
        gsap.fromTo(
          step,
          { opacity: 0, y: 80, scale: 0.85 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            scrollTrigger: {
              trigger: container,
              start: `top+=${index * 100}% top`,
              end: `top+=${index * 100 + 50}% top`,
              scrub: 1,
            },
          }
        )

        if (index < validSteps.length - 1) {
          gsap.to(step, {
            opacity: 0,
            scale: 0.85,
            y: -40,
            scrollTrigger: {
              trigger: container,
              start: `top+=${(index + 1) * 100 - 30}% top`,
              end: `top+=${(index + 1) * 100}% top`,
              scrub: 1,
            },
          })
        }
      })

      // Subtle background shift
      gsap.fromTo(
        container,
        { backgroundColor: '#fafafa' },
        {
          backgroundColor: '#f5f5f5',
          scrollTrigger: {
            trigger: container,
            start: 'top top',
            end: `+=${validSteps.length * 100}%`,
            scrub: 1,
          },
        }
      )
    })

    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-lp-50 flex items-center justify-center overflow-hidden border-t border-lp-200"
    >
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-5xl font-bold text-lp-900 text-center mb-16 md:mb-24">
          使い方は<span className="text-lp-500">シンプル</span>
        </h2>

        <div className="relative min-h-[300px]">
          {steps.map((step, index) => (
            <div
              key={index}
              ref={(el) => {
                stepsRef.current[index] = el
              }}
              className="md:absolute md:inset-0 flex items-center justify-center mb-16 md:mb-0"
              style={{
                opacity: index === 0 ? 1 : undefined,
              }}
            >
              <div className="text-center max-w-2xl">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl border ${step.bgColor} mb-6`}>
                  <step.icon className={`w-10 h-10 ${step.color}`} />
                </div>
                <div className={`text-base font-bold mb-3 tracking-widest ${step.color}`}>
                  STEP {step.number}
                </div>
                <h3 className="text-4xl md:text-5xl font-bold mb-4 text-lp-900">{step.title}</h3>
                <p className="text-lg md:text-xl text-lp-500 max-w-lg mx-auto">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
