# Worley Noise — 「肌理（きめ）」を作るためのnoise

[2026-02-15のスケッチ](/diary/2026-02-15)で、デッサンの「肌理」の話を書いてた：

> 陰影の考え方然り、質感・量感の描きわけを、鉛筆の濃淡、練り消し、ティッシュなんかで行う。濃淡の中に、そういう肌理の違いがあるんだなーとか
>
> いつも以上に肌理を観察したせいか、p5で何かやるにしてももっと肌理を見て、表情の違いを作ってみようと思った。

Perlin noiseは「滑らかな丘陵」を作るけど、肌理（テクスチャ感）はあまり出ない。一方、**Worley noise**は「細胞」「皮膚」「水面」「ひび割れ」みたいな肌理を作るために生まれたnoiseで、まさに「質感のため」のアルゴリズム。

## 何が起きるか

Worley noise（別名Cellular noise、Voronoi noise）は、各ピクセルから「**最寄りのfeature point**までの距離」を返す。Feature pointはランダムに撒かれた点。

- 距離が小さい（feature pointの近く） → 暗い
- 距離が大きい（点から遠い） → 明るい

これだけで「細胞のような模様」「ひびの入った石」「皮膚」みたいな見た目になる。

[Inigo QuilezのVoronoi記事](https://iquilezles.org/articles/voronoise/) にめちゃ綺麗な例が並んでる。基本のWorleyから、複数オクターブを重ねた応用まで。

[The Book of Shaders: Cellular noise](https://thebookofshaders.com/12/) のインタラクティブデモがわかりやすい。マウスを動かすとリアルタイムにfeature pointが動く。

## 4/9のVoronoiとの関係

実は、4/9のVoronoiセル分割と本質は同じ。両方とも「点群と最寄りの距離」を使う。違いは：

- **Voronoi分割**: 点群を「セル（多角形）」として可視化。境界が見える
- **Worley noise**: 点からの距離を「明るさ」として可視化。グラデーションが見える

`F1` を使うと細胞っぽく、`F2 - F1`（2番目に近い点との距離 - 1番目との距離）を使うと**Voronoiの境界線そのもの**が描ける。境界付近で `F2 - F1` が小さくなるから。

## 最小実装

p5.jsだとシェーダーなしでもこう書ける：

```js
let points = [];
function setup() {
  createCanvas(400, 400);
  pixelDensity(1);
  for (let i = 0; i < 30; i++) {
    points.push([random(width), random(height)]);
  }
  noLoop();
}

function draw() {
  loadPixels();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minDist = Infinity;
      for (let p of points) {
        let d = dist(x, y, p[0], p[1]);
        if (d < minDist) minDist = d;
      }
      let bright = constrain(minDist * 3, 0, 255);
      let i = (y * width + x) * 4;
      pixels[i] = pixels[i+1] = pixels[i+2] = bright;
      pixels[i+3] = 255;
    }
  }
  updatePixels();
}
```

これだけで「水滴の集合」みたいなテクスチャが出る。

## 「肌理」を作る組み合わせ

デッサンで「鉛筆+練り消し+ティッシュ」で質感を作るのと同じ感覚で、Worleyを組み合わせる：

- **F1（最寄り距離）** → 細胞、水滴
- **F2 - F1** → ひび割れ、Voronoi境界
- **複数オクターブ** → スケールの違う細胞が重なった石みたいな模様
- **Perlin noiseと混ぜる** → 有機的な岩肌
- **時間で動かす** → 水面の波紋

2/15で書いてた「上昇のスピードを位置によって変えることで、塗りの白がもう少し見え隠れするように」というアイデアも、Worley noiseで「位置」を「最寄り距離」に置き換えると違う表現になる。

## さらに見るなら

- [The Book of Shaders: Cellular Noise](https://thebookofshaders.com/12/) — インタラクティブ解説
- [Inigo Quilez: Voronoi](https://iquilezles.org/articles/voronoi/) — F1, F2-F1の使い分け
- [Inigo Quilez: Voronoise](https://iquilezles.org/articles/voronoise/) — Worley/PerlinをブレンドするNoise
- [Worley原論文 (1996)](https://www.rhythmiccanvas.com/research/papers/worley.pdf) — Steven Worleyの元論文（短い）
