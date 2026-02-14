'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { Lightbulb, User, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface AuthorSuggestion {
    name: string
    count: number
    profile?: {
        id: string
        username: string
        display_name: string | null
        avatar_url: string | null
    } | null
}

interface ScenarioAuthorSuggestProps {
    scenarioName: string
    value: string
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

export function ScenarioAuthorSuggest({
    scenarioName,
    value,
    onChange,
    placeholder = '作者名',
    disabled = false,
    className,
}: ScenarioAuthorSuggestProps) {
    const [suggestions, setSuggestions] = useState<AuthorSuggestion[]>([])
    const [loading, setLoading] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const [lastQueriedName, setLastQueriedName] = useState('')
    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    // Fetch suggestions when scenarioName changes
    const fetchSuggestions = useCallback(async (name: string) => {
        if (!name.trim() || name.trim().length < 2) {
            setSuggestions([])
            return
        }

        setLoading(true)
        try {
            const supabase = createClient()

            // Find all public reports with this scenario name
            const { data: reports } = await supabase
                .from('play_reports')
                .select('scenario_author')
                .eq('is_mini', false)
                .ilike('scenario_name', name.trim())
                .not('scenario_author', 'is', null)

            if (!reports || reports.length === 0) {
                setSuggestions([])
                return
            }

            // Count author occurrences
            const authorCounts = new Map<string, number>()
            for (const r of reports) {
                if (r.scenario_author) {
                    const author = r.scenario_author.trim()
                    authorCounts.set(author, (authorCounts.get(author) || 0) + 1)
                }
            }

            // Sort by count, take top 3
            const topAuthors = Array.from(authorCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([name, count]) => ({ name, count }))

            if (topAuthors.length === 0) {
                setSuggestions([])
                return
            }

            // Check if any authors match a registered user profile
            const authorNames = topAuthors.map(a => a.name)

            // Query profiles where display_name or username matches
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username, display_name, avatar_url')
                .or(
                    authorNames.map(n => `display_name.ilike.${n},username.ilike.${n}`).join(',')
                )

            // Map profiles to authors
            const suggestionsWithProfiles: AuthorSuggestion[] = topAuthors.map(author => {
                const matchedProfile = profiles?.find(p =>
                    p.display_name?.toLowerCase() === author.name.toLowerCase() ||
                    p.username?.toLowerCase() === author.name.toLowerCase()
                )
                return {
                    ...author,
                    profile: matchedProfile || null,
                }
            })

            // Sort: profile matches first, then by count
            suggestionsWithProfiles.sort((a, b) => {
                if (a.profile && !b.profile) return -1
                if (!a.profile && b.profile) return 1
                return b.count - a.count
            })

            setSuggestions(suggestionsWithProfiles)
        } catch (error) {
            console.error('Author suggest error:', error)
            setSuggestions([])
        } finally {
            setLoading(false)
        }
    }, [])

    // Debounced effect on scenarioName change
    useEffect(() => {
        // Reset dismissed state when scenario name changes
        if (scenarioName !== lastQueriedName) {
            setDismissed(false)
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }

        if (!scenarioName.trim() || scenarioName.trim().length < 2) {
            setSuggestions([])
            return
        }

        debounceRef.current = setTimeout(() => {
            setLastQueriedName(scenarioName)
            fetchSuggestions(scenarioName)
        }, 500)

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
        }
    }, [scenarioName, fetchSuggestions, lastQueriedName])

    // When user types in the author field manually, dismiss suggestions
    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        onChange(e.target.value)
        if (e.target.value.trim().length > 0) {
            setDismissed(true)
        }
    }

    // Apply a suggestion
    function applySuggestion(authorName: string) {
        onChange(authorName)
        setDismissed(true)
    }

    const showSuggestions = !dismissed && suggestions.length > 0 && !value.trim()

    return (
        <div className="space-y-1.5">
            <Input
                value={value}
                onChange={handleInputChange}
                placeholder={placeholder}
                disabled={disabled}
                className={className}
            />

            {/* Loading indicator */}
            {loading && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-xs">作者を検索中...</span>
                </div>
            )}

            {/* Suggestions */}
            {showSuggestions && (
                <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-medium">もしかして:</span>
                    </div>

                    {suggestions.map((suggestion, index) => (
                        <button
                            key={`${suggestion.name}-${index}`}
                            type="button"
                            onClick={() => applySuggestion(suggestion.name)}
                            className={cn(
                                'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left',
                                'hover:bg-accent/50 transition-colors',
                                'text-sm'
                            )}
                        >
                            {suggestion.profile ? (
                                // Profile-linked suggestion
                                <>
                                    <Avatar className="w-5 h-5 shrink-0">
                                        <AvatarImage src={suggestion.profile.avatar_url || undefined} />
                                        <AvatarFallback className="text-[8px]">
                                            {(suggestion.profile.display_name || suggestion.profile.username).charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <span className="font-medium text-foreground">
                                            {suggestion.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground ml-1.5">
                                            @{suggestion.profile.username}
                                        </span>
                                    </div>
                                    <Link
                                        href={`/user/${suggestion.profile.username}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-[10px] text-primary hover:underline shrink-0"
                                    >
                                        プロフィール
                                    </Link>
                                </>
                            ) : (
                                // Plain text suggestion
                                <>
                                    <User className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                                    <span className="flex-1 text-foreground/80 truncate">
                                        {suggestion.name}
                                    </span>
                                </>
                            )}
                            <span className="text-[10px] text-muted-foreground shrink-0">
                                {suggestion.count}件
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
