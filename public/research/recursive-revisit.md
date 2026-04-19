# Recursive Revisit — 「再演」としてのwalking coding

[2026-04-18のスケッチ](/diary/2026-04-18)の日記で、松本零士展の話を書いてた：

> 「同じキャラクターを違う舞台でもう一度生まれ直させる」ような、輪廻の考えに基づいて自覚的に再登場させていると知ってめちゃくちゃ感動した。
> 続けることで出てくるキャラクターとしての深み...。自分も継続することを一つのお題として取り組んでいるけど、再演するような考えで取り組んだことはなかった。

これ、クリエイティブコーディングの文脈でまさにやれること。

## walking codingの「再演」とは

networkグラフを見ると、1月に作った「分裂増殖する生物」(01-06) が、4月にdifferential growthという形で「再演」の候補になってる。同じ「増殖」というテーマだけど、舞台（アルゴリズム）が違う。

もっと意識的にやるなら：

- **01-06の分裂増殖** → Voronoiセルで再演（セルが分裂して増えていく）
- **01-20のベジェ文字ブラシ** → シェーダーのSDFで再演（文字の輪郭をSDF関数で定義して、その上をパーティクルが這う）
- **02-09のSpring-layout** → Verlet integrationで再演（同じネットワーク、違う物理エンジン）
- **04-07のフローフィールド** → ピクセルソートで再演（画像のピクセルがnoise角度に沿って並び替わる）

松本零士の「輪廻」に倣えば、**同じ「キャラクター」（テーマ・モチーフ）を、新しい「舞台」（技術・アルゴリズム）に乗せる**。そうすると、テーマの本質が浮き彫りになる。「これは技術の問題じゃなくて、増殖というテーマ自体が持つ面白さだったんだ」みたいな発見がある。

## 具体的に

networkグラフの既存スケッチから1つ選んで、全く違う技術で同じテーマをやり直す：

| 元スケッチ | テーマ | 再演候補 |
|---|---|---|
| 01-06 分裂増殖 | 成長と死 | reaction-diffusion, differential growth |
| 01-08 有機的な線 | 隣接関係 | Delaunay, Voronoi |
| 01-28 VJ+BPM | 音と映像 | audio-reactive, シェーダーbloom |
| 02-09 Spring-layout | 力のバランス | Verlet, Boids |
| 04-07 フローフィールド | 流れ | curl noise, strange attractors |
| 04-09 Voronoi | 領域分割 | Worley noise, Lloyd relaxation |

これは「新しいことをやる」のとも「前のを改善する」のとも違う。**同じ問いを、違う言語で問い直す**こと。

## さらに見るなら

- [Zach Lieberman daily sketches](https://www.instagram.com/zaborsky_c/) — 同じモチーフを何度も違う技法で再演してる。spiral, face, text...
- [Casey Reas "Process"シリーズ](https://reas.com/still_life_series/) — 同じルールセットを異なるメディアで実行
- [Sol LeWitt wall drawings](https://massmoca.org/sol-lewitt/) — 同じ「指示」を異なる壁/空間で再実行
