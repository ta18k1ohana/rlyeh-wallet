'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Plus, Search } from 'lucide-react'
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
  const [search, setSearch] = useState('')

  const selectedReports = selectedIds
    .map((id) => reports.find((r) => r.id === id))
    .filter(Boolean) as PlayReport[]

  const availableReports = reports.filter((r) => !selectedIds.includes(r.id))

  function addReport(id: string) {
    if (selectedIds.length >= max) return
    onChange([...selectedIds, id])
    setOpen(false)
    setSearch('')
  }

  function removeReport(id: string) {
    onChange(selectedIds.filter((i) => i !== id))
  }

  return (
    <div className="space-y-3">
      {/* Selected scenarios */}
      {selectedReports.map((report) => (
        <div
          key={report.id}
          className="flex items-center gap-3 p-2 rounded-lg border border-border/50 bg-card/30"
        >
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
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                —
              </div>
            )}
          </div>
          <span className="text-sm font-medium truncate flex-1">
            {report.scenario_name}
          </span>
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
              シナリオを追加（{selectedIds.length}/{max}）
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput
                placeholder="シナリオを検索..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>シナリオが見つかりません</CommandEmpty>
                <CommandGroup>
                  {availableReports.map((report) => (
                    <CommandItem
                      key={report.id}
                      value={report.scenario_name}
                      onSelect={() => addReport(report.id)}
                      className="gap-3"
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
                            —
                          </div>
                        )}
                      </div>
                      <span className="truncate text-sm">{report.scenario_name}</span>
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
