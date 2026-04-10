# Verlet Integration — 位置だけで物理シミュレーションする方法

## 調査トピック

Verlet integration。速度を陽に持たない物理シミュレーション手法と制約ソルバー。

## 見つけたもの

### Verlet integrationとは

- 「現在の位置」と「前フレームの位置」だけで次の位置を計算
- 速度を変数として持たない（暗黙的に `pos - oldPos` が速度）
- 更新式: `newPos = pos + (pos - oldPos) + acceleration * dt²`
- Euler法より安定、エネルギー保存性が高い

### 制約（constraint）ベースのシミュレーション

- 2点間の距離を一定に保つ「棒（stick）」を定義
- 位置更新後に制約を繰り返し適用（relaxation iteration）
- 反復回数が多いほど剛体に近づく
- Jakobsen (2001) "Advanced Character Physics" が有名な解説

### 「点 + 棒 + 反復」で作れるもの

- ロープ: 点を一列に繋ぐ
- 布: 点をグリッドに繋ぐ（+ 対角線制約でせん断剛性）
- ソフトボディ: 点を多角形に繋ぐ
- 骨格・関節: 可動域を角度制約で表現

### p5.js実装

- aryamancodes/Rope-and-Cloth-Simulation（GitHub）
- LucaAngioloni/verlet（GitHub、デモ付き）
- explosion-scratch（ブログ記事 + 実装）

## 山岸の関心との接続点

- **フローフィールドとの対比**: フローフィールドは「外部の力場→粒子の移動」、Verletは「粒子同士の関係性→全体の挙動」
- **differential growthとの構造的類似**: differential growthの反発力+引力+整列力も、Verlet的な制約ソルバーに近い
- **シンプルな数学**: 更新式1行 + 制約ループで完結。写経向き
- **拡張性**: ロープ→布→ソフトボディと段階的に複雑化できる

## Discord投稿

researchチャンネルに投稿済み（2026-04-08 22:42 JST）
