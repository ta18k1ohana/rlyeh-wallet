'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, X, Edit2, Loader2, Tag } from 'lucide-react'
import { toast } from 'sonner'
import type { CustomTag } from '@/lib/types'

const TAG_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
]

interface TagManagerProps {
  userId: string
  disabled?: boolean
}

export function TagManager({ userId, disabled }: TagManagerProps) {
  const [tags, setTags] = useState<CustomTag[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<CustomTag | null>(null)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTags()
  }, [userId])

  async function fetchTags() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('custom_tags')
      .select('*')
      .eq('user_id', userId)
      .order('name')

    if (!error && data) {
      setTags(data)
    }
    setLoading(false)
  }

  async function handleSaveTag() {
    if (!newTagName.trim()) {
      toast.error('タグ名を入力してください')
      return
    }

    setSaving(true)
    const supabase = createClient()

    if (editingTag) {
      // Update existing tag
      const { error } = await supabase
        .from('custom_tags')
        .update({ name: newTagName.trim(), color: newTagColor })
        .eq('id', editingTag.id)

      if (error) {
        toast.error('タグの更新に失敗しました')
      } else {
        toast.success('タグを更新しました')
        fetchTags()
      }
    } else {
      // Create new tag
      const { error } = await supabase
        .from('custom_tags')
        .insert({
          user_id: userId,
          name: newTagName.trim(),
          color: newTagColor,
        })

      if (error) {
        if (error.code === '23505') {
          toast.error('同じ名前のタグが既に存在します')
        } else {
          toast.error('タグの作成に失敗しました')
        }
      } else {
        toast.success('タグを作成しました')
        fetchTags()
      }
    }

    setSaving(false)
    setIsOpen(false)
    setEditingTag(null)
    setNewTagName('')
    setNewTagColor(TAG_COLORS[0])
  }

  async function handleDeleteTag(tagId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('custom_tags')
      .delete()
      .eq('id', tagId)

    if (error) {
      toast.error('タグの削除に失敗しました')
    } else {
      toast.success('タグを削除しました')
      setTags(tags.filter(t => t.id !== tagId))
    }
  }

  function openEditDialog(tag: CustomTag) {
    setEditingTag(tag)
    setNewTagName(tag.name)
    setNewTagColor(tag.color)
    setIsOpen(true)
  }

  function openNewDialog() {
    setEditingTag(null)
    setNewTagName('')
    setNewTagColor(TAG_COLORS[0])
    setIsOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base flex items-center gap-2">
          <Tag className="w-4 h-4" />
          カスタムタグ
        </Label>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={openNewDialog}
              disabled={disabled}
              className="gap-2 bg-transparent"
            >
              <Plus className="w-4 h-4" />
              新規タグ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTag ? 'タグを編集' : '新規タグ'}</DialogTitle>
              <DialogDescription>
                カスタムタグを作成してセッション記録を整理できます
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>タグ名</Label>
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="例: お気に入り、ホラー、長編"
                  maxLength={30}
                />
              </div>
              <div className="space-y-2">
                <Label>カラー</Label>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewTagColor(color)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        newTagColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <span className="text-sm text-muted-foreground">プレビュー:</span>
                <Badge
                  style={{ backgroundColor: newTagColor, color: 'white' }}
                >
                  {newTagName || 'タグ名'}
                </Badge>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="bg-transparent">
                キャンセル
              </Button>
              <Button onClick={handleSaveTag} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingTag ? '更新' : '作成'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          まだタグがありません。タグを作成してセッション記録を整理しましょう。
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="group flex items-center gap-1 bg-muted/50 rounded-full pl-1 pr-2 py-1"
            >
              <Badge
                style={{ backgroundColor: tag.color, color: 'white' }}
                className="cursor-pointer"
                onClick={() => openEditDialog(tag)}
              >
                {tag.name}
              </Badge>
              <button
                type="button"
                onClick={() => handleDeleteTag(tag.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-destructive/20 rounded"
              >
                <X className="w-3 h-3 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Tag selector for use in forms
interface TagSelectorProps {
  userId: string
  selectedTags: string[]
  onChange: (tagIds: string[]) => void
  disabled?: boolean
}

export function TagSelector({ userId, selectedTags, onChange, disabled }: TagSelectorProps) {
  const [tags, setTags] = useState<CustomTag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTags() {
      const supabase = createClient()
      const { data } = await supabase
        .from('custom_tags')
        .select('*')
        .eq('user_id', userId)
        .order('name')

      if (data) {
        setTags(data)
      }
      setLoading(false)
    }
    fetchTags()
  }, [userId])

  function toggleTag(tagId: string) {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter(id => id !== tagId))
    } else {
      onChange([...selectedTags, tagId])
    }
  }

  if (loading) {
    return <Loader2 className="w-4 h-4 animate-spin" />
  }

  if (tags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        タグがありません。設定からタグを作成できます。
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => toggleTag(tag.id)}
          disabled={disabled}
          className="transition-opacity disabled:opacity-50"
        >
          <Badge
            variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
            style={
              selectedTags.includes(tag.id)
                ? { backgroundColor: tag.color, color: 'white', borderColor: tag.color }
                : { borderColor: tag.color, color: tag.color }
            }
            className="cursor-pointer"
          >
            {tag.name}
          </Badge>
        </button>
      ))}
    </div>
  )
}
