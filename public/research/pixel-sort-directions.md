# ピクセルソートの方向制御 — 「ベクトルを歪ませる」

[2026-04-16のスケッチ](/diary/2026-04-16)で、行単位のピクセルソートをやって、こう書いてた：

> ソートのベクトルを色々歪ませたりできるともっと面白くなるのだろうか。

今は全行が水平方向にソートされてるけど、**ソートの「経路」を変える**ことで全然違う絵が出る。

## 何ができるか

### 1. 縦方向ソート
行（横）じゃなくて列（縦）でソートする。横に流れるんじゃなくて、縦に溶ける感じ。参考画像で見た「空が溶けて流れる」効果はこっちが近い。

### 2. 斜めソート
`(x, y)` から `(x + dy, y + dx)` みたいに対角線に沿ってピクセルを拾う。

```js
// 45度斜めにソート
for (let d = 0; d < width + height; d++) {
  let diagonal = [];
  for (let x = 0; x < width; x++) {
    let y = d - x;
    if (y < 0 || y >= height) continue;
    let i = (y * width + x) * 4;
    diagonal.push({ x, y, rgb: [pixels[i], pixels[i+1], pixels[i+2]] });
  }
  diagonal.sort((a, b) => (a.rgb[0]+a.rgb[1]+a.rgb[2]) - (b.rgb[0]+b.rgb[1]+b.rgb[2]));
  // 書き戻し...
}
```

### 3. 放射状ソート
画面中心（or マウス位置）からの放射線に沿ってソートする。中心から外に向かって明るさが並ぶ。太陽みたいな見た目になる。

### 4. 曲線ソート
ベジェ曲線やsin波に沿ったパスでピクセルを拾ってソートする。1月のベジェ曲線シリーズと接続する方向。

### 5. ノイズベースの方向
各行のソート方向を `noise(y)` で少しずつ傾ける。全行が微妙に違う角度でソートされて、流れが「うねる」。

```js
for (let y = 0; y < height; y++) {
  let angle = noise(y * 0.01) * PI - PI/2;  // -90° ~ +90°
  // angleの方向に沿ってピクセルを拾ってソート
}
```

## 今のスケッチに足すなら

まず縦方向ソートが一番簡単。今の `sortRow` の x と y を入れ替えるだけ。それだけで見た目が劇的に変わる。参考画像の「空が溶ける」効果は縦方向ソート + 閾値の組み合わせ。

## さらに見るなら

- [Kim Asendorf: ASDFPixelSort](https://github.com/kimasendorf/ASDFPixelSort) — Processing実装の原典。閾値付きソート
- [Jeff Thompson: Pixel Sorting](https://www.jeffreythompson.org/blog/2015/01/25/pixel-sorting/) — 方向制御の解説
- [Generative Hut: Pixel Sorting Variations](https://www.youtube.com/results?search_query=pixel+sorting+creative+coding) — YouTube動画群
