# アーキテクチャ

Gradator 2は、再利用可能かつフレームワーク非依存なTypeScriptパッケージを中心に構成するCSSグラデーションのビジュアルエディタです。

## リポジトリ構成

```text
gradator2/
├─ apps/
│  └─ web/
├─ packages/
│  ├─ core/
│  └─ css/
└─ docs/
```

## 各パッケージの責務

### `packages/core`

Gradientの意味的なデータモデルと編集操作を担当します。

Vue、ブラウザDOM API、CSS文字列の解析には依存しません。

主な責務:

- Gradientのデータモデル
- linear / radial / conic の各Gradient型
- repeating gradient
- color stop / color hint
- position / angle
- immutableな編集操作
- 正規化とバリデーション
- undo / redoに利用できる基礎機能

### `packages/css`

CSS文字列と`core`の内部モデルの相互変換を担当します。

想定する公開API:

```ts
parseGradient(source);
serializeGradient(gradient);
parseBackground(source);
serializeDeclaration(gradient);
```

初期実装では、元のCSS表記を完全に保持するlossless parserではなく、ビジュアルエディタで扱いやすい意味的なモデルへの変換を優先します。

### `apps/web`

Gradator 2のビジュアルエディタです。

GradientのルールをVueコンポーネント側へ重複実装せず、`core`と`css`の公開APIを利用します。

## データフロー

```text
UI
 ↓
Gradient Model
 ↓
normalize / validate
 ↓
CSS Serializer
```

CSSを読み込む場合:

```text
CSS Source
 ↓
CSS Parser
 ↓
Gradient Model
 ↓
Visual Editor
```

## 初期Gradientモデル

```ts
type Gradient = LinearGradient | RadialGradient | ConicGradient;

interface GradientBase {
  id: string;
  repeating: boolean;
  stops: GradientStop[];
}
```

repeating gradientは6種類の独立した型として扱わず、linear / radial / conicの3種類に対するプロパティとして表現します。

## 設計原則

1. コアロジックはフレームワーク非依存にする。
2. 生成済みCSS文字列ではなく、意味的なGradientモデルをアプリケーション状態として保持する。
3. CSSはモデルから生成する。
4. 編集操作は可能な限りimmutableにする。
5. CSSのimport / exportに必要な単位情報を保持する。
6. CSS Colorの高度な機能はMVPへ固定的に組み込まず、後から拡張可能な設計にする。

## 技術スタックと依存関係

### 採用技術

- **Runtime / パッケージ管理**: Node.js 26 LTS、npm 12（npm Workspaces: `apps/*`, `packages/*`）
  - workspace間の内部依存には `workspace:*` を使用せず、通常のsemver（`^0.1.0` など）を使用する
- **Toolchain**: Vite+ 1.x（Vite 8.x、Vitest 5.x、Oxlint、Oxfmt、tsdown、Vite Task）
- **TypeScript**: TypeScript 7.0.x
- **Web (`apps/web`)**:
  - Vue 3.5 stable（Composition API / `<script setup>`）、`@vitejs/plugin-vue`
  - 素のCSS + CSS Custom Properties（Tailwind CSS / UnoCSSは使用しない）
  - `ref` / `computed` とcomposableを中心とした状態管理（Pinia / Nuxtは使用しない）
  - 永続化は `localStorage` を利用し、backendを持たないstatic web applicationとして動作させる
- **Libraries (`@gradator/core`, `@gradator/css`)**:
  - Pure TypeScript、ESM出力 + TypeScript declaration出力（`vp pack` / tsdown）
  - VueおよびブラウザDOM APIに依存しない
  - `@gradator/core` はruntime dependency 0を維持する
  - `@gradator/css` のruntime dependencyは `@gradator/core` のみとする
- **テスト / 品質管理**:
  - Unit Test: Vitest 5.x
  - E2E Test: Playwright
  - Lint / Type Check: Oxlint
  - Format: Oxfmt

### パッケージ間の依存方向

```text
@gradator/core
      ↑
@gradator/css

@gradator/core ─┐
                ├─ apps/web
@gradator/css ──┘
```

`@gradator/core` が `@gradator/css` や Vue に依存する逆方向の依存は作成しません。
