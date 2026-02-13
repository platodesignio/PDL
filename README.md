# PDL Studio (v0.1)

PDL Studio is a Next.js monolith for Plato Design Language workflows.

## Stack
- Next.js 16 App Router + Route Handlers
- PostgreSQL
- Prisma 7.4.0
- TypeScript strict

## Vercel settings (required)
- **Framework Preset**: Next.js
- **Root Directory**: repository root (`.`)
- **Build Command**: `next build`
- **Output Directory**: leave empty (do not set `public` or `build`)

## Environment variables
Copy `.env.example` to `.env` and set values.

```bash
cp .env.example .env
```

Required keys:
- `DATABASE_URL`
- `AUTH_SECRET`
- `RATE_LIMIT_PER_MINUTE`
- `BUDGET_MAX_PER_DAY`

## Local run
```bash
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run dev
```

Open `http://localhost:3000`.

## API response contract
Every API returns:

```json
{
  "executionId": "uuid",
  "ok": true,
  "failClass": "ok",
  "userSafeMessage": "...",
  "data": {}
}
```

Fail classes:
- `ok`
- `pdl_syntax_error`
- `pdl_vocab_error`
- `pdl_missing_required`
- `invalid_request`
- `rate_limited`
- `budget_exceeded`
- `db_error`
- `unknown`

## GitHub 初期化リポジトリが空に見える場合
GitHub で `Initialize this repository` を選んだ直後にファイルが空の場合は、
まだこのブランチの内容がデフォルトブランチへ反映されていない状態です。
以下を実行して反映してください。

```bash
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin work
# その後、GitHubで work -> main のPRを作成してマージ
```

`main` にマージされると、GitHub 上のリポジトリ一覧にも本プロジェクト一式が表示されます。
