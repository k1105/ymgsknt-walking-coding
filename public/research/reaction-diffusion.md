# Reaction-Diffusion — 「描く」のではなく「育てる」

[2026-03-13のスケッチ](/diary/2026-03-13)で、線を「円のつながり」に置き換える代替の話をしてた：

> 今回のテーマは代替。line関数と同じパラメータをとって、円のつながりで線を作る。古典的な方法だけど。
>
> 冗長性のあるメディウム(=円)で置き換えることで、円に対する操作を線の描画の話の中に引き寄せられるようになるのが面白い。
>
> もうちょっと違う代替がないかしら。

「もっと違う代替」のラディカル版。**「描く」を完全にやめて、化学反応に任せる**。Reaction-Diffusion (反応拡散系) は、Alan Turing (1952) が「動物の縞模様や斑点はどこから来るか」を説明するために考案した数理モデル。

## 何が起きるか

2つの化学物質A, Bが格子上を拡散しながら反応する。ルールは非常にシンプル：

```
∂A/∂t = D_A · ∇²A − A·B² + f·(1−A)
∂B/∂t = D_B · ∇²B + A·B² − (k+f)·B
```

数式は怖いけど、コードに直すとforループの中で隣接セルの平均を取って引き算するだけ。

これだけのルールから、**自然界に存在する縞模様・斑点・迷路パターン**が勝手に出現する。

- シマウマの縞
- ヒョウの斑点
- 熱帯魚の模様
- サンゴの形
- 脳のしわ

[Karl Sims のreaction-diffusion チュートリアル](https://www.karlsims.com/rd.html) の図を見てほしい。パラメータ`f`と`k`を変えるだけで、全く違う模様が出てくる早見表がある。「Coral」「Mitosis」「Fingerprint」「U-Skate」など、それぞれ生物の名前がついてる。

[mrob.com の対話的な可視化](https://mrob.com/pub/comp/xmorphia/) も見るといい。pingponging な変化が美しい。

## 「代替」としての位置づけ

3/13で言ってた「代替」の階層を考えると：

- **最初**: line関数で線を描く
- **3/13**: 線を円で置き換える（描画手段の代替）
- **次**: 円を別のものに置き換える？ → これは表面的
- **ラディカル**: **「描く」自体をやめる**

Reaction-Diffusionは、図形の代替じゃなくて**プロセスの代替**。「あなたは何も描かない。化学物質を撒いて、反応を待つ。すると勝手に絵が現れる」。

## 最小実装

p5.jsで動くやつ。グリッドに2つの値を持たせて、毎フレーム拡散+反応：

```js
let grid = [];
let next = [];
const dA = 1.0, dB = 0.5;
const feed = 0.055, k = 0.062;  // パラメータ（変えると形が変わる）

function setup() {
  createCanvas(200, 200);
  pixelDensity(1);
  for (let x = 0; x < width; x++) {
    grid[x] = [];
    next[x] = [];
    for (let y = 0; y < height; y++) {
      grid[x][y] = { a: 1, b: 0 };
      next[x][y] = { a: 1, b: 0 };
    }
  }
  // 中央に種を撒く
  for (let i = 90; i < 110; i++) {
    for (let j = 90; j < 110; j++) {
      grid[i][j].b = 1;
    }
  }
}

function draw() {
  for (let x = 1; x < width - 1; x++) {
    for (let y = 1; y < height - 1; y++) {
      let a = grid[x][y].a;
      let b = grid[x][y].b;
      // 隣接セルとの差分（離散ラプラシアン）
      let lapA = -a;
      let lapB = -b;
      let kernel = [[0.05, 0.2, 0.05], [0.2, 0, 0.2], [0.05, 0.2, 0.05]];
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          lapA += grid[x + i][y + j].a * kernel[i+1][j+1];
          lapB += grid[x + i][y + j].b * kernel[i+1][j+1];
        }
      }
      // 反応式
      next[x][y].a = a + (dA * lapA - a * b * b + feed * (1 - a));
      next[x][y].b = b + (dB * lapB + a * b * b - (k + feed) * b);
    }
  }
  // swap
  [grid, next] = [next, grid];
  
  // 描画
  loadPixels();
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let c = floor((grid[x][y].a - grid[x][y].b) * 255);
      let i = (x + y * width) * 4;
      pixels[i] = pixels[i+1] = pixels[i+2] = c;
      pixels[i+3] = 255;
    }
  }
  updatePixels();
}
```

これだけで「種から模様が成長していく」アニメーションになる。`feed`と`k`を変えると、全く違う種類のパターンになる。

## 1/06の「死」「分裂増殖」とも繋がる

[2026-01-06](/diary/2026-01-06)で「分裂増殖」に挑戦して「死」を入れた話をしてたよね。Reaction-Diffusionは「死」も「増殖」も化学物質の濃度として連続的に表現する。**離散的な「個体の生死」**ではなく、**連続的な「濃度の変動」**。同じ「成長と消滅」を別の数学で表現するパターン。

Differential Growthとも親戚で、両方とも「**ルールから形態が創発する**」系列に入る。

## 写経候補

- [Karl Sims tutorial](https://www.karlsims.com/rd.html) — 数学からコードまで完璧な解説
- [Coding Train: Reaction Diffusion](https://thecodingtrain.com/challenges/13-reaction-diffusion) — Shiffmanのp5.js実装
- [mrob.com xmorphia](https://mrob.com/pub/comp/xmorphia/) — 全パラメータの早見表とアニメーション
- [Shadertoy: Reaction Diffusion](https://www.shadertoy.com/results?query=reaction+diffusion) — GPU版（CPU版より100倍速い）
