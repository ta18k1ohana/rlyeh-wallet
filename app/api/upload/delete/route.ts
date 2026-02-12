import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'images'

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 })
    }

    // Extract file path from Supabase Storage public URL
    // URL format: https://<project>.supabase.co/storage/v1/object/public/images/<user_id>/<file>
    const storagePrefix = `/storage/v1/object/public/${BUCKET}/`
    const urlObj = new URL(url)
    const pathIndex = urlObj.pathname.indexOf(storagePrefix)

    if (pathIndex === -1) {
      // Not a Supabase Storage URL — might be old Vercel Blob URL, skip gracefully
      return NextResponse.json({ success: true })
    }

    const filePath = urlObj.pathname.substring(pathIndex + storagePrefix.length)

    // Ensure user can only delete their own files
    if (!filePath.startsWith(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete from Supabase Storage
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([filePath])

    if (error) {
      console.error('Supabase storage delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
