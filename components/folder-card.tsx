'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Clock, Layers, Folder, FolderOpen } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { ReportFolder, PlayReport } from '@/lib/types'

interface FolderCardProps {
  folder: ReportFolder
  onClick?: () => void
}

// Helper to calculate folder stats from reports
export function calculateFolderStats(reports: PlayReport[]) {
  const totalLikes = reports.reduce((sum, r) => sum + (r.likes_count || 0), 0)
  const totalDuration = reports.reduce((sum, r) => sum + (r.play_duration || 0), 0)

  // Find KP info from first report's participants
  let kpInfo: { username: string; avatar_url: string | null } | null = null
  for (const report of reports) {
    const kp = report.participants?.find(p => p.role === 'KP')
    if (kp) {
      kpInfo = {
        username: kp.username,
        avatar_url: kp.profile?.avatar_url || null
      }
      break
    }
  }

  // Get cover image from first report (or the one marked as cover)
  const coverImageUrl = reports[0]?.cover_image_url || null

  return {
    report_count: reports.length,
    total_likes: totalLikes,
    total_duration: totalDuration,
    cover_image_url: coverImageUrl,
    kp_info: kpInfo,
  }
}

// Format duration in minutes to hours
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export function FolderCard({ folder, onClick }: FolderCardProps) {
  const stats = folder.reports
    ? calculateFolderStats(folder.reports)
    : {
      report_count: folder.report_count || 0,
      total_likes: folder.total_likes || 0,
      total_duration: folder.total_duration || 0,
      cover_image_url: folder.cover_image_url || null,
      kp_info: folder.kp_info || null,
    }

  return (
    <div className="group break-inside-avoid mb-5">
      <button
        type="button"
        onClick={onClick}
        className="block w-full text-left"
      >
        {/* Folder Tab — the distinctive visual indicator */}
        <div className="flex items-end">
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg",
            "bg-amber-500/15 dark:bg-amber-500/20 border border-b-0 border-amber-500/30",
            "transition-colors duration-300",
            "group-hover:bg-amber-500/25 dark:group-hover:bg-amber-500/30"
          )}>
            <Folder className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 tracking-wide">
              {stats.report_count}件
            </span>
          </div>
          {/* Spacer to fill the rest of the top */}
          <div className="flex-1" />
        </div>

        {/* Card Container */}
        <div className={cn(
          "relative overflow-hidden rounded-b-xl rounded-tr-xl",
          "border border-amber-500/30",
          "bg-gradient-to-br from-amber-500/[0.06] via-card to-card",
          "dark:from-amber-500/[0.08] dark:via-card dark:to-card",
          "transition-all duration-300 ease-out",
          "hover:shadow-xl hover:shadow-amber-500/[0.06] dark:hover:shadow-amber-500/[0.08]",
          "hover:border-amber-500/50 hover:-translate-y-0.5"
        )}>
          {/* Image wrapper with folder stack effect — only shown when image exists */}
          {stats.cover_image_url ? (
            <div className="relative w-full aspect-[4/3] bg-muted/20">
              {/* Stacked card effect behind */}
              <div className="absolute -top-1 left-2 right-2 h-3 rounded-t-lg bg-amber-500/10 border border-b-0 border-amber-500/20" />
              <div className="absolute -top-2 left-4 right-4 h-2 rounded-t-lg bg-amber-500/5 border border-b-0 border-amber-500/10" />

              {/* Main image */}
              <div className="relative w-full h-full">
                <Image
                  src={stats.cover_image_url || "/placeholder.svg"}
                  alt={folder.name}
                  fill
                  className="object-contain p-3"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              </div>

              {/* Card count badge */}
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/15 backdrop-blur-sm border border-amber-500/30">
                <Layers className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{stats.report_count}</span>
              </div>
            </div>
          ) : (
            /* Folder icon placeholder — no image */
            <div className="flex flex-col items-center justify-center py-6 px-4">
              <div className="relative">
                <FolderOpen className="w-12 h-12 text-amber-500/40 dark:text-amber-400/30 transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30">
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">{stats.report_count}</span>
                </div>
              </div>
            </div>
          )}

          {/* Content area */}
          <div className="p-4 space-y-2.5">
            {/* Title */}
            <h3 className="font-semibold text-sm leading-relaxed line-clamp-2 text-foreground/90 group-hover:text-foreground transition-colors">
              {folder.name}
            </h3>

            {/* KP Info */}
            {stats.kp_info && (
              <div className="flex items-center gap-2">
                <Avatar className="w-5 h-5 rounded-md">
                  <AvatarImage src={stats.kp_info.avatar_url || undefined} className="rounded-md" />
                  <AvatarFallback className="text-[10px] rounded-md">
                    {stats.kp_info.username.replace('@', '').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate">
                  KP: {stats.kp_info.username}
                </span>
              </div>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-4 pt-1">
              {/* Total likes */}
              <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {stats.total_likes}
              </span>

              {/* Total duration */}
              {stats.total_duration > 0 && (
                <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(stats.total_duration)}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
    </div>
  )
}

// Virtual folder for auto-grouped reports (same scenario name)
export interface VirtualFolder {
  name: string
  reports: PlayReport[]
  isVirtual: true
}

// Check if reports should be auto-grouped into folders
export function groupReportsIntoFolders(
  reports: PlayReport[],
  existingFolders: ReportFolder[]
): (PlayReport | VirtualFolder | ReportFolder)[] {
  const result: (PlayReport | VirtualFolder | ReportFolder)[] = []
  const usedReportIds = new Set<string>()

  // Find the "ミニカード" folder (if it exists)
  const miniCardFolder = existingFolders.find(f => f.name === 'ミニカード')

  // Collect all mini card reports (is_mini=true), regardless of folder_id
  const orphanedMiniCards = miniCardFolder
    ? reports.filter(r => r.is_mini && r.folder_id !== miniCardFolder.id)
    : []

  // First, add reports that are in existing folders (including empty folders)
  for (const folder of existingFolders) {
    let folderReports = reports.filter(r => r.folder_id === folder.id)

    // If this is the ミニカード folder, also include orphaned mini cards
    if (miniCardFolder && folder.id === miniCardFolder.id) {
      folderReports = [...folderReports, ...orphanedMiniCards]
    }

    for (const r of folderReports) usedReportIds.add(r.id)
    result.push({
      ...folder,
      reports: folderReports,
    })
  }

  // If there's no ミニカード folder but there are mini cards, create a virtual folder for them
  if (!miniCardFolder) {
    const allMiniCards = reports.filter(r => r.is_mini)
    if (allMiniCards.length > 0) {
      for (const r of allMiniCards) usedReportIds.add(r.id)
      result.push({
        name: 'ミニカード',
        reports: allMiniCards,
        isVirtual: true,
      })
    }
  }

  // Group remaining reports by scenario_name
  const reportsByName = new Map<string, PlayReport[]>()
  for (const report of reports) {
    if (usedReportIds.has(report.id)) continue

    const name = report.scenario_name.toLowerCase().trim()
    if (!reportsByName.has(name)) {
      reportsByName.set(name, [])
    }
    reportsByName.get(name)!.push(report)
  }

  // Create virtual folders for groups of 2+ reports, otherwise add as single
  for (const [, groupReports] of reportsByName) {
    if (groupReports.length >= 2) {
      // Auto-group as virtual folder
      result.push({
        name: groupReports[0].scenario_name,
        reports: groupReports.sort((a, b) =>
          new Date(b.play_date_start).getTime() - new Date(a.play_date_start).getTime()
        ),
        isVirtual: true,
      })
    } else {
      // Single report, add directly
      result.push(groupReports[0])
    }
  }

  return result
}

// Type guard for virtual folder
export function isVirtualFolder(item: PlayReport | VirtualFolder | ReportFolder): item is VirtualFolder {
  return 'isVirtual' in item && item.isVirtual === true
}

// Type guard for real folder
export function isReportFolder(item: PlayReport | VirtualFolder | ReportFolder): item is ReportFolder {
  return 'user_id' in item && 'created_at' in item && !('isVirtual' in item)
}

// Type guard for play report
export function isPlayReport(item: PlayReport | VirtualFolder | ReportFolder): item is PlayReport {
  return 'scenario_name' in item && !('isVirtual' in item) && !('reports' in item)
}
