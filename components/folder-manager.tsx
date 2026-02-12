'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Folder, Edit2, Trash2, Loader2, GripVertical, FolderPlus, Crown } from 'lucide-react'
import { toast } from 'sonner'
import type { ReportFolder, PlayReport, CustomFolder } from '@/lib/types'

interface FolderManagerProps {
  userId: string
  disabled?: boolean
  onFoldersChange?: () => void
}

export function FolderManager({ userId, disabled, onFoldersChange }: FolderManagerProps) {
  const [folders, setFolders] = useState<ReportFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<ReportFolder | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderDescription, setNewFolderDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchFolders()
  }, [userId])

  async function fetchFolders() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('report_folders')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order')

      if (!error && data) {
        setFolders(data)
      }
    } catch {
      // Table doesn't exist yet
      console.log('[v0] report_folders table not available')
    }
    setLoading(false)
  }

  async function handleSaveFolder() {
    if (!newFolderName.trim()) {
      toast.error('フォルダ名を入力してください')
      return
    }

    setSaving(true)
    const supabase = createClient()

    if (editingFolder) {
      const { error } = await supabase
        .from('report_folders')
        .update({ 
          name: newFolderName.trim(), 
          description: newFolderDescription.trim() || null 
        })
        .eq('id', editingFolder.id)

      if (error) {
        toast.error('フォルダの更新に失敗しました')
      } else {
        toast.success('フォルダを更新しました')
        fetchFolders()
        onFoldersChange?.()
      }
    } else {
      const { error } = await supabase
        .from('report_folders')
        .insert({
          user_id: userId,
          name: newFolderName.trim(),
          description: newFolderDescription.trim() || null,
          sort_order: folders.length,
        })

      if (error) {
        if (error.code === '23505') {
          toast.error('同じ名前のフォルダが既に存在します')
        } else {
          toast.error('フォルダの作成に失敗しました')
        }
      } else {
        toast.success('フォルダを作成しました')
        fetchFolders()
        onFoldersChange?.()
      }
    }

    setSaving(false)
    setIsOpen(false)
    setEditingFolder(null)
    setNewFolderName('')
    setNewFolderDescription('')
  }

  async function handleDeleteFolder(folderId: string) {
    const supabase = createClient()
    
    // First, unassign all reports from this folder
    await supabase
      .from('play_reports')
      .update({ folder_id: null })
      .eq('folder_id', folderId)
    
    const { error } = await supabase
      .from('report_folders')
      .delete()
      .eq('id', folderId)

    if (error) {
      toast.error('フォルダの削除に失敗しました')
    } else {
      toast.success('フォルダを削除しました')
      setFolders(folders.filter(f => f.id !== folderId))
      onFoldersChange?.()
    }
  }

  function openEditDialog(folder: ReportFolder) {
    setEditingFolder(folder)
    setNewFolderName(folder.name)
    setNewFolderDescription(folder.description || '')
    setIsOpen(true)
  }

  function openNewDialog() {
    setEditingFolder(null)
    setNewFolderName('')
    setNewFolderDescription('')
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
          <Folder className="w-4 h-4" />
          カスタムフォルダ
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
              新規フォルダ
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingFolder ? 'フォルダを編集' : '新規フォルダ'}</DialogTitle>
              <DialogDescription>
                フォルダを作成してセッション記録をコレクションできます
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>フォルダ名</Label>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="例: クトゥルフ2020、長編シナリオ"
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label>説明（任意）</Label>
                <Textarea
                  value={newFolderDescription}
                  onChange={(e) => setNewFolderDescription(e.target.value)}
                  placeholder="フォルダの説明..."
                  rows={2}
                  maxLength={200}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="bg-transparent">
                キャンセル
              </Button>
              <Button onClick={handleSaveFolder} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingFolder ? '更新' : '作成'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {folders.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          まだフォルダがありません。フォルダを作成してセッション記録をコレクションしましょう。
        </p>
      ) : (
        <div className="space-y-2">
          {folders.map((folder) => (
            <Card key={folder.id} className="bg-muted/30 border-border/50">
              <CardContent className="p-3 flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                <Folder className="w-5 h-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{folder.name}</p>
                  {folder.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {folder.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(folder)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteFolder(folder.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Dialog to assign a report to a folder
interface AssignToFolderDialogProps {
  report: PlayReport
  folders: ReportFolder[]
  onAssigned?: () => void
  trigger?: React.ReactNode
}

export function AssignToFolderDialog({ report, folders, onAssigned, trigger }: AssignToFolderDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedFolderId, setSelectedFolderId] = useState<string>(report.folder_id || 'none')
  const [isAssigning, setIsAssigning] = useState(false)

  async function handleAssign() {
    setIsAssigning(true)

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('play_reports')
        .update({
          folder_id: selectedFolderId === 'none' ? null : selectedFolderId,
        })
        .eq('id', report.id)

      if (error) throw error

      toast.success('フォルダを変更しました')
      setOpen(false)
      onAssigned?.()
    } catch (error) {
      console.error('Assign folder error:', error)
      toast.error('フォルダの変更に失敗しました')
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-2">
            <FolderPlus className="w-4 h-4" />
            フォルダに追加
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>フォルダに追加</DialogTitle>
          <DialogDescription>
            「{report.scenario_name}」を追加するフォルダを選択
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
            <SelectTrigger>
              <SelectValue placeholder="フォルダを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">フォルダなし</SelectItem>
              {folders.map(folder => (
                <SelectItem key={folder.id} value={folder.id}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isAssigning}>
            キャンセル
          </Button>
          <Button onClick={handleAssign} disabled={isAssigning}>
            {isAssigning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              '保存'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Simple "Create folder" button with dialog (no list, no empty state)
// Used in wallet header alongside "新規記録"
interface CreateFolderButtonProps {
  userId: string
  onFolderCreated?: () => void
}

export function CreateFolderButton({ userId, onFolderCreated }: CreateFolderButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState<ReportFolder | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderDescription, setNewFolderDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSaveFolder() {
    if (!newFolderName.trim()) {
      toast.error('フォルダ名を入力してください')
      return
    }

    setSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('report_folders')
      .insert({
        user_id: userId,
        name: newFolderName.trim(),
        description: newFolderDescription.trim() || null,
        sort_order: 0,
      })

    if (error) {
      if (error.code === '23505') {
        toast.error('同じ名前のフォルダが既に存在します')
      } else {
        toast.error('フォルダの作成に失敗しました')
      }
    } else {
      toast.success('フォルダを作成しました')
      onFolderCreated?.()
    }

    setSaving(false)
    setIsOpen(false)
    setNewFolderName('')
    setNewFolderDescription('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 bg-transparent"
          onClick={() => {
            setNewFolderName('')
            setNewFolderDescription('')
            setIsOpen(true)
          }}
        >
          <FolderPlus className="w-4 h-4" />
          新規フォルダ
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新規フォルダ</DialogTitle>
          <DialogDescription>
            フォルダを作成してセッション記録をコレクションできます
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>フォルダ名</Label>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="例: クトゥルフ2020、長編シナリオ"
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label>説明（任意）</Label>
            <Textarea
              value={newFolderDescription}
              onChange={(e) => setNewFolderDescription(e.target.value)}
              placeholder="フォルダの説明..."
              rows={2}
              maxLength={200}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="bg-transparent">
            キャンセル
          </Button>
          <Button onClick={handleSaveFolder} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            作成
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Pro feature indicator
export function ProFeatureIndicator() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
      <Crown className="w-4 h-4 text-amber-600" />
      <span className="text-sm text-amber-600">
        フォルダ機能はProプラン以上で利用可能です
      </span>
    </div>
  )
}

// Folder selector for use in forms
interface FolderSelectorProps {
  userId: string
  selectedFolders: string[]
  onChange: (folderIds: string[]) => void
  disabled?: boolean
}

export function FolderSelector({ userId, selectedFolders, onChange, disabled }: FolderSelectorProps) {
  const [folders, setFolders] = useState<CustomFolder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFolders() {
      const supabase = createClient()
      const { data } = await supabase
        .from('custom_folders')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order')

      if (data) {
        setFolders(data)
      }
      setLoading(false)
    }
    fetchFolders()
  }, [userId])

  function toggleFolder(folderId: string) {
    if (selectedFolders.includes(folderId)) {
      onChange(selectedFolders.filter(id => id !== folderId))
    } else {
      onChange([...selectedFolders, folderId])
    }
  }

  if (loading) {
    return <Loader2 className="w-4 h-4 animate-spin" />
  }

  if (folders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        フォルダがありません。設定からフォルダを作成できます。
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {folders.map((folder) => (
        <button
          key={folder.id}
          type="button"
          onClick={() => toggleFolder(folder.id)}
          disabled={disabled}
          className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-colors ${
            selectedFolders.includes(folder.id)
              ? 'border-primary bg-primary/10'
              : 'border-border bg-muted/30 hover:bg-muted/50'
          } disabled:opacity-50`}
        >
          <Folder className={`w-5 h-5 ${
            selectedFolders.includes(folder.id) ? 'text-primary' : 'text-muted-foreground'
          }`} />
          <span className="text-sm font-medium">{folder.name}</span>
        </button>
      ))}
    </div>
  )
}
