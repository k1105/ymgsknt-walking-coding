# Shader Fundamentals — 全部の土台

[2026-04-02](/diary/2026-04-02)でフラクタル万華鏡を写経、[2026-04-13](/diary/2026-04-13)でbloom、[2026-04-21](/diary/2026-04-21)でサーモフィルター。シェーダーを何度か触ったけど、基礎を体系的にやったことがない。

> vert / fragの記述は面倒でも何回か書かないと、なんの記述なのかよくわからんかもしれない。(04-21)

その通り。ここではフラグメントシェーダーの**5つの基本要素**を、1つずつ写経で身につける。

## 5ステップ

1. **UV座標** — 画面上の位置。全ての出発点
2. **distance()** — 距離関数。形を描く基礎
3. **sin/cos** — 周期関数。パターンを作る
4. **uniform + time** — p5.jsからシェーダーに値を渡す。動きを作る
5. **smoothstep + mix** — 滑らかな境界と色のブレンド

この5つがわかると、bloom, SDF, colormap, ポストプロセスの全てが「組み合わせ」として理解できる。

## ステップバイステップで始める

`/trace?steps=/research/steps/shader-fundamentals.json` で写経モードに入れる。
各ステップで `.frag` ファイルが変わっていく。`.vert` と `sketch.js` はほぼ同じ。

## さらに見るなら

- [The Book of Shaders](https://thebookofshaders.com/) — 最良の入門書。インタラクティブ
- [Shadertoy](https://www.shadertoy.com/) — 実例の宝庫
- [Inigo Quilez Articles](https://iquilezles.org/articles/) — シェーダー技法のリファレンス
