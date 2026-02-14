'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Twitter } from 'lucide-react'
import type { ScenarioPreference } from '@/lib/types'

interface XShareButtonProps {
    preferences: ScenarioPreference[]
    variant?: 'default' | 'outline' | 'ghost'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    className?: string
}

export function XShareButton({
    preferences,
    variant = 'outline',
    size = 'default',
    className
}: XShareButtonProps) {
    const wantToPlay = preferences.filter(p => p.preference_type === 'want_to_play')

    function handleShare() {
        const now = new Date()
        const month = now.getMonth() + 1

        let text = `${month}月に回りたいシナリオ\n\n`

        wantToPlay.slice(0, 10).forEach((pref, index) => {
            text += `${index + 1}. ${pref.scenario_name}`
            if (pref.scenario_author) {
                text += `（${pref.scenario_author}）`
            }
            text += '\n'
        })

        text += '\n#月初めだから回りたいシナリオ10個言う\n#TRPG #ルルイエウォレット'

        const encodedText = encodeURIComponent(text)
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`

        window.open(twitterUrl, '_blank', 'width=550,height=420')
    }

    if (wantToPlay.length === 0) {
        return null
    }

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleShare}
            className={className}
        >
            <Twitter className="w-4 h-4 mr-2" />
            Xで共有
        </Button>
    )
}
