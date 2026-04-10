# Curl Noise — noise()の次のステップ

**日付**: 2026-04-07

## Perlin noiseとの違い

- Perlin: スカラー値。パーティクルは山を登り谷を下る。溜まりやすい
- Curl: ベクトル値。発散ゼロ。パーティクルが溜まらず渦を巻く。流体的

## なぜ「いいルック」か

- 同じパーティクル群でも煙、流水、オーロラのような動きに
- background残像スケッチに適用するだけで質感が変わる

## GLSL実装

simplex noiseの偏微分を交差させる：
```glsl
vec2 curl(vec2 p) {
  float eps = 0.001;
  float n1 = snoise(vec2(p.x, p.y + eps));
  float n2 = snoise(vec2(p.x, p.y - eps));
  float n3 = snoise(vec2(p.x + eps, p.y));
  float n4 = snoise(vec2(p.x - eps, p.y));
  return vec2((n1-n2)/(2.*eps), -(n3-n4)/(2.*eps));
}
```

## 写経候補

- Shadertoy "Visualizing Curl Noise": https://www.shadertoy.com/view/mlsSWH
- cabbibo/glsl-curl-noise: https://github.com/cabbibo/glsl-curl-noise
- al-roインタラクティブデモ: https://al-ro.github.io/projects/curl/
- Varun Vachhar "Noise in Creative Coding": https://varun.ca/noise/
