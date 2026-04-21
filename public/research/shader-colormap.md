# Shader Colormap — サーモフィルターをGPUで

[2026-04-20のスケッチ](/diary/2026-04-20)で、CPU版のサーモフィルターを作ったよね：

> shaderベースで似たロジックを組んだらもっと軽量に実行できると思う。また今度やってみる。

まさにその通り。今のコードは全ピクセルをJSのforループで回してるから重い。同じことをフラグメントシェーダーでやると、GPUが全ピクセルを並列に処理する。4/13のbloomと同じ `createGraphics → shader` パイプラインで、fragの中身を変えるだけ。

## フラグメントシェーダー版

```glsl
precision mediump float;
varying vec2 vTexCoord;
uniform sampler2D tex;
uniform float u_time;

// サーモカラーマップ
vec3 thermalMap(float t, float threshold) {
  if (t < threshold) {
    return vec3(0.0, 0.0, t / threshold);
  } else if (t < 0.5) {
    return vec3(0.0, (t - threshold) / (0.5 - threshold), 0.0);
  } else if (t < 1.0 - threshold) {
    return vec3((t - 0.5) / (0.5 - threshold), 0.0, 0.0);
  } else {
    return vec3(1.0, (t - (1.0 - threshold)) / threshold, 0.0);
  }
}

void main() {
  vec2 uv = vTexCoord;
  uv.y = 1.0 - uv.y;
  vec4 col = texture2D(tex, uv);
  
  float bright = (col.r + col.g + col.b) / 3.0;
  
  // noiseの代わりにsin波で閾値を動かす（GLSLにはnoise関数がない環境がある）
  float threshold = 0.5 * max(sin(u_time * 0.1) * 0.5 + 0.5, 0.1);
  
  vec3 thermal = thermalMap(bright, threshold);
  gl_FragColor = vec4(thermal, 1.0);
}
```

sketch.jsから `u_time` をuniformで渡す：
```js
bloomShader.setUniform("u_time", millis() / 1000.0);
```

## CPUとの違い

- **速度**: 数百倍速い。4K画像でもリアルタイム
- **表現の自由度**: UV座標を使って「位置に応じたカラーマップ」ができる。例えば中心からの距離で色が変わるとか
- **p5.jsのnoise()が使えない**: GLSLにはPerlin noiseがない。sin波で代用するか、GLSL用のnoise関数を自前で書く

## カラーマップのバリエーション

サーモだけじゃなくて、色の割り当て方で全然違う表現になる：

- **Viridis** (科学可視化の定番): 紫→青→緑→黄
- **Magma**: 黒→赤→オレンジ→黄→白
- **Turbo** (Googleが作ったやつ): 虹色だけどPerceptually uniform
- **二値化 (threshold)**: 閾値で白黒に分ける。sin波で閾値を動かすとパターンが波打つ

[Inigo Quilez: Palette functions](https://iquilezles.org/articles/palettes/) に、数式1つでカラーマップを作る方法がある：

```glsl
vec3 palette(float t) {
  vec3 a = vec3(0.5);
  vec3 b = vec3(0.5);
  vec3 c = vec3(1.0);
  vec3 d = vec3(0.0, 0.33, 0.67);
  return a + b * cos(6.28 * (c * t + d));
}
```

4つのパラメータ（a, b, c, d）を変えるだけで無限のカラーマップが作れる。

## さらに見るなら

- [Inigo Quilez: Palettes](https://iquilezles.org/articles/palettes/) — 数式ベースのカラーマップ
- [Shadertoy: Thermal Camera](https://www.shadertoy.com/results?query=thermal+camera) — サーモカメラ系シェーダー
- [The Book of Shaders: Color](https://thebookofshaders.com/06/) — シェーダーでの色操作
