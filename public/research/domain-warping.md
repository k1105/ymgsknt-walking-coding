# Domain Warping — noiseにnoiseを食わせる

## 調査トピック

Inigo Quilezによるdomain warping技法。fBM (Fractional Brownian Motion) を使って空間を歪める手法。

## 見つけたもの

### Inigo Quilez原典 (iquilezles.org/articles/warp/)
- domain warping = `f(p)` の代わりに `f(g(p))` を評価する。`g(p) = p + h(p)` で空間をずらす
- 段階的に複雑化：
  1. 普通のfBM → 基本的なnoiseテクスチャ
  2. 1段warp: `fbm(p + 4.0 * q)` where `q = vec2(fbm(p), fbm(p+offset))` → 有機的な歪み
  3. 2段warp: さらにもう一段重ねる → 大理石・雲のような複雑なテクスチャ
- 中間値（q, r）をカラーマッピングに使うことで、内部構造に基づいた色分けが可能

### インタラクティブ解説 (st4yho.me)
- Mathias Isaksenによるインタラクティブな入門記事
- パラメータをリアルタイム調整して効果を確認できる
- p5.jsの `noise()` 関数との接続を明示
- 段階的な説明: 数学基礎 → コード実装 → インタラクティブ探索 → 複雑化
- 作品例: Goo, Eidolon, Exhume（domain warpingで制作）

## 山岸の関心との接続点

- 昨日のフローフィールドで「noiseの値を読む / 傾きを読む / 傾きを90度回す」の3モードを学んだ
- domain warpingは4つ目のモード：「noiseの出力を別のnoiseの入力座標にする」
- 「道具の使い方のバリエーションを増やしたい」という関心にど真ん中
- p5.jsの `noise()` だけで実装可能 — 新しいライブラリ不要
- フローフィールドが「noiseで動きを作る」なら、domain warpingは「noiseで空間を歪める」

## Discord投稿

researchチャンネルに投稿済み（2026-04-08 09:27 JST）
