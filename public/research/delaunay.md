# Delaunay三角形分割 — 「隣接ノードをうまく繋げたら」への回答

[2026-04-08のスケッチ](/diary/2026-04-08)で、3D空間のパーティクル同士を距離閾値で結ぶ実装をやってたよね。日記で書いてた一文：

> ランダムに繋いでるからなー。隣接するノード同士をうまく繋げたらいいんだけど。

これに対する答えがDelaunay三角形分割。「点群から、どの点が隣か」を自動的に計算してくれる。

## 何が起きるか

ランダムに撒かれた点を「最も自然な三角形メッシュ」で繋ぐ。条件はシンプル：**どの三角形の外接円も、他の点を含んではいけない**。

これだけのルールから、奇跡的に「細長い三角形が避けられた、最小角度が最大化されたメッシュ」が出てくる。

[d3-delaunayの公式デモ](https://d3js.org/d3-delaunay) を見ると、点をマウスで動かすたびに三角形メッシュがリアルタイムに組み変わるのがわかる。

そして同じ点群から、もう一つの構造が同時に得られる。それが**Voronoi図**（4/9で山岸さんが既にやったやつ）。Delaunayで隣り合う三角形の外接円の中心を結ぶと、それがVoronoiのエッジになる。**2つの図は同じ点群の表と裏**。

## 4/8のスケッチに足すなら

```html
<!-- index.htmlに追加 -->
<script src="https://cdn.jsdelivr.net/npm/d3-delaunay@6"></script>
```

```js
// draw内で：3D点群を一旦x-z平面に投影してDelaunay計算
let coords = [];
for (let p of particles) {
  coords.push(p.x, p.z);
}
let delaunay = new d3.Delaunay(coords);
let tri = delaunay.triangles;

// 三角形を描画（昨日の二重ループ判定の代わり）
stroke(255, 50);
for (let i = 0; i < tri.length; i += 3) {
  let a = particles[tri[i]];
  let b = particles[tri[i + 1]];
  let c = particles[tri[i + 2]];
  line(a.x, a.y, a.z, b.x, b.y, b.z);
  line(b.x, b.y, b.z, c.x, c.y, c.z);
  line(c.x, c.y, c.z, a.x, a.y, a.z);
}
```

ポイント：d3-delaunayは2D前提なので、3DパーティクルをY軸（高さ）だけ無視してx-z平面に落とす。隣接関係はその2D投影で計算されるけど、描画は3D座標でやる。

## 距離閾値より良い理由

距離閾値だと：
- 粒子が近寄ると一気に密に繋がる
- 離れると断絶する
- 全ペア判定でO(n²)

Delaunayだと：
- 「最近隣」が一意に定まる（距離ではなくトポロジで）
- 点が動いても繋がりは滑らかに変化する
- O(n log n)

昨日「結局convex envelopeみたいに最大公約数的な形になる」と書いてたけど、Delaunayなら内部構造もちゃんと拾える。

## さらに見るなら

- [d3-delaunay公式](https://d3js.org/d3-delaunay) — APIリファレンス + デモ
- [delaunator](https://mapbox.github.io/delaunator/) — d3-delaunayの中身。インタラクティブデモあり
- [Three.js + Delaunatorの3D例](https://codepen.io/prisoner849/pen/bQWOjY) — 2D投影で計算→3D描画のパターン
