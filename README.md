# avatar-sample

3D アバターをブラウザでリアルタイムに表示するポートフォリオデモ。
Next.js 16（フロントエンド）と Go（バックエンド API）で構成されたモノレポ。

**デモ:** https://avatar-sample-snowy.vercel.app/

---

## アーキテクチャ概要

```
avatar-sample/
├── frontend/   # Next.js 16 + React Three Fiber
└── backend/    # Go 標準ライブラリ製 REST API
```

### データフロー

```
Browser
  │
  ├─ SSR (RSC)  ──→ Go API (localhost:8080) ──→ AvatarConfig JSON
  │                                                      │
  └─ Client ←── initialConfig prop ←────────────────────┘
       │
       └─ useAvatarSettings (30秒ポーリング)
```

1. Next.js の **Server Component** がサーバー側で Go API をフェッチし `initialConfig` として渡す（ローディング状態なしで即表示）
2. クライアントフック `useAvatarSettings` が 30 秒ごとにポーリングして設定を最新化
3. `AvatarScene` が `@react-three/fiber` の Canvas に 3D モデルを描画

---

## 技術スタック

| 領域 | 技術 |
|---|---|
| フレームワーク | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS v4 |
| 3D レンダリング | Three.js + @react-three/fiber v9 + @react-three/drei v10 |
| バックエンド | Go (net/http 標準ライブラリ) |
| Lint / Format | Biome v2 |
| テスト | Vitest v4 + @testing-library/react |
| コンポーネントカタログ | Storybook v9 (@storybook/react-vite) |
| デプロイ | Vercel (frontend) |

---

## ディレクトリ構成

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx              # RSC: サーバーサイドフェッチ + レイアウト
│   │   └── layout.tsx
│   ├── components/
│   │   ├── AvatarScene.tsx       # Canvas + 3D モデル + アニメーション
│   │   ├── AvatarSceneWrapper.tsx# dynamic import (SSR 回避)
│   │   ├── TalkButton.tsx        # 話すボタン UI
│   │   └── ConfigItem.tsx        # 設定表示アイテム
│   ├── hooks/
│   │   └── useAvatarSettings.ts  # API フェッチ + ポーリングフック
│   └── types/
│       └── avatar.ts             # AvatarConfig 型定義
├── .storybook/                   # Storybook 設定
└── vitest.config.ts              # Vitest 設定

backend/
└── main.go                       # /api/avatar-config エンドポイント (port 8080)
```

---

## 主要な実装ポイント

### 3D レンダリング最適化
- `frameloop="demand"` — 変化がないフレームは描画しない（アイドル時 CPU/GPU ゼロ）
- `shadows={false}` / `powerPreference="low-power"` — 低消費電力設定
- Suspense を分割して HDR 環境マップの読み込みを遅延させモデルを先行表示

### 話すアニメーション
- `isTalkingRef`（useRef）で useFrame から React 再レンダリングなしに状態取得
- モーフターゲットあり: `morphTargetInfluences` を直接操作
- モーフターゲットなし（デモモデル）: emissive intensity + Y スケールで口パクをシミュレート

### RSC + Client Component パターン
```
page.tsx (RSC)
  └─ fetchAvatarConfig() ─→ Go API
       └─ AvatarSceneWrapper (Client, dynamic/ssr:false)
            └─ AvatarScene (Client, Canvas/WebGL)
```

---

## セットアップ

### 前提条件
- Node.js 20+
- Go 1.21+

### バックエンド起動

```bash
go run ./backend
# → http://localhost:8080
```

### フロントエンド起動

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

---

## 開発コマンド

```bash
# テスト実行
cd frontend && npm test

# Storybook 起動
cd frontend && npm run storybook
# → http://localhost:6006

# Lint / Format
cd frontend && npm run check
```

---

## API

### `GET /api/avatar-config`

```json
{
  "id": "avatar-001",
  "name": "Default Avatar",
  "position": { "x": 0, "y": 0, "z": 0 },
  "color": "#4F46E5",
  "scale": 1.0,
  "visible": true,
  "rotationSpeed": 0.5
}
```

`rotationSpeed` の単位はラジアン/秒（0 で停止）。

---

## デプロイ

- **Frontend**: Vercel（Root Directory: `frontend`、Framework: Next.js）
- **Backend**: Go サーバーは別途ホスティングが必要（Railway / Render / Fly.io 等）
  - デプロイ後 `NEXT_PUBLIC_BACKEND_URL` 環境変数を Vercel に設定
