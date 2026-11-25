# Gradator 2 Web

Gradator 2のビジュアルエディタです。

技術スタックとしてVue 3.5（Composition API / `<script setup>`）、TypeScript 7.0.x、Vite+（Vite 8.x）、素のCSS + CSS Custom Propertiesを採用しています。

Gradientの解析・シリアライズをWebアプリ側で独自実装せず、`@gradator/core`と`@gradator/css`の公開APIを利用します。
