'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, Clock, Layers } from 'lucide-react'
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
        {/* Card Container */}
        <div className={cn(
          "relative overflow-hidden rounded-xl",
          "bg-card border border-border/40",
          "transition-all duration-300 ease-out",
          "hover:shadow-xl hover:shadow-black/[0.08] dark:hover:shadow-black/30",
          "hover:border-border/60 hover:-translate-y-0.5"
        )}>
          {/* Image wrapper with folder stack effect — only shown when image exists */}
          {stats.cover_image_url ? (
            <div className="relative w-full aspect-[4/3] bg-muted/30">
              {/* Stacked card effect behind */}
              <div className="absolute -top-1 left-2 right-2 h-3 rounded-t-lg bg-muted/50 border border-b-0 border-border/30" />
              <div className="absolute -top-2 left-4 right-4 h-2 rounded-t-lg bg-muted/30 border border-b-0 border-border/20" />

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
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm border border-border/50">
                <Layers className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs font-medium">{stats.report_count}</span>
              </div>
            </div>
          ) : (
            /* Card count badge only, no image area */
            <div className="flex items-center gap-1 px-3 pt-3">
              <Layers className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{stats.report_count}件</span>
            </div>
          )}

          {/* Content area */}
          <div className="p-4 space-y-2.5">
            {/* Title */}
            <h3 className="font-medium text-sm leading-relaxed line-clamp-2 text-foreground/90 group-hover:text-foreground transition-colors">
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
