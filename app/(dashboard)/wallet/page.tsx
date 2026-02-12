'use client'

import React from "react"

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List,
  ArrowUpDown,
  BookOpen,
  Users,
  Trophy,
  Clock,
  Loader2,
  FolderOpen,
  ArrowLeft
} from 'lucide-react'
import { SessionCard, SessionCardGrid } from '@/components/session-card'
import { 
  FolderCard, 
  groupReportsIntoFolders, 
  isVirtualFolder, 
  isPlayReport,
  type VirtualFolder,
  calculateFolderStats
} from '@/components/folder-card'
import { CreateFolderButton, ProFeatureIndicator } from '@/components/folder-manager'
import type { PlayReport, ReportFolder, Profile } from '@/lib/types'
import { getProfileLimits } from '@/lib/tier-limits'

type SortOption = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc'
type FilterResult = 'all' | 'success' | 'failure'

export default function WalletPage() {
  const [loading, setLoading] = useState(true)
  const [myReports, setMyReports] = useState<PlayReport[]>([])
  const [folders, setFolders] = useState<ReportFolder[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  
  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [openFolder, setOpenFolder] = useState<VirtualFolder | ReportFolder | null>(null)
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date_desc')
  const [filterResult, setFilterResult] = useState<FilterResult>('all')
  const [filterYear, setFilterYear] = useState<string>('all')

  // Stats
  const [stats, setStats] = useState({
    totalSessions: 0,
    asKP: 0,
    asPL: 0,
    uniqueScenarios: 0,
    totalHours: 0,
    survivalRate: 0,
  })

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Get user profile for username matching and tier info
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (userProfile) {
        setProfile(userProfile)
      }

      // Get user's folders (table may not exist yet)
      try {
        const { data: foldersData, error: foldersError } = await supabase
          .from('report_folders')
          .select('*')
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true })

        if (!foldersError) {
          setFolders(foldersData || [])
        }
      } catch {
        // Table doesn't exist yet, ignore
        console.log('[v0] report_folders table not available')
      }

      // Get all reports created by the user
      const { data: allReports } = await supabase
        .from('play_reports')
        .select(`
          *,
          profile:profiles!play_reports_user_id_fkey(username, display_name, avatar_url),
          participants:play_report_participants(*)
        `)
        .eq('user_id', user.id)
        .order('play_date_start', { ascending: false })

      const myReportsData = allReports || []
      setMyReports(myReportsData)

      const totalSessions = myReportsData.length
      
      let asKP = 0
      let asPL = 0
      let surviveCount = 0
      let totalPLSessions = 0
      const countedReportIds = new Set<string>()
      
      // Helper to check if participant matches current user
      const isUserParticipant = (p: { user_id?: string | null; username?: string | null }) => {
        if (p.user_id === user.id) return true
        if (!userProfile) return false
        const username = p.username?.toLowerCase() || ''
        const userUsername = userProfile.username?.toLowerCase() || ''
        const userDisplayName = userProfile.display_name?.toLowerCase() || ''
        // Match @username format or display name
        return username === `@${userUsername}` || 
               username === userUsername ||
               (userDisplayName && username === userDisplayName)
      }

      // Count from own reports' participants
      myReportsData.forEach(report => {
        report.participants?.forEach(p => {
          if (isUserParticipant(p)) {
            const key = `${report.id}-${p.role}`
            if (!countedReportIds.has(key)) {
              countedReportIds.add(key)
              if (p.role === 'KP') asKP++
              if (p.role === 'PL') {
                asPL++
                const isLost = p.result === 'lost' || p.result === 'dead' || p.result === 'insane'
                if (p.result === 'survive' || isLost) {
                  totalPLSessions++
                  if (p.result === 'survive') surviveCount++
                }
              }
            }
          }
        })
      })

      // Also get participations in other people's reports
      const { data: allParticipations } = await supabase
        .from('play_report_participants')
        .select('play_report_id, role, result, user_id, username')
      
      allParticipations?.forEach(p => {
        if (isUserParticipant(p)) {
          const key = `${p.play_report_id}-${p.role}`
          if (!countedReportIds.has(key)) {
            countedReportIds.add(key)
            if (p.role === 'KP') asKP++
            if (p.role === 'PL') {
              asPL++
              const isLost = p.result === 'lost' || p.result === 'dead' || p.result === 'insane'
              if (p.result === 'survive' || isLost) {
                totalPLSessions++
                if (p.result === 'survive') surviveCount++
              }
            }
          }
        }
      })

      const uniqueScenarios = new Set(myReportsData.map(r => r.scenario_name)).size

      const totalHours = myReportsData.reduce((acc, r) => acc + (r.play_duration || 0), 0)

      const survivalRate = totalPLSessions > 0 
        ? Math.round((surviveCount / totalPLSessions) * 100) 
        : 0

      setStats({
        totalSessions,
        asKP,
        asPL,
        uniqueScenarios,
        totalHours,
        survivalRate,
      })

      setLoading(false)
    }

    loadData()
  }, [])

  // Group reports into folders (virtual for same scenario names, real for user-created)
  const groupedItems = useMemo(() => {
    return groupReportsIntoFolders(myReports, folders)
  }, [myReports, folders])

  // Check if user can use folders feature
  const canUseFolders = profile ? getProfileLimits(profile).canUseFolders : false

  // Get available years for filter
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    myReports.forEach(r => {
      if (r.play_date_start) {
        years.add(new Date(r.play_date_start).getFullYear().toString())
      }
    })
    return Array.from(years).sort((a, b) => Number(b) - Number(a))
  }, [myReports])

  // Filter and sort function - works with both flat and folder views
  const filteredReports = useMemo(() => {
    // If viewing a folder, filter those reports
    const reportsToFilter = openFolder && 'reports' in openFolder 
      ? openFolder.reports 
      : myReports

    let filtered = [...reportsToFilter]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => 
        r.scenario_name.toLowerCase().includes(query) ||
        r.scenario_author?.toLowerCase().includes(query)
      )
    }

    // Year filter
    if (filterYear !== 'all') {
      filtered = filtered.filter(r => 
        r.play_date_start && new Date(r.play_date_start).getFullYear().toString() === filterYear
      )
    }

    // Result filter
    if (filterResult !== 'all') {
      filtered = filtered.filter(r => r.result === filterResult)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.play_date_start).getTime() - new Date(a.play_date_start).getTime()
        case 'date_asc':
          return new Date(a.play_date_start).getTime() - new Date(b.play_date_start).getTime()
        case 'name_asc':
          return a.scenario_name.localeCompare(b.scenario_name, 'ja')
        case 'name_desc':
          return b.scenario_name.localeCompare(a.scenario_name, 'ja')
        default:
          return 0
      }
    })

    return filtered
  }, [myReports, openFolder, searchQuery, filterYear, filterResult, sortBy])

  // Filtered grouped items (for folder view)
  const filteredGroupedItems = useMemo(() => {
    if (!searchQuery && filterYear === 'all' && filterResult === 'all') {
      return groupedItems
    }
    
    // When filtering, show flat list instead of folders
    return filteredReports
  }, [groupedItems, filteredReports, searchQuery, filterYear, filterResult])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Wallet</h1>
          <p className="text-muted-foreground">作成した記録</p>
        </div>
        <div className="flex items-center gap-2">
          {canUseFolders && profile && (
            <CreateFolderButton
              userId={profile.id}
              onFolderCreated={() => {
                const loadFolders = async () => {
                  const supabase = createClient()
                  const { data } = await supabase
                    .from('report_folders')
                    .select('*')
                    .eq('user_id', profile.id)
                    .order('sort_order', { ascending: true })
                  setFolders(data || [])
                }
                loadFolders()
              }}
            />
          )}
          <Link href="/reports/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              新規記録
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={<BookOpen className="w-4 h-4" />} label="総セッション" value={stats.totalSessions} />
        <StatCard icon={<Users className="w-4 h-4" />} label="KP回数" value={stats.asKP} />
        <StatCard icon={<Trophy className="w-4 h-4" />} label="PL回数" value={stats.asPL} />
        <StatCard icon={<BookOpen className="w-4 h-4" />} label="シナリオ数" value={stats.uniqueScenarios} />
        <StatCard icon={<Clock className="w-4 h-4" />} label="総プレイ時間" value={`${stats.totalHours.toFixed(0)}h`} />
        <StatCard icon={<Trophy className="w-4 h-4" />} label="生還率" value={`${stats.survivalRate}%`} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="シナリオ名・作者で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="年" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全期間</SelectItem>
            {availableYears.map(year => (
              <SelectItem key={year} value={year}>{year}年</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterResult} onValueChange={(v: FilterResult) => setFilterResult(v)}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="結果" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全て</SelectItem>
            <SelectItem value="success">成功</SelectItem>
            <SelectItem value="failure">失敗</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
          <SelectTrigger className="w-[140px]">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date_desc">新しい順</SelectItem>
            <SelectItem value="date_asc">古い順</SelectItem>
            <SelectItem value="name_asc">名前順 A-Z</SelectItem>
            <SelectItem value="name_desc">名前順 Z-A</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex border rounded-lg overflow-hidden">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="rounded-none"
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="rounded-none"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Folder View Header (when inside a folder) */}
      {openFolder && (
        <div className="flex items-center gap-3 pb-2 border-b border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpenFolder(null)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            戻る
          </Button>
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">{openFolder.name}</h2>
            <span className="text-sm text-muted-foreground">
              ({('reports' in openFolder ? openFolder.reports.length : 0)}件)
            </span>
          </div>
        </div>
      )}

      {/* Content Area */}
      {openFolder ? (
        // Inside folder — show reports only
        filteredReports.length > 0 ? (
          viewMode === 'grid' ? (
            <SessionCardGrid columns={4}>
              {filteredReports.map(report => (
                <SessionCard
                  key={report.id}
                  report={report}
                  showEdit
                />
              ))}
            </SessionCardGrid>
          ) : (
            <div className="space-y-3">
              {filteredReports.map(report => (
                <SessionCard
                  key={report.id}
                  report={report}
                  compact
                  showEdit
                />
              ))}
            </div>
          )
        ) : (
          <EmptyState hasFilters={!!searchQuery || filterYear !== 'all' || filterResult !== 'all'} />
        )
      ) : (
        // Main view — folders and reports mixed naturally in same grid
        filteredGroupedItems.length > 0 ? (
          viewMode === 'grid' ? (
            <SessionCardGrid columns={4}>
              {filteredGroupedItems.map((item, index) => {
                if (isVirtualFolder(item)) {
                  return (
                    <FolderCard
                      key={`vf-${item.name}-${index}`}
                      folder={{
                        id: `virtual-${item.name}`,
                        user_id: '',
                        name: item.name,
                        description: null,
                        cover_report_id: null,
                        sort_order: 0,
                        created_at: '',
                        updated_at: '',
                        reports: item.reports,
                        ...calculateFolderStats(item.reports),
                      }}
                      onClick={() => setOpenFolder(item)}
                    />
                  )
                } else if (isPlayReport(item)) {
                  return (
                    <SessionCard
                      key={item.id}
                      report={item}
                      showEdit
                    />
                  )
                } else {
                  // Real folder (ReportFolder)
                  const folder = item as ReportFolder
                  return (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      onClick={() => setOpenFolder(folder)}
                    />
                  )
                }
              })}
            </SessionCardGrid>
          ) : (
            <div className="space-y-3">
              {filteredGroupedItems.map((item, index) => {
                if (isVirtualFolder(item)) {
                  return (
                    <FolderCard
                      key={`vf-${item.name}-${index}`}
                      folder={{
                        id: `virtual-${item.name}`,
                        user_id: '',
                        name: item.name,
                        description: null,
                        cover_report_id: null,
                        sort_order: 0,
                        created_at: '',
                        updated_at: '',
                        reports: item.reports,
                        ...calculateFolderStats(item.reports),
                      }}
                      onClick={() => setOpenFolder(item)}
                    />
                  )
                } else if (isPlayReport(item)) {
                  return (
                    <SessionCard
                      key={item.id}
                      report={item}
                      compact
                      showEdit
                    />
                  )
                } else {
                  const folder = item as ReportFolder
                  return (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      onClick={() => setOpenFolder(folder)}
                    />
                  )
                }
              })}
            </div>
          )
        ) : (
          <EmptyState hasFilters={!!searchQuery || filterYear !== 'all' || filterResult !== 'all'} />
        )
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <div className="text-xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">条件に一致する記録がありません</p>
          <p className="text-sm text-muted-foreground mt-1">
            フィルターを変更してください
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="py-12 text-center">
        <p className="text-muted-foreground">まだセッション記録がありません</p>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          最初のセッションを記録してみましょう
        </p>
        <Link href="/reports/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            新規記録を作成
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
