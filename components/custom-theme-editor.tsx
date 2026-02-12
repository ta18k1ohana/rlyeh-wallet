'use client'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Palette, RotateCcw } from 'lucide-react'
import { useState, useEffect } from 'react'

export interface CustomTheme {
  primaryColor: string      // Main accent color
  backgroundColor: string   // Profile background
  textColor: string         // Primary text color
  cardColor: string         // Card background
  borderColor: string       // Border color
}

const DEFAULT_THEME: CustomTheme = {
  primaryColor: '#6366f1',    // Indigo
  backgroundColor: '#09090b', // Zinc-950
  textColor: '#fafafa',       // Zinc-50
  cardColor: '#18181b',       // Zinc-900
  borderColor: '#27272a',     // Zinc-800
}

const PRESET_THEMES: { name: string; theme: CustomTheme }[] = [
  {
    name: 'ダーク（デフォルト）',
    theme: DEFAULT_THEME,
  },
  {
    name: 'コズミックパープル',
    theme: {
      primaryColor: '#a855f7',
      backgroundColor: '#0f0720',
      textColor: '#f0e6ff',
      cardColor: '#1a0d30',
      borderColor: '#2d1a4e',
    },
  },
  {
    name: 'ミスカトニック・ブルー',
    theme: {
      primaryColor: '#3b82f6',
      backgroundColor: '#020617',
      textColor: '#e2e8f0',
      cardColor: '#0f172a',
      borderColor: '#1e293b',
    },
  },
  {
    name: 'クトゥルフ・グリーン',
    theme: {
      primaryColor: '#22c55e',
      backgroundColor: '#022c22',
      textColor: '#dcfce7',
      cardColor: '#052e16',
      borderColor: '#14532d',
    },
  },
  {
    name: 'ニャルラトホテプ',
    theme: {
      primaryColor: '#ef4444',
      backgroundColor: '#1a0000',
      textColor: '#fecaca',
      cardColor: '#2a0000',
      borderColor: '#450a0a',
    },
  },
]

interface CustomThemeEditorProps {
  value: Record<string, string> | null
  onChange: (theme: Record<string, string> | null) => void
  disabled?: boolean
  className?: string
}

export function CustomThemeEditor({
  value,
  onChange,
  disabled = false,
  className,
}: CustomThemeEditorProps) {
  const [theme, setTheme] = useState<CustomTheme>(() => {
    if (value) {
      return {
        primaryColor: value.primaryColor || DEFAULT_THEME.primaryColor,
        backgroundColor: value.backgroundColor || DEFAULT_THEME.backgroundColor,
        textColor: value.textColor || DEFAULT_THEME.textColor,
        cardColor: value.cardColor || DEFAULT_THEME.cardColor,
        borderColor: value.borderColor || DEFAULT_THEME.borderColor,
      }
    }
    return DEFAULT_THEME
  })

  useEffect(() => {
    onChange(theme as unknown as Record<string, string>)
  }, [theme]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateColor = (key: keyof CustomTheme, color: string) => {
    setTheme(prev => ({ ...prev, [key]: color }))
  }

  const applyPreset = (preset: CustomTheme) => {
    setTheme(preset)
  }

  const resetToDefault = () => {
    setTheme(DEFAULT_THEME)
    onChange(null)
  }

  const colorFields: { key: keyof CustomTheme; label: string }[] = [
    { key: 'primaryColor', label: 'アクセントカラー' },
    { key: 'backgroundColor', label: '背景色' },
    { key: 'textColor', label: 'テキスト色' },
    { key: 'cardColor', label: 'カード背景色' },
    { key: 'borderColor', label: 'ボーダー色' },
  ]

  return (
    <div className={cn('space-y-4', className)}>
      {/* Presets */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">プリセット</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_THEMES.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset.theme)}
              disabled={disabled}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                'hover:opacity-80 disabled:opacity-50'
              )}
              style={{
                backgroundColor: preset.theme.cardColor,
                color: preset.theme.textColor,
                borderColor: preset.theme.primaryColor,
              }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: preset.theme.primaryColor }}
              />
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Color Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {colorFields.map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme[key]}
                onChange={(e) => updateColor(key, e.target.value)}
                disabled={disabled}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
              <Input
                value={theme[key]}
                onChange={(e) => updateColor(key, e.target.value)}
                disabled={disabled}
                className="text-sm font-mono"
                placeholder="#000000"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">プレビュー</Label>
        <div
          className="rounded-lg p-4 border"
          style={{
            backgroundColor: theme.backgroundColor,
            borderColor: theme.borderColor,
          }}
        >
          <div
            className="rounded-md p-3 border"
            style={{
              backgroundColor: theme.cardColor,
              borderColor: theme.borderColor,
            }}
          >
            <p style={{ color: theme.textColor }} className="text-sm font-medium mb-1">
              サンプルプロフィール
            </p>
            <p style={{ color: theme.textColor }} className="text-xs opacity-70 mb-2">
              TRPGセッション記録 — Call of Cthulhu
            </p>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: theme.primaryColor + '20',
                color: theme.primaryColor,
              }}
            >
              配信者
            </span>
          </div>
        </div>
      </div>

      {/* Reset Button */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={resetToDefault}
        disabled={disabled}
        className="text-muted-foreground"
      >
        <RotateCcw className="w-3.5 h-3.5 mr-1" />
        デフォルトに戻す
      </Button>
    </div>
  )
}

/**
 * Apply custom theme CSS variables to a container
 */
export function applyCustomTheme(theme: Record<string, string> | null | undefined): React.CSSProperties {
  if (!theme) return {}

  return {
    '--custom-primary': theme.primaryColor || '',
    '--custom-bg': theme.backgroundColor || '',
    '--custom-text': theme.textColor || '',
    '--custom-card': theme.cardColor || '',
    '--custom-border': theme.borderColor || '',
  } as React.CSSProperties
}
