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
type GradientKind = 'linear' | 'radial' | 'conic';

type Gradient = LinearGradient | RadialGradient | ConicGradient;

interface GradientBase<TStop extends GradientStop = GradientStop> {
  readonly id: string;
  readonly repeating: boolean;
  readonly stops: readonly TStop[];
}

interface LinearGradient extends GradientBase<LinearGradientStop> {
  readonly kind: 'linear';
  readonly direction?: LinearDirection;
}

type RadialGradient = CircleRadialGradient | EllipseRadialGradient | UnspecifiedShapeRadialGradient;

interface ConicGradient extends GradientBase<ConicGradientStop> {
  readonly kind: 'conic';
  readonly angle?: Angle;
  readonly position?: GradientPosition;
}
```

- repeating gradientは6種類の独立した型として扱わず、linear / radial / conicの3種類に対する `repeating: boolean` として表現します。
- `GradientStop<TPosition>` は `ColorStop<TPosition> | ColorHint<TPosition>` の discriminated union とし、linear / radial では `LengthPercentage`、conic では `AnglePercentage` に型レベルで制限します。
- `Color` は `space` による discriminated union とし、初期段階では `srgb` と `hsl` を定義します。
- CSS構文の省略を表現できるよう、`direction` / `shape` / `size` / `position` / `angle` などのジオメトリ系プロパティはオプショナルとしています。
- 現時点の初期データモデルでは、double-position color stop（`red 20% 40%`）、色補間空間（`in oklch` 等）、`srgb` / `hsl` 以外の高度な CSS Color 表現（`oklch`, `color-mix()`, `var(--...)` 等）、CSS 数学関数（`calc()` 等）、複数グラデーションレイヤー合成は対象外としています。

## Gradient 編集操作 API

`@gradator/core` の編集操作は、以下の7つの純粋関数として提供します。

- Stop 操作: `addStop()`, `removeStop()`, `updateStop()`, `moveStop()`, `duplicateStop()`
- Gradient 操作: `setRepeating()`, `setGradientKind()`

設計方針:

- **統一 Result 型**: 例外を投げず、`GradientOperationResult<TGradient>`（`{ ok: true, gradient } | { ok: false, error }`）で構造化されたエラーコード（`STOP_NOT_FOUND` / `DUPLICATE_STOP_ID` / `INVALID_STOP_ID` / `INVALID_STOP_INDEX` / `INVALID_STOP_PATCH` / `INCOMPATIBLE_STOP_POSITION` / `INVALID_GEOMETRY`）を返します。
- **非破壊性と構造共有**: 入力モデルや `stops` 配列を破壊せず、変更対象外の stop やジオメトリのオブジェクト参照を共有します。正当な操作で構造化データの値に変化がない場合は入力と同一参照（`===`）を返します（CSS の意味的等価性や単位正規化は no-op 判定の対象外です）。
- **決定論的 ID 管理と Undo / Redo 拡張性**: stop の複製でも新しい `id` の明示指定を必須とすることで決定論性を維持し、`result.ok && result.gradient !== current` による変更検出と合わせて将来のスナップショット方式・コマンド方式の Undo / Redo へ拡張しやすくしています。
- **種別変更時の単位とジオメトリ**: `radial` ↔ `conic` 間のみ `position` を引き継ぎます。非互換な stop 位置単位（`Length` ↔ `Angle`）はデフォルトでエラーとし、オプションで `'drop'` または `'convert-angle'`（`linear` / `radial` 向けのみ、1 周 = `100%` の相対位置への換算であり見た目の完全な維持は保証しません）を明示選択できます。
- **正規化・バリデーションとの責務分離**: 編集操作 API では操作上の構造的不変条件（ID 重複・インデックス範囲・パッチの妥当性・種別と位置単位/形状とサイズの整合性）のみを検証し、必須 stop 数・数値範囲・stop 順序や角度の正規化は後続の正規化・バリデーション API に委ねます。

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
