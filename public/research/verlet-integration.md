# Verlet Integration — Matter.jsの「真骨頂」の中身

[2026-02-12のスケッチ](/diary/2026-02-12)でMatter.jsを使ってみて、こう書いてたよね：

> もうちょいライブラリの真骨頂に触れられるように頑張ります。

その「真骨頂」の中身に関わる話。Matter.jsの内部で起きていることを理解すると、ライブラリを使わずに同じこと（あるいは違うこと）ができるようになる。

## Matter.jsが内部で使ってるもの

Matter.jsは「Position-based Dynamics」という流派で、その中核がVerlet integration。物理シミュレーションには大きく2つのアプローチがある：

- **Force-based（力ベース）**: 力 → 加速度 → 速度 → 位置（4変数）
- **Position-based（位置ベース）**: 位置と前フレームの位置だけ（2変数）

Verletは後者。速度を陽に持たない。これが何故重要かというと、**「制約」がそのまま位置の修正として書ける**から。

## 何が起きるか

更新式は1行：
```
newPos = pos + (pos - oldPos) + acceleration * dt²
```

`pos - oldPos` が暗黙の速度。これだけで慣性・重力・摩擦が自然に表現される。

そして「2点間の距離を一定に保つ」という制約を入れたいとき、Force-basedだとバネ定数を計算して力を加えて…と複雑だけど、Verletなら：
```
// 距離が長すぎたら両側を引き寄せる
let diff = (currentDist - restDist) * 0.5;
let dir = normalize(p2 - p1);
p1 += dir * diff;
p2 -= dir * diff;
```
これだけ。**位置を直接いじる**から制約が直感的。

[Pikumaの解説](https://pikuma.com/blog/verlet-integration-2d-cloth-physics-simulation) に図がたくさんあって、点と棒だけで布が揺れる様子がわかる。

## 「点 + 棒 + 反復」で作れるもの

- ロープ: 点を一列に繋ぐ
- 布: 点をグリッドに繋ぐ（対角線制約でせん断剛性も追加）
- ソフトボディ: 点を多角形に繋ぐ
- 骨格・関節: 可動域を角度制約で表現

全部「点」と「棒」の組み合わせ。Matter.jsでもこれを使ってる（`Constraint`がまさに棒）。

[このCodePen](https://codepen.io/cedarcantab/pen/YPzyyJV) で揺れるロープが見られる。コードもシンプル。

## 最小実装

```js
class Point {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.oldX = x; this.oldY = y;
    this.pinned = false;
  }
  update() {
    if (this.pinned) return;
    let vx = this.x - this.oldX;
    let vy = this.y - this.oldY;
    this.oldX = this.x;
    this.oldY = this.y;
    this.x += vx;
    this.y += vy + 0.5;  // 重力
  }
}

class Stick {
  constructor(p1, p2) {
    this.p1 = p1; this.p2 = p2;
    this.length = dist(p1.x, p1.y, p2.x, p2.y);
  }
  apply() {
    let dx = this.p2.x - this.p1.x;
    let dy = this.p2.y - this.p1.y;
    let d = sqrt(dx*dx + dy*dy);
    let diff = (this.length - d) / d / 2;
    let offsetX = dx * diff;
    let offsetY = dy * diff;
    if (!this.p1.pinned) { this.p1.x -= offsetX; this.p1.y -= offsetY; }
    if (!this.p2.pinned) { this.p2.x += offsetX; this.p2.y += offsetY; }
  }
}

let points = [];
let sticks = [];

function setup() {
  createCanvas(800, 800);
  for (let i = 0; i < 20; i++) {
    let p = new Point(100 + i * 30, 100);
    if (i === 0) p.pinned = true;
    points.push(p);
  }
  for (let i = 0; i < points.length - 1; i++) {
    sticks.push(new Stick(points[i], points[i + 1]));
  }
}

function draw() {
  background(255);
  for (let p of points) p.update();
  // 制約を複数回反復するほど剛体に近づく
  for (let i = 0; i < 10; i++) {
    for (let s of sticks) s.apply();
  }
  stroke(0);
  for (let s of sticks) line(s.p1.x, s.p1.y, s.p2.x, s.p2.y);
}
```

これだけで「壁から垂れ下がるロープ」が動く。マウスでドラッグするコードを足せばインタラクティブになる。

## 2/12との関係

2/12でMatter.jsを使って「ストイックに物理演算するだけよりも、ちょっと余韻が効いていていい」って書いてた。Verletの制約反復回数を減らすと、まさにその「余韻」が出る。剛体じゃなくてゴムみたいな動きになる。Matter.jsの硬さに飽きたら、自分でVerletを書いて反復回数をいじると、Matter.jsよりリラックスした動きが手に入る。

## さらに見るなら

- [Pikumaの解説](https://pikuma.com/blog/verlet-integration-2d-cloth-physics-simulation) — 図解付き、布シミュレーションまで
- [aryamancodes/Rope-and-Cloth-Simulation](https://github.com/aryamancodes/Rope-and-Cloth-Simulation) — p5.js実装の決定版
- [Jakobsen "Advanced Character Physics" (2001)](https://www.cs.cmu.edu/afs/cs/academic/class/15462-s13/www/lec_slides/Jakobsen.pdf) — 原典論文。短くて読みやすい
