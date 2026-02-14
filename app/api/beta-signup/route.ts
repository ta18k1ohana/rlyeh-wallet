import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { error: 'メールアドレスを入力してください' },
                { status: 400 }
            )
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: '有効なメールアドレスを入力してください' },
                { status: 400 }
            )
        }

        // Use service role client for inserting into beta_signups
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { error } = await supabase
            .from('beta_signups')
            .insert({ email: email.toLowerCase().trim() })

        if (error) {
            if (error.code === '23505') {
                // Unique violation — already registered
                return NextResponse.json(
                    { message: 'すでに登録済みです！ベータ版の公開をお待ちください 🐙' },
                    { status: 200 }
                )
            }
            console.error('Beta signup error:', error)
            return NextResponse.json(
                { error: '登録に失敗しました。もう一度お試しください' },
                { status: 500 }
            )
        }

        return NextResponse.json(
            { message: '登録完了！ベータ版の公開時にご連絡いたします 🐙' },
            { status: 200 }
        )
    } catch {
        return NextResponse.json(
            { error: 'サーバーエラーが発生しました' },
            { status: 500 }
        )
    }
}
