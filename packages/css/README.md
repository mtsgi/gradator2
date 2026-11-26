# Gradator CSS

Gradatorの意味的なGradientモデルとCSS文字列を相互変換するパーサー / シリアライザーです。

想定するAPI:

- `parseGradient()`
- `serializeGradient()`
- `parseBackground()`
- `serializeDeclaration()`

## 特徴

- Pure TypeScript / ESM
- runtime依存は `@gradator/core` のみ（Vue / DOM API非依存）
- `vp pack`（tsdown）によるESMおよび型定義ファイル（`.d.mts`）出力
