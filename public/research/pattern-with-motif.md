# 具象+パターン配置 — 資生堂ギャラリーからの発見

[2026-05-10のスケッチ](/diary/2026-05-10)の後半で、資生堂ギャラリーの話を書いてた：

> カニ、鶴、花、日本的なモチーフはさまざまに描かれながらも、それらのレイアウトはパターンとしての配置を面白がっているようなものを見出して。
> モチーフは具象的に、並べ方は規則性を持たせて、高い意匠性を保ちながらも風景が見出せるような柄を描いていたのが面白かった

「風景と規則的な反復は交わるものではないと思っていた」のに、実際には交わっていた。これはクリエイティブコーディングでも試せる。

## 何ができるか

### 1. タイリング + 画像

グリッドやVoronoiのセルに画像をはめる。配置は規則的、中身は具象的：

```js
let img;
function preload() { img = loadImage("photo.jpg"); }

function setup() {
  createCanvas(800, 800);
  let cols = 5, rows = 5;
  let w = width / cols, h = height / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      // 画像の一部を切り取って配置
      let sx = random(img.width - w);
      let sy = random(img.height - h);
      image(img, i*w, j*h, w, h, sx, sy, w, h);
    }
  }
}
```

### 2. パターン的な反復 + 有機的な変形

円充填やVoronoiで「ほぼ規則的だけどちょっとずれてる」配置を作り、各セルに異なる具象モチーフを入れる。

### 3. テキスタイルデザイン的アプローチ

日本の伝統文様（麻の葉、青海波、市松）はまさに「規則+モチーフ」。これをp5.jsで再実装して、モチーフを写真や3Dに置き換える。

## さらに見るなら

- [Pattern in Islamic Art](https://patterninislamicart.com/) — 幾何学パターンの宝庫
- [William Morris patterns](https://www.vam.ac.uk/articles/william-morris-designer) — 有機的モチーフ+規則的配置の巨匠
- [Truchet Tiles](https://en.wikipedia.org/wiki/Truchet_tiles) — 最もシンプルなパターン配置アルゴリズム
