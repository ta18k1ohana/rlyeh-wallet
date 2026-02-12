'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Plus, X, PenLine, Search, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface QuickActionFabProps {
    className?: string
}

export function QuickActionFab({ className }: QuickActionFabProps) {
    const [isOpen, setIsOpen] = useState(false)

    const actions = [
        {
            label: 'セッション記録',
            icon: <PenLine className="w-4 h-4" />,
            href: '/reports/new',
            color: 'bg-purple-500 hover:bg-purple-600',
        },
        {
            label: 'ユーザー検索',
            icon: <Search className="w-4 h-4" />,
            href: '/search',
            color: 'bg-blue-500 hover:bg-blue-600',
        },
        {
            label: '通知',
            icon: <Bell className="w-4 h-4" />,
            href: '/notifications',
            color: 'bg-amber-500 hover:bg-amber-600',
        },
    ]

    return (
        <div className={cn('fixed bottom-6 right-6 z-50', className)}>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-background/60 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Action buttons */}
            <div className={cn(
                'absolute bottom-16 right-0 flex flex-col-reverse gap-3 items-end',
                'transition-all duration-200',
                isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
            )}>
                {actions.map((action, index) => (
                    <Link
                        key={action.href}
                        href={action.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                            'flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-full text-white shadow-lg',
                            'transition-all duration-200',
                            action.color,
                            isOpen ? 'animate-in fade-in slide-in-from-bottom-2' : ''
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
                        {action.icon}
                    </Link>
                ))}
            </div>

            {/* Main FAB */}
            <Button
                size="lg"
                className={cn(
                    'w-14 h-14 rounded-full shadow-lg',
                    'bg-primary hover:bg-primary/90',
                    'transition-all duration-200',
                    isOpen && 'rotate-45 bg-muted-foreground hover:bg-muted-foreground/90'
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <Plus className="w-6 h-6" />
                )}
            </Button>
        </div>
    )
}
