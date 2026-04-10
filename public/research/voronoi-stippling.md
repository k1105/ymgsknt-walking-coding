# Weighted Voronoi Stippling — 「面積で塗りを変える」の延長

[2026-04-09のスケッチ](/diary/2026-04-09)で、Voronoiセルとnoiseフローフィールドを組み合わせて遊んでた。日記にこう書いてたよね：

> ボロノイの中で何を動かしたら面白いのか、もっと色々ためしてみたいのと、それぞれの面積ごとに塗りをかえるとかができないかやってみたい。

「面積ごとに塗りを変える」の話。これを画像と組み合わせると、Voronoi Stipplingという有名な技法になる。

## 何が起きるか

画像を点描（スティップリング）で再現する。**点が密なところ=暗い、疎なところ=明るい**。

ナイーブな点描は乱数で点を撒くだけだけど、これだとムラが出る。Voronoi Stipplingは「Lloyd's Relaxation」を画像の明るさで重み付けする：

1. ランダムに点を撒く
2. 各点のVoronoiセルを計算
3. 各セルの**重み付き重心**（暗い部分ほど引き寄せられる）に点を移動
4. 繰り返す

すると点が「画像の暗いところ」に集まってきて、自然な点描が出来上がる。

[Coding Train Challenge #181のデモ](https://thecodingtrain.com/challenges/181-image-stippling/) を見てほしい。p5.js + d3-delaunayで実装されてる。Lincoln写真がリアルタイムに点描化していく様子が見られる。

## 4/9の話への接続

「セルの面積ごとに塗りを変える」のシンプル版は **shoelace formula**（前にDiscordに投稿したやつ）：

```js
function polygonArea(cell) {
  let area = 0;
  for (let i = 0; i < cell.length - 1; i++) {
    area += cell[i][0] * cell[i+1][1];
    area -= cell[i+1][0] * cell[i][1];
  }
  return Math.abs(area) / 2;
}

// draw内
let area = polygonArea(cell);
let brightness = map(area, 0, 5000, 50, 255);
fill(brightness);
```

これでセルの大きさに応じて明暗が出る。**面積が大きい=点が疎=明るい**、**小さい=密=暗い**。これは画像なしでもVoronoi構造そのものが可視化される。

## さらに踏み込むと

画像を使う場合：

```js
let img;
function preload() { img = loadImage("portrait.jpg"); }

function setup() {
  createCanvas(img.width, img.height);
  img.loadPixels();
  // 初期点配置はランダムでOK
  for (let i = 0; i < 1000; i++) {
    points.push([random(width), random(height)]);
  }
}

function draw() {
  background(255);
  let delaunay = d3.Delaunay.from(points);
  let voronoi = delaunay.voronoi([0, 0, width, height]);

  // 重み付き重心を計算（画像の暗さで重み付け）
  for (let i = 0; i < points.length; i++) {
    let cell = voronoi.cellPolygon(i);
    if (!cell) continue;
    let totalWeight = 0;
    let cx = 0, cy = 0;
    // セル内の各ピクセルを走査
    let bbox = getBBox(cell);
    for (let x = bbox.x; x < bbox.x + bbox.w; x++) {
      for (let y = bbox.y; y < bbox.y + bbox.h; y++) {
        if (!pointInPolygon(x, y, cell)) continue;
        let pix = (y * img.width + x) * 4;
        let bright = (img.pixels[pix] + img.pixels[pix+1] + img.pixels[pix+2]) / 3;
        let w = 1 - bright / 255;  // 暗いほど重み大
        cx += x * w;
        cy += y * w;
        totalWeight += w;
      }
    }
    if (totalWeight > 0) {
      points[i][0] = lerp(points[i][0], cx / totalWeight, 0.1);
      points[i][1] = lerp(points[i][1], cy / totalWeight, 0.1);
    }
  }

  // 点描画
  fill(0);
  noStroke();
  for (let p of points) circle(p[0], p[1], 2);
}
```

実際のCoding Trainのコードはもっと最適化されてるけど、原理はこれ。**画像の暗いところに点が移動する力**を毎フレーム加える、というだけ。

## 4/9の派生として何ができるか

4/9のスケッチでは「noiseで点を動かす」をやってた。これに「Lloyd's Relaxation（重心に向かう力）」を足すと、**秩序（重心化） vs 混沌（noise）** の拮抗が生まれる。Voronoiパターンが「均等になりたがるけど揺れ続ける」みたいな動きになる。

さらに重心の重みを画像の明るさにすると、**「特定の絵に向かって収束しようとするけど揺れ続ける」**動きになる。VJ素材として強そう。

## さらに見るなら

- [Coding Train #181: Weighted Voronoi Stippling](https://thecodingtrain.com/challenges/181-image-stippling/) — 動画+完全なp5.jsコード
- [Lloyd's Relaxation可視化](https://www.jasondavies.com/lloyd/) — ただの均一化バージョン
- [Bitbanging: Lloyd's Algorithm](https://www.bitbanging.space/posts/lloyds-algorithm) — 解説とコード
- [Observable: Weighted Voronoi Stippling](https://observablehq.com/@real-john-cheung/weighted-voronoi-stippling) — d3-delaunay版
