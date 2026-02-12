# R'lyeh Wallet - CLAUDE.md

## Project Overview

R'lyeh Wallet (ルルイエウォレット) is a Japanese-language TRPG session record management platform for Call of Cthulhu (CoC) players. Users can record, manage, share, and discover session reports with social features and subscription tiers.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Database:** Supabase (PostgreSQL + Auth + Realtime)
- **UI:** shadcn/ui + Radix UI + Tailwind CSS v4
- **Payments:** Stripe (subscriptions)
- **Storage:** Vercel Blob (images)
- **Source:** Built with v0.app

## Project Structure

```
app/
├── (dashboard)/          # Protected routes (auth required)
│   ├── dashboard/        # Main hub with recommendations
│   ├── wallet/           # User's session records
│   ├── social/           # Friends & following
│   ├── search/           # Search reports/users/tags
│   ├── reports/          # Create/view/edit reports
│   │   ├── new/
│   │   ├── [id]/
│   │   └── [id]/edit/
│   ├── user/[username]/  # User profiles
│   ├── settings/         # Account settings
│   └── pricing/          # Subscription tiers
├── auth/                 # Login/signup/password reset
├── api/
│   ├── webhooks/stripe/  # Stripe webhook handler
│   └── upload/           # Image upload endpoints
└── onboarding/           # First-time user setup

components/
├── ui/                   # shadcn/ui components
├── session-card.tsx      # Report card display
├── dashboard-nav.tsx     # Navigation bar
├── folder-card.tsx       # Folder display
└── [other components]

lib/
├── supabase/             # Supabase clients (server/client)
├── types.ts              # TypeScript type definitions
├── tier-limits.ts        # Subscription tier feature limits
├── stripe.ts             # Stripe client
└── utils.ts              # Utility functions

scripts/                  # SQL schema files
```

## Key Commands

```bash
# Development
npm run dev               # Start dev server (localhost:3000)
npm run build             # Production build
npm run start             # Start production server
npm run lint              # Run ESLint

# Note: No test suite currently configured
```

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Vercel Blob
BLOB_READ_WRITE_TOKEN=

# App URL
NEXT_PUBLIC_APP_URL=
```

## Database Tables

- **profiles** - User accounts with tier info
- **play_reports** - Session records
- **play_report_participants** - KP/PL tracking
- **play_report_links** - External links
- **play_report_images** - Additional images
- **likes** - Report likes
- **follows** - Social following (mutual = friends)
- **notifications** - User notifications
- **report_folders** - Custom folders
- **report_tags** - Report tags

Schema files: `scripts/001_create_schema.sql`, `scripts/002_create_folders.sql`, `scripts/003_create_report_tags.sql`

## Subscription Tiers


| Tier | Price | Key Features |
|------|-------|--------------|
| Free | ¥0 | 5 images, 1 tag, 50 friends, 500 chars memo |
| Pro | ¥500/mo | Unlimited images/links/text, Markdown memo, private notes, folders, export |
| Streamer | ¥1,200/mo | All Pro features + YouTube embed, custom theme, custom URL, viewer comments |

Limits defined in: `lib/tier-limits.ts`

## Authentication

- Google OAuth + Email/Password via Supabase Auth
- Middleware handles session refresh (`middleware.ts`)
- Dashboard routes protected via layout-level redirect

## Key Business Logic

### Recommendation Algorithm (`dashboard/page.tsx`)
- +3: Friends of friends reports
- +2: Same scenario author
- +0.5: Per like
- +1: Recent (7 days)
- -5: Already played scenario

### Privacy Settings
- Per-report: public / followers / private
- Profile-level privacy setting

### Social Graph
- Mutual follows = Friends
- One-way follows = Following (streamers)

## Code Conventions

- Japanese UI text throughout
- Path alias: `@/` → project root
- Form validation: react-hook-form + zod
- Toasts: sonner
- Icons: lucide-react

## Important Notes

- `next.config.mjs` ignores TypeScript errors (v0 compatibility)
- Image optimization disabled
- All tables have Row-Level Security (RLS) enabled
- Stripe webhooks require service role key for DB updates

## Common Tasks

### Adding a new page
1. Create folder in `app/(dashboard)/[page-name]/`
2. Add `page.tsx` with server component
3. Update navigation in `components/dashboard-nav.tsx`

### Adding a UI component
```bash
npx shadcn@latest add [component-name]
```

### Database changes
1. Write SQL in new `scripts/00X_*.sql` file
2. Run in Supabase SQL editor
3. Update `lib/types.ts` with new types

### Adding Stripe products
Update `lib/subscription-products.ts` with new price IDs

## Subscription_Task

サブスクリプションシステムの仕様とコードのギャップを修正するタスクリスト。

### Phase 1: 基盤修正
| ID | タスク | ステータス |
|----|--------|-----------|
| S-1 | DB migration `007_add_subscription_columns.sql` — profiles テーブルに `tier`, `tier_started_at`, `tier_expires_at`, `stripe_customer_id`, `stripe_subscription_id`, `is_streamer`, `former_tier` カラムを追加 | ✅ |
| S-2 | Webhook修正 — checkout.session.completed で `tier_expires_at` を設定、handleSubscriptionUpdate の金額ハードコード削除、metadata の `tier` を正規ソースとして使用 | ✅ |
| S-3 | `is_pro`/`is_streamer` → `tier` enum 一本化 — コード全体で `profile.tier` を正規参照に統一 | ✅ |

### Phase 2: 制限値を仕様に合わせる
| ID | タスク | ステータス |
|----|--------|-----------|
| S-4 | `tier-limits.ts` を仕様値に更新 — Pro: 画像無制限/リンク無制限/テキスト無制限、Streamer価格 ¥1,200 | ✅ |
| S-5 | フォロー制限 — Pro/Streamer = 無制限に変更 | ✅ |

### Phase 3: ダウングレード挙動
| ID | タスク | ステータス |
|----|--------|-----------|
| S-6 | ダウングレード時データ保持ロジック — 既存データは残す、新規追加のみ制限 | ✅ |
| S-7 | 旧ティアグレーバッジ — `former_tier` カラムとグレー表示バッジ | ✅ |
| S-8 | ダウングレードガイダンスUI — 制限超過時の案内表示 | ✅ |

### Phase 4: 未実装の配信者機能
| ID | タスク | ステータス |
|----|--------|-----------|
| S-9 | YouTube動画埋め込み | ✅ |
| S-10 | カスタムカラーテーマ | ✅ |
| S-11 | メンション承認UI | ✅ |

### Phase 5: 未実装のPro機能
| ID | タスク | ステータス |
|----|--------|-----------|
| S-12 | Markdown対応詳細メモ | ✅ |
| S-13 | プライベートノート | ✅ |

### Phase 6: セキュリティ強化
| ID | タスク | ステータス |
|----|--------|-----------|
| S-14 | サーバーサイド制限 (RLS/DBトリガー) | ✅ |

### Deferred (将来対応)
- NFT連携
- ロゴアップロード
- AI アシスト
- リマインダー
- プラン比較機能
