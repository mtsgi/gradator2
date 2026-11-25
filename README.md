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

## 開発状況

開発初期段階です。
