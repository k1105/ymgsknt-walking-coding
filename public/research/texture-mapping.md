# テクスチャマッピング — 「無理やり」マッピングするための準備

[2026-04-08のスケッチ](/diary/2026-04-08)の日記の最後に書いてたよね：

> VJに向けた準備ということで言えば、こういうロジックを踏襲しつつ背後に写真を使って変形させるとか、そういうことやって遊んでみたくもある。生成的に作られたシェイプに無理やりテクスチャマッピングをするとか。

これ、p5.jsのWEBGLモードでめちゃ簡単にできる。`vertex()` の引数を3つ（xyz）から5つ（xyz + uv）に増やすだけ。

## 何が起きるか

頂点ごとに「画像のどこから色を持ってくるか」をUV座標（0〜1）で指定する。すると三角形の面が自動的に画像でテクスチャされる。

頂点をnoiseで動かすと、画像も一緒にうねうね歪む。Photoshopの「ワープ」を毎フレームやってるイメージ。

[p5.js公式リファレンスのtexture()](https://p5js.org/reference/p5/texture/) のサンプルを見ると、回転する立方体の各面に画像が貼られているのがわかる。

## 最小コード

```js
let img;
function preload() {
  img = loadImage("photo.jpg");
}

function setup() {
  createCanvas(800, 800, WEBGL);
  textureMode(NORMAL);  // UV座標を0〜1で指定
}

function draw() {
  background(0);
  orbitControl();

  texture(img);
  noStroke();

  beginShape();
  vertex(-200, -200, 0, 0, 0);  // x, y, z, u, v
  vertex( 200, -200, 0, 1, 0);
  vertex( 200,  200, 0, 1, 1);
  vertex(-200,  200, 0, 0, 1);
  endShape(CLOSE);
}
```

これだけで400x400の四角形に画像が貼られる。

## 4/8のスケッチに足すなら

昨日の3Dフローフィールドを「グリッド配置→ノイズで歪ませた面」にして、テクスチャを貼る方向。スケッチを少し書き換える必要があるけど、概要はこう：

```js
let cols = 30, rows = 30;
let grid = [];
let img;

function preload() { img = loadImage("photo.jpg"); }

function setup() {
  createCanvas(800, 800, WEBGL);
  textureMode(NORMAL);
  for (let i = 0; i < cols; i++) {
    grid[i] = [];
    for (let j = 0; j < rows; j++) {
      grid[i][j] = createVector(
        map(i, 0, cols - 1, -300, 300),
        map(j, 0, rows - 1, -300, 300),
        0
      );
    }
  }
}

function draw() {
  background(0);
  orbitControl();
  texture(img);
  noStroke();

  // 各点をnoiseでz方向に押し出す
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      let n = noise(i * 0.1, j * 0.1, frameCount * 0.01);
      grid[i][j].z = (n - 0.5) * 200;
    }
  }

  // 隣接する4点で四角形を作りテクスチャを貼る
  for (let i = 0; i < cols - 1; i++) {
    for (let j = 0; j < rows - 1; j++) {
      let u1 = i / (cols - 1);
      let v1 = j / (rows - 1);
      let u2 = (i + 1) / (cols - 1);
      let v2 = (j + 1) / (rows - 1);
      beginShape();
      vertex(grid[i][j].x, grid[i][j].y, grid[i][j].z, u1, v1);
      vertex(grid[i+1][j].x, grid[i+1][j].y, grid[i+1][j].z, u2, v1);
      vertex(grid[i+1][j+1].x, grid[i+1][j+1].y, grid[i+1][j+1].z, u2, v2);
      vertex(grid[i][j+1].x, grid[i][j+1].y, grid[i][j+1].z, u1, v2);
      endShape(CLOSE);
    }
  }
}
```

「グリッドに並べたら面白くないかも」って4/8で言ってたけど、テクスチャを貼った瞬間に話が変わる。粒子の点群より、画像の歪みとして見えた方がVJ向き。

## ランダム点群でやりたい場合

Delaunayで隣接関係を作って、各三角形のUVを「点の位置」から計算する。`u = (p.x + width/2) / width`みたいに。これだと画像が「その場所の色」で塗られる。

## さらに見るなら

- [p5.js texture()](https://p5js.org/reference/p5/texture/) — 公式リファレンス + サンプル
- [Custom 3D Geometry in p5.js](https://www.paulwheeler.us/articles/custom-3d-geometry-in-p5js/) — Paul Wheelerによるプロシージャル3Dの解説
- [Coding Train: p5.js 3D Mesh](https://thecodingtrain.com/tracks/the-nature-of-code-2/noc/9-genetic-algorithms) — Shiffmanの動画群（WEBGL周り）
