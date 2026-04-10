# Delaunay三角形分割 + Voronoi図 — 点群から2つの「双対」構造が生まれる

## 調査トピック

Delaunay三角形分割とVoronoi図の双対関係。計算幾何学の基礎。

## 見つけたもの

### Delaunay三角形分割

- 点群を三角形で埋め尽くす
- 条件: どの三角形の外接円も他の点を含まない（empty circumcircle property）
- 「最小角度を最大化」する三角形分割 → 細長い三角形が避けられる
- 計算量: O(n log n)

### Voronoi図

- 各点に「最寄りの領域」を割り当てる
- 多角形のタイル状パターン
- 自然界: キリンの模様、ひび割れ、細胞、結晶構造

### 双対（dual）の関係

- Delaunayで隣接する2つの三角形の外接円中心を結ぶ → Voronoiの辺
- Delaunayの三角形の外接円中心 = Voronoiの頂点
- 一方を計算すればもう一方が自動的に得られる
- 数学的に美しい対称性

### アルゴリズム

- Fortune's Algorithm: sweep lineベース、O(n log n)
- Bowyer-Watson: 増分法、実装がシンプル
- d3-delaunay: JavaScriptの定番ライブラリ

### Creative codingでの応用

- Low-poly画像化: 画像から点をサンプリング → Delaunay → 各三角形を平均色で塗る
- スティップリング: Voronoiの重心にドットを置く（Lloyd relaxation）
- 地形生成: Delaunayメッシュ上で高さを割り当て
- Poisson disk sampling → Delaunay/Voronoiのパイプライン

## 山岸の関心との接続点

- **Poisson disk samplingとの組み合わせ**: 均等な点群 → Delaunay/Voronoiで構造化するパイプライン
- **双対の数学**: 「1つの点群から2つの構造が生まれる」双対性は、noiseの値/傾き/curlのような「同じ入力から異なる読み方」に通じる
- **p5.jsで使える**: d3-delaunayライブラリを読み込めばすぐ試せる
- **VJとの接続**: Voronoiパターンはリアルタイム映像でよく使われる視覚要素

## Discord投稿

researchチャンネルに投稿済み（2026-04-09 00:12 JST）
