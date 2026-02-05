'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { AtSign, User, Check, Loader2 } from 'lucide-react'
import type { Profile } from '@/lib/types'

interface UserSuggestion {
  profile: Profile
  isFriend: boolean
  matchType: 'username' | 'display_name'
}

interface UserAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onUserSelect?: (profile: Profile) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  showSelectedBadge?: boolean
  prioritizeFriends?: boolean
}

export function UserAutocomplete({
  value,
  onChange,
  onUserSelect,
  placeholder = "@username またはPL名",
  disabled = false,
  className,
  showSelectedBadge = true,
  prioritizeFriends = true
}: UserAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [friendIds, setFriendIds] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Load friends list on mount
  useEffect(() => {
    async function loadFriends() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return
      
      setCurrentUserId(user.id)

      // Get mutual follows (friends)
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      const followingIds = followingData?.map(f => f.following_id) || []

      const { data: followerData } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', user.id)

      const followerIds = followerData?.map(f => f.follower_id) || []

      // Friends = mutual follows
      const mutualFriendIds = followingIds.filter(id => followerIds.includes(id))
      setFriendIds(mutualFriendIds)
    }

    loadFriends()
  }, [])

  // Search users based on input
  const searchUsers = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    const supabase = createClient()
    
    const isUsernameSearch = query.startsWith('@')
    const searchTerm = isUsernameSearch ? query.slice(1) : query

    if (searchTerm.length < 1) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    let results: UserSuggestion[] = []

    if (isUsernameSearch) {
      // Search by username (ID) - include self
      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `${searchTerm}%`)
        .limit(10)

      if (users) {
        results = users.map(profile => ({
          profile,
          isFriend: friendIds.includes(profile.id),
          matchType: 'username' as const
        }))
      }
    } else {
      // Search by display_name - include self
      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .or(`display_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
        .limit(10)

      if (users) {
        results = users.map(profile => ({
          profile,
          isFriend: friendIds.includes(profile.id),
          matchType: profile.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) 
            ? 'display_name' as const 
            : 'username' as const
        }))
      }
    }

    // Sort: friends first if prioritizeFriends is true
    if (prioritizeFriends) {
      results.sort((a, b) => {
        if (a.isFriend && !b.isFriend) return -1
        if (!a.isFriend && b.isFriend) return 1
        return 0
      })
    }

    setSuggestions(results)
    setSelectedIndex(0)
    setIsLoading(false)
  }, [friendIds, currentUserId, prioritizeFriends])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      searchUsers(value)
    }, 200)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [value, searchUsers])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % suggestions.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
        break
      case 'Enter':
        e.preventDefault()
        if (suggestions[selectedIndex]) {
          selectUser(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  // Select a user from suggestions
  const selectUser = (suggestion: UserSuggestion) => {
    const { profile } = suggestion
    setSelectedUser(profile)
    
    // Set the value to @username for linked users
    onChange(`@${profile.username}`)
    
    if (onUserSelect) {
      onUserSelect(profile)
    }
    
    setIsOpen(false)
    setSuggestions([])
  }

  // Clear selection when input is manually changed
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    // If user clears or modifies the @username, clear the selection
    if (selectedUser && newValue !== `@${selectedUser.username}`) {
      setSelectedUser(null)
    }
    
    setIsOpen(true)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={() => value.length >= 1 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            selectedUser && showSelectedBadge && "pr-10"
          )}
        />
        {selectedUser && showSelectedBadge && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Check className="w-4 h-4 text-green-500" />
          </div>
        )}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.profile.id}
              type="button"
              onClick={() => selectUser(suggestion)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                index === selectedIndex ? "bg-accent" : "hover:bg-accent/50",
                suggestion.isFriend && "bg-primary/5"
              )}
            >
              <Avatar className="w-8 h-8 rounded-xl">
                <AvatarImage src={suggestion.profile.avatar_url || undefined} className="rounded-xl" />
                <AvatarFallback className="text-xs rounded-xl">
                  {(suggestion.profile.display_name || suggestion.profile.username)?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {suggestion.profile.display_name || suggestion.profile.username}
                  </span>
                  {suggestion.isFriend && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded">
                      フレンド
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <AtSign className="w-3 h-3" />
                  <span className="truncate">{suggestion.profile.username}</span>
                </div>
              </div>

              {suggestion.matchType === 'username' ? (
                <AtSign className="w-4 h-4 text-muted-foreground shrink-0" />
              ) : (
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && value.length >= 2 && suggestions.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg p-3 text-center text-sm text-muted-foreground">
          ユーザーが見つかりません
        </div>
      )}
    </div>
  )
}

// Simplified search input for Social page
interface UserSearchInputProps {
  onUserSelect: (profile: Profile) => void
  placeholder?: string
  className?: string
}

export function UserSearchInput({
  onUserSelect,
  placeholder = "ユーザーを検索 (@ID または名前)",
  className
}: UserSearchInputProps) {
  const [searchValue, setSearchValue] = useState('')

  const handleSelect = (profile: Profile) => {
    onUserSelect(profile)
    setSearchValue('')
  }

  return (
    <UserAutocomplete
      value={searchValue}
      onChange={setSearchValue}
      onUserSelect={handleSelect}
      placeholder={placeholder}
      className={className}
      showSelectedBadge={false}
      prioritizeFriends={true}
    />
  )
}
