'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Plus, Star, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import type { PlayReport } from '@/lib/types'

interface FavoriteScenarioPickerProps {
  reports: PlayReport[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  max?: number
  disabled?: boolean
}

export function FavoriteScenarioPicker({
  reports,
  selectedIds,
  onChange,
  max = 3,
  disabled,
}: FavoriteScenarioPickerProps) {
  const [open, setOpen] = useState(false)

  const selectedReports = selectedIds
    .map((id) => reports.find((r) => r.id === id))
    .filter(Boolean) as PlayReport[]

  const availableReports = reports.filter((r) => !selectedIds.includes(r.id))

  function addReport(id: string) {
    if (selectedIds.length >= max) return
    onChange([...selectedIds, id])
    setOpen(false)
  }

  function removeReport(id: string) {
    onChange(selectedIds.filter((i) => i !== id))
  }

  return (
    <div className="space-y-3">
      {/* Selected scenarios */}
      {selectedReports.map((report, index) => (
        <div
          key={report.id}
          className="flex items-center gap-3 p-2.5 rounded-lg border border-amber-400/40 bg-amber-500/5"
        >
          <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
          <div className="w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
            {report.cover_image_url ? (
              <Image
                src={report.cover_image_url}
                alt={report.scenario_name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground bg-muted">
                {report.scenario_name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium truncate block">
              {report.scenario_name}
            </span>
            {report.scenario_author && (
              <span className="text-xs text-muted-foreground truncate block">
                {report.scenario_author}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 shrink-0"
            onClick={() => removeReport(report.id)}
            disabled={disabled}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      ))}

      {/* Add button */}
      {selectedIds.length < max && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 w-full"
              disabled={disabled}
            >
              <Plus className="w-4 h-4" />
              ウォレットから選択（{selectedIds.length}/{max}）
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[340px] p-0" align="start">
            <Command filter={(value, search) => {
              // Custom filter: search both scenario name and author
              if (!search) return 1
              const lower = search.toLowerCase()
              if (value.toLowerCase().includes(lower)) return 1
              // Also check author via the report data
              const report = availableReports.find(r => r.scenario_name === value)
              if (report?.scenario_author?.toLowerCase().includes(lower)) return 1
              return 0
            }}>
              <CommandInput
                placeholder="シナリオ名 or 作者名で検索..."
              />
              <CommandList>
                <CommandEmpty>該当するシナリオが見つかりません</CommandEmpty>
                <CommandGroup heading="あなたのウォレットから">
                  {availableReports.map((report) => (
                    <CommandItem
                      key={report.id}
                      value={report.scenario_name}
                      onSelect={() => addReport(report.id)}
                      className="gap-3 py-2"
                    >
                      <div className="w-8 h-8 rounded overflow-hidden bg-muted shrink-0">
                        {report.cover_image_url ? (
                          <Image
                            src={report.cover_image_url}
                            alt={report.scenario_name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            {report.scenario_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="truncate text-sm block">{report.scenario_name}</span>
                        {report.scenario_author && (
                          <span className="truncate text-xs text-muted-foreground block">{report.scenario_author}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

