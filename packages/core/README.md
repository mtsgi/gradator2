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

## 編集操作 API

UI非依存・フレームワーク非依存な純粋関数として、以下の7つの非破壊編集操作を提供します。

- **Stop 操作**:
  - `addStop(gradient, stop, options?)`: stop を末尾または指定 `index` へ追加します。空/空白のみの `id`・重複 `id`・範囲外/非整数 `index`・非互換位置単位はエラーを返します。
  - `removeStop(gradient, stopId)`: 指定 `stopId` の stop を削除します（必須 stop 数の検証は後続のバリデーションAPIの責務とするため、2件未満になっても成功します）。
  - `updateStop(gradient, stopId, patch)`: `{ color?, position? }` のパッチオブジェクトで stop を更新します。`id` / `kind` の変更は型レベル・ランタイムの両面で禁止し、許可されたプロパティのみを反映します。`ColorStop` は `{ position: undefined }` で位置指定を解除でき、`ColorHint` に対する `color` 指定や `position: undefined` はエラーとなります。
  - `moveStop(gradient, stopId, toIndex)`: `stops` 配列内の並び順を `toIndex` へ移動します（CSS `position` 値の変更は `updateStop` を使用します）。
  - `duplicateStop(gradient, stopId, options)`: 指定 stop を複製し、デフォルトで元 stop の直後（または指定 `index`）へ挿入します。新しい `id` の明示指定を必須とすることで決定論性を保ちます。
- **Gradient 操作**:
  - `setRepeating(gradient, repeating)`: `repeating` フラグを切り替えます。
  - `setGradientKind(gradient, kind, options?)`: Gradient 種別を変更（または同種別のジオメトリを更新）します。

### Result 型・非破壊性・構造共有・Undo / Redo 拡張性

- **統一 Result 型**: 全編集APIは `GradientOperationResult<TGradient>`（`{ ok: true, gradient } | { ok: false, error }`）を返し、型ガード `isGradientOperationSuccess` / `isGradientOperationFailure` とエラーコード定数 `GRADIENT_OPERATION_ERROR_CODES`（`STOP_NOT_FOUND` / `DUPLICATE_STOP_ID` / `INVALID_STOP_ID` / `INVALID_STOP_INDEX` / `INVALID_STOP_PATCH` / `INCOMPATIBLE_STOP_POSITION` / `INVALID_GEOMETRY`）を提供します。
- **非破壊性と構造共有**: 入力 Gradient や `stops` 配列を破壊せず、変更のない stop やジオメトリ、および `setRepeating` 時の `stops` 配列は参照を共有します。
- **no-op 時の参照同一性**: 構造化データの値比較において変更がない正当操作（同値 `setRepeating`、同位置 `moveStop`、同値または空パッチの `updateStop`、変更なしの同種別 `setGradientKind`）は `{ ok: true, gradient: input }` として入力と同一参照（`===`）を返します。なお、no-op 判定は構造化データの値比較のみで行い、`360deg` と `1turn` や `srgb` と `hsl` のような CSS の意味的等価性・単位正規化は対象外です。
- **Undo / Redo への発展性**: すべての操作が完全純粋かつ決定論的（明示 ID）であり、`result.ok && result.gradient !== current` で変更有無を判定できるため、将来のスナップショット方式／コマンド方式の Undo / Redo へそのまま統合できます。

### `setGradientKind()` のジオメトリと単位の扱い

- **ジオメトリ引き継ぎ**: 意味が一致する `radial` ↔ `conic` 間の `position` のみ引き継ぎます（`options` で明示上書き、または `{ position: undefined }` で解除可能）。`direction` / `shape` / `size` / `angle` など種別固有のジオメトリは別種別への変更時に引き継がず省略します。
- **Radial の部分更新**: 既存の `RadialGradient` に対して `setGradientKind(radial, 'radial', options)` を呼ぶ場合、プロパティの省略は既存値の維持、明示的な `undefined` は該当プロパティの解除を意味します。`shape` の変更や `size` の更新で既存または指定された `shape` と `size` が不整合になる場合（例: `radii` を持つ `ellipse` に対し `size` を省略したまま `shape: 'circle'` へ変更する場合）は暗黙削除を行わず `INVALID_GEOMETRY` エラーを返します。
- **非互換な stop 位置単位**: `linear` ↔ `radial` 間では全 stop をそのまま参照共有します。`linear`/`radial` ↔ `conic` 間で非互換な単位（`Length` ↔ `Angle`）を含む場合、デフォルト（`incompatibleStopPosition: 'error'`）では `INCOMPATIBLE_STOP_POSITION` エラーを返します。オプションで以下を選択できます:
  - `'drop'`: 非互換な `ColorStop` は `position` を解除し、非互換な `ColorHint` は除外します。
  - `'convert-angle'`（変換先が `'linear'` / `'radial'` の場合のみ）: `Angle`（`deg` / `grad` / `turn` / `rad`）を 1 周 = `100%` として相対的な `Percentage` へ換算します（クランプや正規化は行いません）。これは相対位置への換算であり、conic（角度基準）から linear / radial（距離基準）への変換において見た目の完全な維持を保証するものではありません。

### 編集操作の利用例

```ts
import {
  addStop,
  angle,
  createColorStop,
  createLinearGradient,
  duplicateStop,
  percentage,
  setGradientKind,
  setRepeating,
  srgb,
  updateStop,
} from '@gradator/core';

const initial = createLinearGradient({
  id: 'grad-1',
  stops: [
    createColorStop({ id: 'stop-1', color: srgb(255, 87, 34), position: percentage(0) }),
    createColorStop({ id: 'stop-2', color: srgb(33, 150, 243), position: percentage(100) }),
  ],
});

const added = addStop(
  initial,
  createColorStop({ id: 'stop-mid', color: srgb(255, 235, 59), position: percentage(50) }),
  { index: 1 },
);

if (added.ok) {
  const duplicated = duplicateStop(added.gradient, 'stop-mid', {
    id: 'stop-mid-2',
    position: percentage(65),
  });
  const updated = duplicated.ok
    ? updateStop(duplicated.gradient, 'stop-mid-2', { position: undefined })
    : duplicated;
  const repeating = updated.ok ? setRepeating(updated.gradient, true) : updated;
  const conic = repeating.ok
    ? setGradientKind(repeating.gradient, 'conic', { angle: angle(90, 'deg') })
    : repeating;
}
```

## 現時点で対応していないCSS構文

初期データモデルでは以下を対象外とし、将来の拡張Issueで検討します。

- double-position color stop（例: `red 20% 40%`）
- 色補間空間・hue補間方式（例: `in oklch longer hue`）
- `srgb` / `hsl` 以外の高度な CSS Color 表現（`oklch`, `oklab`, `lab`, `lch`, `display-p3`, `color-mix()`, `currentColor`, `var(--...)` 等）
- CSS 数学関数（`calc()`, `min()`, `max()`, `clamp()` 等）
- カンマ区切りによる複数グラデーションレイヤーの合成モデル
