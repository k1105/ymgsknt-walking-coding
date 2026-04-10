# Differential Growth — 「死」を入れずに重くならない増殖

[2026-01-06のスケッチ](/diary/2026-01-06)で「分裂増殖」をやって、こう書いてたよね：

> 純粋に増殖する形にすると、時間経過と共に処理が重くなるので「死」の概念を導入した。翻って言えば、自分はアニメーションは永久に持続してほしいと思っているんだな。

「永久に持続してほしい」気持ちと「重くなる」現実の間の妥協点として「死」を入れた。これに対する別解がdifferential growth。

## 何が起きるか

ノードが連なった**1本の閉曲線**から始まる。各ノードに3つの力をかけ続ける：

1. **反発力** — 全ノード同士が押し合う
2. **整列力** — 隣接2点の中点に向かう
3. **挿入** — エッジが長くなりすぎたら中点に新ノードを追加

それだけ。すると曲線は珊瑚の縁、レタスの葉、脳のしわみたいに**勝手にうねり始める**。

死なない。ノードの数は緩やかに増えるけど、**形が複雑化する分の増加**だから1/6でやってた指数関数的な爆発にはならない。

[Jason Webbのインタラクティブplayground](https://jasonwebb.github.io/2d-differential-growth-experiments/experiments/playground/) を見てほしい。パラメータをグリグリ動かして、いろんな形が出るのを試せる。

## 1/6への回答として

1/6で導入した「死」は処理負荷を抑えるための妥協だった。differential growthは別のアプローチで同じ問題を解く：

- **死を入れる**: 全体を一定数に保つ。粒子は出入りする
- **differential growth**: 全体を1本の曲線に縛る。複雑化はノード数増加だが、上限に達したら挿入を止めればいい

「永久に持続するアニメーション」という意味では、こっちの方が近いかも。**形は変わり続けるけど、構造は壊れない**。粒子が出入りしないから、見ていて落ち着く。

## 最小実装

```js
let nodes = [];
const REPULSION_R = 20;
const MAX_EDGE = 10;

function setup() {
  createCanvas(800, 800);
  for (let i = 0; i < 30; i++) {
    let a = (i / 30) * TWO_PI;
    nodes.push(createVector(400 + cos(a) * 50, 400 + sin(a) * 50));
  }
}

function draw() {
  background(255);

  // 1. 反発力
  for (let i = 0; i < nodes.length; i++) {
    let force = createVector(0, 0);
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      let d = p5.Vector.dist(nodes[i], nodes[j]);
      if (d < REPULSION_R) {
        let dir = p5.Vector.sub(nodes[i], nodes[j]).normalize();
        force.add(dir.mult((REPULSION_R - d) * 0.05));
      }
    }
    nodes[i].add(force);
  }

  // 2. 整列力（隣接2点の中点に向かう）
  let next = nodes.map((n, i) => {
    let prev = nodes[(i - 1 + nodes.length) % nodes.length];
    let nxt = nodes[(i + 1) % nodes.length];
    let mid = p5.Vector.add(prev, nxt).mult(0.5);
    return p5.Vector.lerp(n, mid, 0.05);
  });
  nodes = next;

  // 3. エッジが長すぎたら新ノード挿入
  for (let i = nodes.length - 1; i >= 0; i--) {
    let nxt = nodes[(i + 1) % nodes.length];
    if (p5.Vector.dist(nodes[i], nxt) > MAX_EDGE) {
      let mid = p5.Vector.add(nodes[i], nxt).mult(0.5);
      nodes.splice(i + 1, 0, mid);
    }
  }

  // 描画
  noFill();
  stroke(0);
  beginShape();
  for (let n of nodes) vertex(n.x, n.y);
  endShape(CLOSE);
}
```

円から始めて数秒待つと、勝手に脳みそみたいな曲線になる。

## 02-18の「不安定さ」とも繋がる

[2026-02-18のMatter.jsスケッチ](/diary/2026-02-18)で「物理的不安定さが面白い」って書いてた。differential growthも物理シミュレーションの一種だけど、不安定さを「制御された美しさ」に変える方向。同じ系統の関心。

## 1/24の円充填の延長としても

[2026-01-24で円の充填](/diary/2026-01-24)をやってたけど、circle packingが「静的な空間充填」だとしたら、differential growthは「動的な空間充填」。同じく「空間を埋める」ことに関心がある。

## さらに見るなら

- [Jason Webb playground](https://jasonwebb.github.io/2d-differential-growth-experiments/experiments/playground/) — 全パラメータがインタラクティブ
- [Jason Webb解説記事](https://medium.com/@jason.webb/2d-differential-growth-in-js-1843fd51b0ce) — 実装の詳細
- [morphogenesis-resources](https://github.com/jasonwebb/morphogenesis-resources) — 形態生成アルゴリズムの宝庫
