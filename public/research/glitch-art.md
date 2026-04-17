# Glitch Art / Databending — ピクセルソートの先にある「壊す美学」

[2026-04-16のスケッチ](/diary/2026-04-16)でピクセルソートをやって、こう書いてた：

> かつて、hidekickさんのポートフォリオインデックスデザインにて、「ビジュアルの密度を平均化」する手法としてポートフォリオのサムネイル画像を変形させているのがあったけど、ピクセルソーティングでもそういうことができそうだよね。

ピクセルソートは「Glitch Art」というジャンルの一技法。他にも「画像を壊す」方法がたくさんある。

## Glitch Artとは

意図的にデータを「壊す」ことで生まれる視覚表現。Kim Asendorfのピクセルソートがバズって一般化したけど、元はもっと広い文脈がある。

## 技法の種類

### 1. Databending（データ曲げ）
画像ファイル（.bmp, .tiff）をテキストエディタで開いて、ヘッダー以外の部分をコピペ/置換/削除する。**コードを1行も書かずに**グリッチが作れる。

BMPファイルは圧縮されてないから、バイナリを直接いじると即座にピクセルが壊れる。JPEGだとDCT係数が壊れて、ブロックノイズとマクロブロックの崩壊が起きる。

### 2. Channel Shifting（チャンネルずらし）
RGBの各チャンネルを別々にオフセットする。p5.jsで簡単：

```js
img.loadPixels();
let shifted = createImage(img.width, img.height);
shifted.loadPixels();

for (let i = 0; i < img.pixels.length; i += 4) {
  let offset = 200 * 4;  // 200ピクセル分ずらす
  shifted.pixels[i]     = img.pixels[(i + offset) % img.pixels.length];     // R
  shifted.pixels[i + 1] = img.pixels[i + 1];  // G はそのまま
  shifted.pixels[i + 2] = img.pixels[(i - offset + img.pixels.length) % img.pixels.length + 2];  // B
  shifted.pixels[i + 3] = 255;
}
shifted.updatePixels();
```

### 3. Pixel Displacement（ピクセル変位）
ピクセルの位置を、そのピクセル自身の色に基づいてずらす。「明るいピクセルは右に、暗いピクセルは左に」みたいに。

```js
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    let i = (y * width + x) * 4;
    let bright = (pixels[i] + pixels[i+1] + pixels[i+2]) / 3;
    let displacement = map(bright, 0, 255, -20, 20);
    let srcX = constrain(x + floor(displacement), 0, width - 1);
    // srcXから色を持ってくる
  }
}
```

### 4. Scan Line Corruption
特定の行だけ水平にオフセットする。VHSテープの再生エラーに似た効果。

```js
for (let y = 0; y < height; y++) {
  let offset = (random() > 0.95) ? floor(random(-50, 50)) : 0;
  for (let x = 0; x < width; x++) {
    let srcX = (x + offset + width) % width;
    // srcXから色をコピー
  }
}
```

## hidekickの「密度平均化」との接続

ピクセルソートが「明るさで並べ替える」なら、その結果として各行の明るさ分布は均一化される。これは画像の「情報の分布」を物理的に再配置する操作。hidekickのアプローチと本質は同じ：**「不均一なものを均一にする変換」が、元の画像にはなかった秩序を生み出す**。

## さらに見るなら

- [Glitch Art Wikipedia](https://en.wikipedia.org/wiki/Glitch_art) — 歴史と文脈
- [Rosa Menkman: The Glitch Moment(um)](https://beyondresolution.info/) — グリッチアートの理論的背景
- [Databending tutorial with Audacity](https://www.hellocatfood.com/databending-using-audacity/) — 音声エディタで画像を壊す定番技法
- [p5.js glitch examples](https://editor.p5js.org/search?q=glitch) — p5.js Web Editorで検索
