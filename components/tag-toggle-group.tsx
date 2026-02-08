'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TagToggleGroupProps {
  options: readonly string[]
  selected: string[]
  onChange: (selected: string[]) => void
  disabled?: boolean
}

export function TagToggleGroup({ options, selected, onChange, disabled }: TagToggleGroupProps) {
  function toggle(tag: string) {
    if (disabled) return
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag))
    } else {
      onChange([...selected, tag])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((tag) => {
        const isSelected = selected.includes(tag)
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggle(tag)}
            disabled={disabled}
          >
            <Badge
              variant={isSelected ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer select-none transition-colors',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {tag}
            </Badge>
          </button>
        )
      })}
    </div>
  )
}
