# Wave Propagation — 「ノードの順序を時間差にする」の本格化

[2026-02-08のスケッチ](/diary/2026-02-08)で、ノード間の動きに時間差をつけて小気味よくしたって書いてた：

> 半径の動きを全部一緒にするのではなくて、小さいノードから大きいノードにいくに従ってちょっとずらしながら動かすようにしたら、小気味よくなった。
> 
> これはネットワークならではなんじゃないかと一瞬思ったけど、ノード同士で順序が決まっていたらなんでもできるか。

「ノード同士で順序が決まっていたらなんでもできるか」って言ってたけど、実はネットワークにはネットワークならではの伝播の仕方がある。**Wave propagation on graphs**（グラフ上の波伝播）。

## 何が起きるか

ある一点から「波」が出て、エッジを伝って隣のノードに広がっていく。隣に届くまでに時間がかかるから、グラフの構造そのものが**時間差のパターン**として可視化される。

[Bostock's "Graph Wave"のようなd3デモ](https://observablehq.com/@d3/disjoint-force-directed-graph) の系統。一点をクリックすると、そこから波紋が広がっていく。

これはノードの「順序」じゃなく、**「ネットワーク上の距離（hop数）」**で時間差が決まる。だから：

- ハブ（接続が多いノード）から伝播 → 一気に広がる
- 葉（端のノード）から伝播 → ゆっくり一直線に広がる
- 切断されたサブグラフ → 一方の波がもう一方に届かない

ネットワークの構造的特性が、伝播パターンとして見える。

## 2/8のスケッチへの応用

今のスケッチは「インデックスの順序」で時間差をつけてた：
```js
let phase = i / nodes.length;  // 単純な順序
let r = ease(t - phase) * size;
```

これを「波源からのhop数」に置き換える：
```js
// setupで各ノードの「波源からの距離」を計算（BFS）
function bfs(sourceIdx) {
  let dist = new Array(nodes.length).fill(Infinity);
  dist[sourceIdx] = 0;
  let queue = [sourceIdx];
  while (queue.length) {
    let u = queue.shift();
    for (let v of neighbors[u]) {
      if (dist[v] === Infinity) {
        dist[v] = dist[u] + 1;
        queue.push(v);
      }
    }
  }
  return dist;
}

let waveSource = 0;
let nodeDist = bfs(waveSource);

// drawで
for (let i = 0; i < nodes.length; i++) {
  let phase = nodeDist[i] * 0.2;  // hop数で位相をずらす
  let r = (sin(t - phase) * 0.5 + 0.5) * size;
  circle(nodes[i].pos.x, nodes[i].pos.y, r);
}
```

これだけで「あるノードから波紋が広がる」表現になる。`waveSource`をマウスクリックで切り替えると、ネットワークの構造が「波紋の広がり方」として目に見える。

## 拡張：複数の波源

複数の波が干渉する：
```js
let sources = [0, 5, 12];
let dists = sources.map(s => bfs(s));

for (let i = 0; i < nodes.length; i++) {
  let r = 0;
  for (let dist of dists) {
    r += sin(t - dist[i] * 0.2);
  }
  // 干渉パターン
  circle(nodes[i].pos.x, nodes[i].pos.y, abs(r) * 10);
}
```

これで「複数の点から出た波が同じノードでぶつかる」現象が見える。物理的な波の重ね合わせの原理と同じ。

## 物理的な「波」を入れる

もっと物理寄りにすると、各ノードに「変位」と「速度」を持たせて、隣のノードとの差分から力を計算する：

```js
// 各ノード: { displacement: 0, velocity: 0 }
function step() {
  let forces = new Array(nodes.length).fill(0);
  for (let [i, j] of edges) {
    let diff = nodes[j].displacement - nodes[i].displacement;
    forces[i] += diff * 0.1;  // 隣との差分
    forces[j] -= diff * 0.1;
  }
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].velocity += forces[i];
    nodes[i].velocity *= 0.99;  // 減衰
    nodes[i].displacement += nodes[i].velocity;
  }
}

// 一点を叩く
nodes[0].displacement = 50;
```

これは「グラフ上の離散ラプラシアン」の数値解法で、本物の波動方程式に近い。1点をクリックして叩くと、ネットワーク全体に振動が広がっていく。

## 4/9のVoronoiにも適用できる

[2026-04-09のスケッチ](/diary/2026-04-09)のVoronoiセル群でも同じことができる。各セルを「ノード」、隣接セル同士を「エッジ」と考えて、波を伝播させる。セルの面積や色を波の変位で変調すると、Voronoiパターンが「液体の振動」みたいに動く。

## さらに見るなら

- [Observable: Force-directed graph](https://observablehq.com/@d3/disjoint-force-directed-graph) — d3でのグラフ表現の基礎
- [Wikipedia: Graph Laplacian](https://en.wikipedia.org/wiki/Laplacian_matrix) — 数学的背景
- [Distill.pub: A Gentle Introduction to Graph Neural Networks](https://distill.pub/2021/gnn-intro/) — グラフ上の伝播全般。GNNは波伝播を学習で使う
- [Shadertoy: Wave Equation](https://www.shadertoy.com/view/MdfSWN) — 連続体での波。比較として
