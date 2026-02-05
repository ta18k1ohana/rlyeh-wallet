'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, X, Link as LinkIcon, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ReportLink {
  id?: string
  link_type: 'scenario' | 'replay' | 'character_sheet' | 'other'
  url: string
  title: string
}

interface LinkManagerProps {
  links: ReportLink[]
  onChange: (links: ReportLink[]) => void
  maxLinks: number
  disabled?: boolean
  showLimitWarning?: boolean
}

const LINK_TYPES = [
  { value: 'scenario', label: 'シナリオ' },
  { value: 'replay', label: 'リプレイ' },
  { value: 'character_sheet', label: 'キャラクターシート' },
  { value: 'other', label: 'その他' },
] as const

export function LinkManager({
  links,
  onChange,
  maxLinks,
  disabled = false,
  showLimitWarning = false,
}: LinkManagerProps) {
  const [newLink, setNewLink] = useState<ReportLink>({
    link_type: 'other',
    url: '',
    title: '',
  })

  function addLink() {
    if (!newLink.url || links.length >= maxLinks) return
    
    // Basic URL validation
    let url = newLink.url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    
    onChange([...links, { ...newLink, url }])
    setNewLink({ link_type: 'other', url: '', title: '' })
  }

  function removeLink(index: number) {
    const newLinks = [...links]
    newLinks.splice(index, 1)
    onChange(newLinks)
  }

  function updateLink(index: number, field: keyof ReportLink, value: string) {
    const newLinks = [...links]
    newLinks[index] = { ...newLinks[index], [field]: value }
    onChange(newLinks)
  }

  return (
    <div className="space-y-4">
      {/* Existing links */}
      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((link, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border"
            >
              <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <Select
                    value={link.link_type}
                    onValueChange={(value) => updateLink(index, 'link_type', value)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LINK_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={link.title}
                    onChange={(e) => updateLink(index, 'title', e.target.value)}
                    placeholder="タイトル（任意）"
                    className="h-8 text-xs flex-1"
                    disabled={disabled}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={link.url}
                    onChange={(e) => updateLink(index, 'url', e.target.value)}
                    placeholder="https://..."
                    className="h-8 text-xs flex-1"
                    disabled={disabled}
                  />
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeLink(index)}
                disabled={disabled}
                className="shrink-0 h-8 w-8 bg-transparent"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add new link */}
      {links.length < maxLinks && (
        <div className="space-y-2 p-3 rounded-lg border border-dashed border-border">
          <Label className="text-xs text-muted-foreground">新しいリンクを追加</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select
              value={newLink.link_type}
              onValueChange={(value: ReportLink['link_type']) =>
                setNewLink({ ...newLink, link_type: value })
              }
              disabled={disabled}
            >
              <SelectTrigger className="w-full sm:w-32 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LINK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={newLink.title}
              onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
              placeholder="タイトル（任意）"
              className="h-9"
              disabled={disabled}
            />
            <Input
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              placeholder="https://..."
              className="h-9 flex-1"
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addLink()
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addLink}
              disabled={disabled || !newLink.url}
              className="h-9 gap-2 bg-transparent"
            >
              <Plus className="w-4 h-4" />
              追加
            </Button>
          </div>
        </div>
      )}

      {/* Count and warning */}
      <div className="flex justify-between items-center text-xs">
        <span className={cn(
          "text-muted-foreground",
          links.length >= maxLinks && "text-amber-600"
        )}>
          {links.length}/{maxLinks}件のリンク
        </span>
        {showLimitWarning && links.length >= maxLinks && (
          <span className="text-amber-600">
            Proプランで最大20件まで追加可能
          </span>
        )}
      </div>
    </div>
  )
}
