'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Download, Loader2, FileJson, FileText } from 'lucide-react'
import { toast } from 'sonner'

interface DataExportProps {
  userId: string
  disabled?: boolean
}

export function DataExport({ userId, disabled }: DataExportProps) {
  const [exporting, setExporting] = useState(false)
  const [includeImages, setIncludeImages] = useState(true)
  const [includeParticipants, setIncludeParticipants] = useState(true)
  const [includeLinks, setIncludeLinks] = useState(true)
  const [includeTags, setIncludeTags] = useState(true)
  const [includeFolders, setIncludeFolders] = useState(true)

  async function handleExportJSON() {
    setExporting(true)

    try {
      const supabase = createClient()

      // Fetch play reports
      const { data: reports, error: reportsError } = await supabase
        .from('play_reports')
        .select(`
          *,
          participants:play_report_participants(*),
          images:play_report_images(*),
          links:play_report_links(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (reportsError) throw reportsError

      // Fetch tags if included
      let tags = []
      let reportTags = []
      if (includeTags) {
        const { data: tagsData } = await supabase
          .from('custom_tags')
          .select('*')
          .eq('user_id', userId)

        const { data: reportTagsData } = await supabase
          .from('report_tags')
          .select('*')

        tags = tagsData || []
        reportTags = reportTagsData || []
      }

      // Fetch folders if included
      let folders = []
      let reportFolders = []
      if (includeFolders) {
        const { data: foldersData } = await supabase
          .from('custom_folders')
          .select('*')
          .eq('user_id', userId)

        const { data: reportFoldersData } = await supabase
          .from('report_folders')
          .select('*')

        folders = foldersData || []
        reportFolders = reportFoldersData || []
      }

      // Build export data
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        playReports: reports?.map(report => ({
          ...report,
          participants: includeParticipants ? report.participants : undefined,
          images: includeImages ? report.images : undefined,
          links: includeLinks ? report.links : undefined,
        })),
        customTags: includeTags ? tags : undefined,
        reportTags: includeTags ? reportTags : undefined,
        customFolders: includeFolders ? folders : undefined,
        reportFolders: includeFolders ? reportFolders : undefined,
      }

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rlyeh-wallet-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('データをエクスポートしました')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('エクスポートに失敗しました')
    } finally {
      setExporting(false)
    }
  }

  async function handleExportCSV() {
    setExporting(true)

    try {
      const supabase = createClient()

      const { data: reports, error } = await supabase
        .from('play_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Create CSV content
      const headers = [
        'シナリオ名',
        '作者',
        'プレイ日',
        '結果',
        'エンディング',
        '感想',
        '作成日',
      ]

      const rows = reports?.map(report => [
        report.scenario_name,
        report.scenario_author || '',
        report.play_date_start,
        report.result || '',
        report.end_type || '',
        (report.impression || '').replace(/"/g, '""'),
        report.created_at,
      ])

      const csvContent = [
        headers.join(','),
        ...(rows?.map(row => row.map(cell => `"${cell}"`).join(',')) || []),
      ].join('\n')

      // Add BOM for Excel compatibility
      const bom = '\uFEFF'
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rlyeh-wallet-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('CSVをエクスポートしました')
    } catch (error) {
      console.error('CSV Export error:', error)
      toast.error('エクスポートに失敗しました')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          データエクスポート
        </CardTitle>
        <CardDescription>
          あなたの全てのセッション記録をバックアップ
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>エクスポートに含める項目</Label>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-participants"
                checked={includeParticipants}
                onCheckedChange={(checked) => setIncludeParticipants(!!checked)}
                disabled={disabled || exporting}
              />
              <Label htmlFor="include-participants" className="font-normal cursor-pointer">
                参加者情報
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-images"
                checked={includeImages}
                onCheckedChange={(checked) => setIncludeImages(!!checked)}
                disabled={disabled || exporting}
              />
              <Label htmlFor="include-images" className="font-normal cursor-pointer">
                画像URL
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-links"
                checked={includeLinks}
                onCheckedChange={(checked) => setIncludeLinks(!!checked)}
                disabled={disabled || exporting}
              />
              <Label htmlFor="include-links" className="font-normal cursor-pointer">
                関連リンク
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-tags"
                checked={includeTags}
                onCheckedChange={(checked) => setIncludeTags(!!checked)}
                disabled={disabled || exporting}
              />
              <Label htmlFor="include-tags" className="font-normal cursor-pointer">
                カスタムタグ
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="include-folders"
                checked={includeFolders}
                onCheckedChange={(checked) => setIncludeFolders(!!checked)}
                disabled={disabled || exporting}
              />
              <Label htmlFor="include-folders" className="font-normal cursor-pointer">
                カスタムフォルダ
              </Label>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleExportJSON}
            disabled={disabled || exporting}
            className="gap-2"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileJson className="w-4 h-4" />
            )}
            JSON形式でエクスポート
          </Button>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={disabled || exporting}
            className="gap-2 bg-transparent"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            CSV形式でエクスポート
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          JSONには全てのデータが含まれます。CSVはExcelなどのスプレッドシートで開けます。
        </p>
      </CardContent>
    </Card>
  )
}
