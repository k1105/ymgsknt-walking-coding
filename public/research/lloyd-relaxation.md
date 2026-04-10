# Lloyd's Relaxation — 「均一化したがる力」を入れる

[2026-04-09のスケッチ](/diary/2026-04-09)で、Voronoiセルがnoiseで動いてた。日記から：

> 途中から列をなして進む感じが面白いのと、画面外に点がアウトすると、ランダムに画面内に再配置されるから、ポンといきなり大きいセルが出てくるのが、泡の膜が割れて再度大きい膜として繋ぎあわさる時の振る舞いみたいで面白い。

「泡の膜が割れて繋ぎあわさる」観察、めちゃ良かった。Lloyd's Relaxationを足すと、その「泡」がもっと泡らしくなる。

## 何が起きるか

Lloyd's Relaxationは「Voronoiセルを均一サイズに近づける」アルゴリズム。手順はめちゃシンプル：

1. 各点のVoronoiセルを計算
2. **各セルの重心を計算**
3. 点を重心に向けて少し移動
4. 繰り返す

すると、ランダムに撒かれた点がだんだん「均等な格子」に近づいていく。完全に均等にはならず、自然な不規則さを保ったまま均一化する。これを **Centroidal Voronoi Tessellation (CVT)** と呼ぶ。

[Jason Daviesのインタラクティブデモ](https://www.jasondavies.com/lloyd/) を見ると一発でわかる。乱雑な点が、ぐるぐる動きながら綺麗な分布に収束していく。

## 4/9のスケッチに足すなら

今のループに数行足すだけ：

```js
for (let i = 0; i < num; i++) {
  // 既存のnoise移動
  let angle = noise(points[i][0] * 0.005, points[i][1] * 0.005) * TWO_PI * 2;
  points[i][0] += cos(angle);
  points[i][1] += sin(angle);

  // ★ Lloyd's relaxation: セルの重心に向かう力
  let cell = voronoi.cellPolygon(i);
  if (cell) {
    let cx = 0, cy = 0;
    for (let [x, y] of cell) { cx += x; cy += y; }
    cx /= cell.length;
    cy /= cell.length;
    points[i][0] = lerp(points[i][0], cx, 0.05);  // 重心へ向かう
    points[i][1] = lerp(points[i][1], cy, 0.05);
  }

  if (points[i][0] < 0 || points[i][0] > width || points[i][1] < 0 || points[i][1] > height) {
    points[i] = [random(width), random(height)];
  }
  // 描画...
}
```

`lerp` の係数（0.05）が「均一化したがる強さ」。これを上げると点が均一格子に近づき、下げるとnoiseの混沌が勝つ。

## 「秩序 vs 混沌」のバランス

これが面白いところ。今のスケッチには「混沌（noise）+ ランダムリセット」しかない。Lloyd's Relaxationは「秩序（重心化）」を入れる。

3つの力の拮抗：
- **noise**: 偏った方向に流す（混沌）
- **Lloyd's relaxation**: 均一に戻す（秩序）
- **画面外リセット**: 突発的なリセット（ノイズ）

3つの強さを変えると挙動が劇的に変わる。

- noise弱+lloyd強: ほぼ均等格子。泡感が強い
- noise強+lloyd弱: 4/9の今の感じ（流れ重視）
- noise強+lloyd強: 流れながらも分布が崩れない（一番面白いかも）

## 「泡の膜」観察との繋がり

4/9で「泡の膜が割れて繋ぎあわさる」って書いてた。Lloyd's relaxationを入れると、リセットされた点が「周りに押し出される」ような動きになる。これは泡が膜を張り直す物理現象と本当に似てる。実際、シャボン玉や石鹸の泡の構造はCentroidal Voronoiに非常に近い。

## 重み付きで画像を表現する

これをさらに発展させると[Weighted Voronoi Stippling](/research/voronoi-stippling.md)になる。重心計算に画像の暗さを重みとして入れると、点が暗いところに集まって、画像が点描で再現される。

## さらに見るなら

- [Jason Davies Lloyd's Relaxation](https://www.jasondavies.com/lloyd/) — リアルタイムインタラクティブ
- [Wikipedia: Lloyd's algorithm](https://en.wikipedia.org/wiki/Lloyd%27s_algorithm)
- [Bitbanging.space解説](https://www.bitbanging.space/posts/lloyds-algorithm) — 実装込み
