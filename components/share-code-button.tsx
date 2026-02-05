'use client'

import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface ShareCodeButtonProps {
  code: string
  variant?: 'default' | 'icon'
}

export function ShareCodeButton({ code, variant = 'default' }: ShareCodeButtonProps) {
  const [copied, setCopied] = useState(false)

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('共有コードをコピーしました')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('コピーに失敗しました')
    }
  }

  if (variant === 'icon') {
    return (
      <Button variant="ghost" size="icon" onClick={copyToClipboard}>
        {copied ? (
          <Check className="w-4 h-4 text-primary" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
    )
  }

  return (
    <Button variant="outline" size="sm" onClick={copyToClipboard} className="gap-2 bg-transparent">
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          コピー済み
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          共有コード
        </>
      )}
    </Button>
  )
}
