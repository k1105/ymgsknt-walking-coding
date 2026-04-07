ネットワーク再び。半径の動きにeaseElasticOutをつけてみる。

filter(BLUR), filter(THLESHOLD), easeElasticOutなんかを組み合わせて表情をつけるのが最近のお気に入りになっている気がする。

半径の動きを全部一緒にするのではなくて、小さいノードから大きいノードにいくに従ってちょっとずらしながら動かすようにしたら、小気味よくなった。

これはネットワークならではなんじゃないかと一瞬思ったけど、ノード同士で順序が決まっていたらなんでもできるか。あとは今、結構散漫な配置になっているから、もうちょっと枝葉っぽい感じになるといいのかな。

あとはだんだんインプットがないと枯渇してくる。ちょっとずつインプット増やしていかないとな。spring-layoutはちゃんと勉強したい…。


openprocessingはこういうライブラリがあるのがいいな。

[https://openprocessing.org/sketch/2467213](https://openprocessing.org/sketch/2467213)

[https://openprocessing.org/sketch/2494349](https://openprocessing.org/sketch/2494349)

[https://openprocessing.org/sketch/2676312](https://openprocessing.org/sketch/2676312)


あと、matterjsを取り入れたスケッチもそろそろ…。

[https://brm.io/matter-js/](https://brm.io/matter-js/)


geminiに一番ミニマルなサンプルコードを提供してもらった。明日はこれを写経してみる…。

```javascript
let nodes = [];
let edges = [];
const nodeCount = 8;
const k = 0.1; // バネ定数（引き合う強さ）
const repulsion = 1000; // 反発力
const damping = 0.85; // 減衰（動きを落ち着かせる）
const restLength = 100; // バネの自然長

function setup() {
  createCanvas(600, 400);
  
  // 1. ノードの初期化（ランダムな位置）
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      pos: createVector(random(width), random(height)),
      vel: createVector(0, 0),
      acc: createVector(0, 0)
    });
  }

  // 2. エッジの定義（隣り合うノードをつなぐ）
  for (let i = 0; i < nodeCount; i++) {
    edges.push([i, (i + 1) % nodeCount]); // 輪っか状につなぐ
    if (i === 0) edges.push([0, 4]); // おまけの接続
  }
}

function draw() {
  background(240);

  // --- 物理計算 ---
  
  // A. 反発力の計算（全てのノード間）
  for (let i = 0; i < nodes.length; i++) {
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      let force = p5.Vector.sub(nodes[i].pos, nodes[j].pos);
      let dist = force.mag();
      if (dist < 1) dist = 1; // ゼロ除算防止
      force.setMag(repulsion / (dist * dist)); // 距離の逆二乗で反発
      nodes[i].acc.add(force);
    }
  }

  // B. バネの力の計算（つながっているノード間）
  for (let edge of edges) {
    let n1 = nodes[edge[0]];
    let n2 = nodes[edge[1]];
    let force = p5.Vector.sub(n2.pos, n1.pos);
    let dist = force.mag();
    let stretch = dist - restLength;
    force.setMag(k * stretch); // フックの法則 F = kx
    n1.acc.add(force);
    n2.acc.sub(force);
  }

  // C. 状態の更新
  for (let n of nodes) {
    n.vel.add(n.acc);
    n.vel.mult(damping); // 摩擦でエネルギーを逃がす
    n.pos.add(n.vel);
    n.acc.set(0, 0); // 加速度リセット
  }

  // --- 描画 ---

  // エッジの描画
  stroke(150);
  for (let edge of edges) {
    line(nodes[edge[0]].pos.x, nodes[edge[0]].pos.y, nodes[edge[1]].pos.x, nodes[edge[1]].pos.y);
  }

  // ノードの描画
  noStroke();
  fill(100, 150, 250);
  for (let n of nodes) {
    circle(n.pos.x, n.pos.y, 30);
  }
}
```

