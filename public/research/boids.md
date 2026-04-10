# Boids — 「列をなして進む」の元ネタ

[2026-04-07](/diary/2026-04-07)で「近くにある座標のものは角度が似てくるから、パーティクルが接近するとそれらが合流して一緒に流れるようになってくる」と書いてた。あの「列をなして流れる」現象、フローフィールドだとnoiseの空間相関の副作用だけど、**意図的に「流れる群れ」を作るアルゴリズム**が存在する。

それがBoids。Craig Reynolds (1986) が、鳥の群れや魚の群れをシミュレーションするために考案した。Cellular AutomataやL-systemと並んで、creative codingの古典中の古典。

## 何が起きるか

各粒子（boid）に**3つのルール**を適用する。それだけ：

1. **Separation（分離）** — 近すぎる仲間から離れる
2. **Alignment（整列）** — 仲間の進行方向に揃える
3. **Cohesion（結合）** — 仲間の中心に向かう

これだけのルールから、**鳥の群れのような動き**が創発する。誰かがリーダーになるわけでもなく、全員が同じ局所ルールに従うだけで、全体として流れるような群れが生まれる。

[Boids可視化（craig reynolds本人）](https://www.red3d.com/cwr/boids/) を見ると、鳥っぽい動きが本当に出てくる。

[Coding Trainの動画](https://thecodingtrain.com/challenges/124-flocking-simulation) はShiffmanがp5.jsで全部実装してくれてる。

## 4/7のスケッチとの関係

4/7のフローフィールドは「外部の力場に従う」モデル：
- noise関数が空間に分布
- 粒子はその場所のnoise値から角度を取る
- 近い粒子は似た角度になるから「結果的に」流れに見える

Boidsは「粒子同士の相互作用」モデル：
- 粒子は周囲の粒子を見る
- 周囲の動きと自分を調整する
- それが「結果的に」流れになる

**フローフィールド = 環境決定論**、**Boids = 自己組織化**。同じ「流れ」でも哲学が違う。

両方混ぜることもできる：「フローフィールドに従いつつ、boidsルールも適用する」。すると外部の地形に従いながら群れが形成される、川を泳ぐ魚みたいな動きになる。

## 最小実装

```js
let boids = [];

class Boid {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = p5.Vector.random2D().mult(2);
  }
  
  flock(boids) {
    let sep = createVector(), ali = createVector(), coh = createVector();
    let countSep = 0, countAli = 0, countCoh = 0;
    
    for (let other of boids) {
      let d = p5.Vector.dist(this.pos, other.pos);
      if (other === this || d > 50) continue;
      
      // Separation: 近すぎる相手から離れる
      if (d < 25) {
        let diff = p5.Vector.sub(this.pos, other.pos).div(d);
        sep.add(diff);
        countSep++;
      }
      
      // Alignment: 仲間の速度を平均
      ali.add(other.vel);
      countAli++;
      
      // Cohesion: 仲間の位置を平均
      coh.add(other.pos);
      countCoh++;
    }
    
    if (countSep) sep.div(countSep).setMag(2).sub(this.vel).limit(0.05);
    if (countAli) ali.div(countAli).setMag(2).sub(this.vel).limit(0.05);
    if (countCoh) {
      coh.div(countCoh).sub(this.pos).setMag(2).sub(this.vel).limit(0.05);
    }
    
    this.vel.add(sep).add(ali).add(coh).limit(2);
  }
  
  update() {
    this.pos.add(this.vel);
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.y < 0) this.pos.y = height;
    if (this.pos.y > height) this.pos.y = 0;
  }
}

function setup() {
  createCanvas(800, 800);
  for (let i = 0; i < 200; i++) boids.push(new Boid());
}

function draw() {
  background(0, 30);
  for (let b of boids) b.flock(boids);
  for (let b of boids) {
    b.update();
    fill(255);
    noStroke();
    circle(b.pos.x, b.pos.y, 4);
  }
}
```

3つの係数（separation, alignment, cohesionの強さ）を変えると、挙動が劇的に変わる：

- **Separationが強い**: 粒子が広がって滅多にぶつからない
- **Alignmentが強い**: 全員が同じ方向を向く（軍隊の行進みたい）
- **Cohesionが強い**: 全員が中心に集まる
- **3つのバランス**: 鳥の群れみたいな自然な挙動

## 「クラスタ知覚」との繋がり

[2026-04-08](/diary/2026-04-08)で「クラスタ的なものが可視化されるのは面白い」って書いてた。あれと同じ知覚の話。Boidsで生まれる群れは、人間の視覚野が「動きの似た粒子をグループとして認識する」（gestalt grouping by common motion）から「群れ」に見える。

Biological motion perceptionの話とも繋がる：単純な点の集まりなのに、なぜか「生きている何か」に感じる。

## さらに見るなら

- [Craig Reynolds: Boids原典](https://www.red3d.com/cwr/boids/) — 1986年の論文と動画
- [Coding Train: Flocking Simulation](https://thecodingtrain.com/challenges/124-flocking-simulation) — Shiffmanのp5.js実装、動画+コード
- [Nature of Code: Chapter 6](https://natureofcode.com/autonomous-agents/) — Shiffmanの本のautonomous agents章
- [Boids in 3D (Three.js)](https://threejs.org/examples/?q=birds) — Three.js公式の3D版
