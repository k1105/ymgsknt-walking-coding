# 2D SDF — フラクタルシェーダーの「フラクタル」じゃない部分

[2026-04-02のスケッチ](/diary/2026-04-02)で、Cantor's Paradiseのフラクタル万華鏡シェーダーをCopycat経由で写経してたよね。日記でこう書いてた：

> 数学的に高度な話になってくると説明が薄かったり、前提がわからなくて結局脳死の写経ゲームになってしまうところはあった
> 
> 有名な戦略として言語化されているアルゴリズムだったり、そういうのがパーツ的に組み合わさっているとかなら、そういうパーツ単位での説明も欲しいかも。

シェーダーの世界で「パーツ単位で言語化されている戦略」の代表がSDF。フラクタルや万華鏡の前に、まずSDFがわかると、シェーダーの足場ができる。

## 何が起きるか

「点pから、この形までの距離」を返す関数。それだけ。

円のSDF：
```glsl
float sdCircle(vec2 p, float r) {
  return length(p) - r;
}
```
原点までの距離（`length(p)`）から半径を引く。内側だと負、外側だと正。

四角のSDF：
```glsl
float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
```

これだけのプリミティブを組み合わせて、ものすごく複雑な形が作れる。**しかも組み合わせは算術演算**：

```glsl
// 和集合（くっつける）
float u = min(d1, d2);

// 積集合（重なり）
float i = max(d1, d2);

// 差集合（削る）
float s = max(d1, -d2);

// なめらかな和集合（メタボール）
float sm = smin(d1, d2, 0.1);
```

`min` と `max` だけで、ブール演算が完結する。ポリゴンベースだと地獄の処理が、シェーダーだとたった1行。

[Inigo Quilezの2D SDF集](https://iquilezles.org/articles/distfunctions2d/) を見てほしい。50種以上のプリミティブが**全部数式とShadertoyデモ付きで**載ってる。円、矩形、三角形、五角形、星、三日月、ハート、卵、egg shape...眺めるだけでも楽しい。

## 4/2のスケッチへの繋がり

Cantor's Paradiseのコードに、おそらく `length(p) - r` や `abs(p) - b` みたいな表現があったはず。あれが全部SDF。フラクタルの「ベース要素」がSDFで、その上に**フラクタルループ**（同じ変換を繰り返す）と**ドメイン変換**（座標を歪める）が乗っている構造。

Copycatの説明が薄く感じられたのは、おそらくSDFという「層」の説明がなかったから。SDFを先に理解すると、フラクタルシェーダーは「SDF + 繰り返し + 変形」の組み合わせだとわかる。

## 最小実装

p5.jsのインラインシェーダーで動かす最小コード：

```glsl
// fragment shader
precision mediump float;
uniform vec2 u_resolution;

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
  vec2 p = (gl_FragCoord.xy - u_resolution * 0.5) / u_resolution.y;
  
  float d1 = sdCircle(p - vec2(-0.2, 0.0), 0.3);
  float d2 = sdBox(p - vec2(0.2, 0.0), vec2(0.2, 0.2));
  
  // smooth union
  float k = 0.1;
  float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
  float d = mix(d2, d1, h) - k * h * (1.0 - h);
  
  // 距離→色
  vec3 col = (d > 0.0) ? vec3(1.0) : vec3(0.0);
  gl_FragColor = vec4(col, 1.0);
}
```

円と四角がメタボールみたいに溶けあって表示される。kを変えると溶け方が変わる。これ自体が視覚的にめちゃ面白い。

## なぜ「シェーダーの足場」になるか

SDFがわかると：
- 距離を `step()` や `smoothstep()` で色にマッピング → 形を描ける
- 距離を法線として使う → ライティングができる
- 距離を空間変換と組み合わせる → 万華鏡やフラクタルが組める
- 距離を時間で動かす → アニメーションができる

つまりシェーダーの「他の概念」が全部SDFの上に乗っかる。Copycatで写経する前に、まずSDFでpentagon, star, heart を描いてみると、後の写経の見え方が変わるはず。

## さらに見るなら

- [Inigo Quilez 2D SDF集](https://iquilezles.org/articles/distfunctions2d/) — 50種以上のプリミティブ
- [Inigo Quilez 3D SDF集](https://iquilezles.org/articles/distfunctions/) — 3D版（raymarchingの土台）
- [Ronja's tutorials: 2D SDF Basics](https://www.ronja-tutorials.com/post/034-2d-sdf-basics/) — Unity向けだけど考え方は同じ
- [The Book of Shaders: Shapes](https://thebookofshaders.com/07/) — SDFを使ったshape描画の入門
