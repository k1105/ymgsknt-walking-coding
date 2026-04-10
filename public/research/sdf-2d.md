# 2D SDF（Signed Distance Function）— 数式で形を定義し、min/maxで合成する

## 調査トピック

Signed Distance Function（符号付き距離関数）の2D版。数式による形状定義とブール演算。

## 見つけたもの

### SDFとは

- 「点pからこの形までの距離」を返す関数
- 内側なら負、外側なら正、境界上で0
- この符号だけで内外判定が完了

### 基本プリミティブ

- 円: `length(p) - r`（中心までの距離 - 半径）
- 矩形: `length(max(abs(p)-b, 0.0)) + min(max(d.x,d.y), 0.0)`
- 線分、三角形、多角形、楕円、放物線、ベジェ曲線…50種以上

### ブール演算が算術演算になる

- union: `min(d1, d2)`
- intersection: `max(d1, d2)`
- subtraction: `max(d1, -d2)`
- smooth union: `smin(d1, d2, k)` → メタボールのような融合

### Inigo Quilezのリファレンス

- iquilezles.org/articles/distfunctions2d/ — 2D SDF集
- iquilezles.org/articles/distfunctions/ — 3D SDF集
- 全プリミティブにShadertoyデモ付き

### 実装の流れ（シェーダー）

1. フラグメントシェーダーでピクセル座標を正規化
2. SDF関数で距離を計算
3. `step()` や `smoothstep()` で距離→色に変換
4. 複数のSDFを `min/max` で合成

## 山岸の関心との接続点

- **シェーダーへの入口**: SDFは数学的に明快で、即座に視覚的フィードバックが得られる
- **raymarching/SDFの2D版**: 以前調査したraymarching（3D SDF）の前段階として、2Dで概念を掴める
- **「道具の使い方」**: noise→flow field→curl→domain warpingの系列に対して、SDF→boolean→smooth blendingという別の道具体系
- **VJとの接続**: SDFベースのビジュアルはGPU完結でパフォーマンスが高く、リアルタイム映像向き

## Discord投稿

researchチャンネルに投稿済み（2026-04-08 22:12 JST）
