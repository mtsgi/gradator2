# Gradator Core

CSS Gradientを扱うための、フレームワーク非依存なTypeScriptデータモデルと編集操作を提供します。

## 特徴

- Pure TypeScript / ESM
- フレームワーク非依存・DOM API非依存・runtime dependency 0
- `readonly` と浅コピーを中心とした不変データ構造（deep freeze / deep clone は行いません）
- `vp pack`（tsdown）によるESMおよび型定義ファイル（`.d.mts`）出力

## 初期データモデル

- **`Gradient`**: `kind: 'linear' | 'radial' | 'conic'` の discriminated union（`LinearGradient | RadialGradient | ConicGradient`）。`repeating` は別型にせず各Gradientの `repeating: boolean` で表現します。
- **`LinearGradient`**: `direction?: LinearDirection`（角度 `angle` または辺・角 `side-or-corner`）、`stops: readonly LinearGradientStop[]`
- **`RadialGradient`**: `shape: 'circle'` / `shape: 'ellipse'` / `shape?: undefined` の3分岐 union により、形状とサイズ（extent キーワード、circle の単一 `Length` 半径、ellipse の2軸 `LengthPercentage` 半径）の整合性を型レベルで保証します。`position?: GradientPosition`
- **`ConicGradient`**: `angle?: Angle`、`position?: GradientPosition`、`stops: readonly ConicGradientStop[]`
- **`GradientStop<TPosition>`**: `ColorStop<TPosition> | ColorHint<TPosition>`（`kind: 'color' | 'hint'`、いずれも `id: string` を保持）。linear / radial は `LengthPercentage`、conic は `AnglePercentage` に型レベルで制限されます。
- **`Color`**: `space` による discriminated union。初期モデルでは `srgb`（`r`/`g`/`b`: 0〜255、`alpha`: 0〜1）と `hsl`（`h`: 0〜360、`s`/`l`: 0〜100、`alpha`: 0〜1）を提供し、将来 `oklch` 等を追加できる構造としています。
- **単位・位置**: `Angle`（`deg` / `rad` / `grad` / `turn`）、`Length`（`px` / `em` / `rem` / `vw` / `vh` / `vmin` / `vmax` / `cm` / `mm` / `in` / `pt` / `pc`）、`Percentage`（`%`）、2D 中心座標 `GradientPosition`（値・キーワード・エッジ基準オフセット）
- **型ガード・生成ヘルパー**: 種別・単位・色空間・位置・stopを安全に絞り込む型ガード群と、純粋な値生成ヘルパー群を提供します。型ガードは判別子・単位タグの判定のみを担当し、数値範囲の検証・正規化・clampは後続の正規化/バリデーションAPIに委ねます。

### 利用例

```ts
import {
  angle,
  createColorHint,
  createColorStop,
  createLinearGradient,
  hsl,
  linearAngleDirection,
  percentage,
  srgb,
} from '@gradator/core';

const gradient = createLinearGradient({
  id: 'grad-1',
  direction: linearAngleDirection(angle(135, 'deg')),
  stops: [
    createColorStop({ id: 'stop-1', color: srgb(255, 87, 34), position: percentage(0) }),
    createColorHint({ id: 'hint-1', position: percentage(45) }),
    createColorStop({ id: 'stop-2', color: hsl(260, 80, 55), position: percentage(100) }),
  ],
});
```

## 現時点で対応していないCSS構文

初期データモデルでは以下を対象外とし、将来の拡張Issueで検討します。

- double-position color stop（例: `red 20% 40%`）
- 色補間空間・hue補間方式（例: `in oklch longer hue`）
- `srgb` / `hsl` 以外の高度な CSS Color 表現（`oklch`, `oklab`, `lab`, `lch`, `display-p3`, `color-mix()`, `currentColor`, `var(--...)` 等）
- CSS 数学関数（`calc()`, `min()`, `max()`, `clamp()` 等）
- カンマ区切りによる複数グラデーションレイヤーの合成モデル
