# Gradator 2

CSSグラデーションを視覚的に作成・編集できるエディタ兼TypeScriptツールキットです。

Gradator 2は、初代 [Gradator](https://github.com/mtsgi/gradator) の後継プロジェクトです。CSSグラデーションの作成・編集・解析・シリアライズを、再利用可能なライブラリを中心とした構成で実装します。

## 目標

- linear / radial / conic gradient に対応する
- repeating gradient に対応する
- 直感的に操作できるビジュアルエディタを提供する
- Gradientのデータモデルと編集ロジックをフレームワーク非依存にする
- CSSグラデーションを編集可能な内部モデルへ変換する
- 内部モデルからCSSを生成する
- Webアプリ以外からも再利用できるコアライブラリを提供する

## 構成

```text
gradator2/
├─ apps/
│  └─ web/
└─ packages/
   ├─ core/
   └─ css/
```

- `@gradator/core`: Gradientのデータモデルと編集操作
- `@gradator/css`: CSS Gradientのパーサー / シリアライザー
- `apps/web`: Gradator 2のビジュアルエディタ

## 技術スタック

- **Runtime / Package Manager**: Node.js 26 LTS / npm 12（npm Workspaces）
- **Toolchain**: Vite+ 1.x（Vite 8.x / Rolldown / tsdown / Vite Task）
- **Language**: TypeScript 7.0.x
- **Web (`apps/web`)**: Vue 3.5（Composition API / `<script setup>`）、`@vitejs/plugin-vue`、素のCSS + CSS Custom Properties
- **Libraries (`@gradator/core`, `@gradator/css`)**: Pure TypeScript、ESM、`vp pack`（tsdown）によるバンドルと型定義（`.d.mts`）出力
- **Test / Quality**: Vitest 5.x、Playwright、Oxlint、Oxfmt

## 開発コマンド

リポジトリルートから以下のコマンドを実行できます。

```bash
# 依存パッケージのインストール
npm ci

# Webアプリ開発サーバーの起動
npm run dev

# 全パッケージとWebアプリのビルド
npm run build

# フォーマット・Lint・型チェックの一括実行
npm run check

# Lintの実行
npm run lint

# フォーマットチェック / フォーマット適用
npm run fmt:check
npm run fmt

# Unit Testの実行（Vitest）
npm test

# E2E Testの実行（Playwright）
npm run test:e2e
```

## 開発状況

開発初期段階です。
