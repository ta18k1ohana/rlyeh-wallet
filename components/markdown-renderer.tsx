'use client'

import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Renders markdown content with GFM support.
 * Available for Pro and Streamer tier users in impression/memo fields.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        // Custom styling for TRPG context
        'prose-headings:text-foreground prose-headings:font-bold',
        'prose-p:text-foreground/90 prose-p:leading-relaxed',
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
        'prose-strong:text-foreground',
        'prose-blockquote:border-l-primary/50 prose-blockquote:text-muted-foreground',
        'prose-code:text-xs prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
        'prose-ul:list-disc prose-ol:list-decimal',
        'prose-hr:border-border',
        'prose-table:text-sm',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Prevent XSS by not rendering raw HTML
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          img: ({ node, ...props }) => (
            <span className="text-muted-foreground text-xs">[画像は表示されません]</span>
          ),
          // Open external links in new tab
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          a: ({ node, children, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

/**
 * Renders content as markdown if the user has Pro/Streamer tier,
 * otherwise renders as plain text.
 */
interface SmartContentRendererProps {
  content: string
  isMarkdownEnabled: boolean
  className?: string
}

export function SmartContentRenderer({
  content,
  isMarkdownEnabled,
  className,
}: SmartContentRendererProps) {
  if (isMarkdownEnabled) {
    return <MarkdownRenderer content={content} className={className} />
  }

  // Plain text rendering with line breaks preserved
  return (
    <div className={cn('whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed', className)}>
      {content}
    </div>
  )
}
