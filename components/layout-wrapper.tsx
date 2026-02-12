'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

interface LayoutWrapperProps {
    children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
    const pathname = usePathname()

    // Only dashboard uses narrow center column (with right sidebar)
    const isDashboard = pathname === '/dashboard'

    return (
        <>
            {/* Main Content - starts at same position for all pages */}
            <main className={`min-h-screen border-r border-border/50 ${isDashboard ? 'w-[600px]' : 'flex-1 max-w-[900px]'}`}>
                {children}
            </main>

            {/* Right Sidebar spacer - only on dashboard */}
            {isDashboard && (
                <aside className="hidden lg:block w-[350px] shrink-0">
                    {/* Content rendered by dashboard page itself */}
                </aside>
            )}
        </>
    )
}
