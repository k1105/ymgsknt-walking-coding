# Curl Noise — 「明日やってみようかな」のやつ

[2026-04-07のスケッチ](/diary/2026-04-07)の最後にこう書いてたよね：

> curl noiseは明日やってみようかな。

実際は4/8に3D化の方に進んで保留になったので、ここで補足。curl noiseが何をしてくれるかと、4/7のコードからどう書き換えるか。

## 何が起きるか

普通のnoiseで角度を取ると、粒子は「nooseの値が低いところ」に溜まりがち。空が一様に青いのと同じで、密度が偏る。

curl noiseは粒子が「決して溜まらない」。発散ゼロ（divergence-free）の性質があるから、粒子の密度が保たれたまま渦を巻く。流体シミュレーション、煙、オーロラ、髪の毛みたいな見え方になる。

[al-roのインタラクティブデモ](https://al-ro.github.io/projects/curl/) を見てほしい。普通のnoiseと比較する切り替えがあって、違いが一目でわかる。

## 数学

curl noiseは「noiseの傾きを90度回したもの」。4/7の日記で「傾きを読む」「傾きを90度回す」って言ってたけど、curl noiseはまさに後者。

2Dなら：
```
curl(p).x =  ∂noise/∂y
curl(p).y = -∂noise/∂x
```

偏微分は数値的に計算する：
```js
function curlNoise(x, y) {
  let eps = 0.0001;
  let n1 = noise(x, y + eps);
  let n2 = noise(x, y - eps);
  let n3 = noise(x + eps, y);
  let n4 = noise(x - eps, y);
  let dx = (n1 - n2) / (2 * eps);
  let dy = (n3 - n4) / (2 * eps);
  return [dy, -dx];  // 90度回転
}
```

## 4/7のスケッチに足すなら

今のループの中の角度計算をこう書き換える：

```js
for (let p of particles) {
  let scale = 0.005;
  let [vx, vy] = curlNoise(p.x * scale, p.y * scale);
  p.x += vx * 30;  // 速度の調整
  p.y += vy * 30;

  if (p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
    p.set(random(width), random(height));
  }
  ellipse(p.x, p.y, 3);
}
```

ポイントは、`curlNoise()` がスカラーじゃなくて速度ベクトル `[vx, vy]` を返すこと。`cos/sin` で角度から方向を作る必要がない。直接ベクトルが手に入る。

実行してみると、4/7のスケッチで見えていた「川が一方向に流れる」感じから、「渦を巻きながら流れる」感じに変わる。粒子が画面外に出にくくなって、画面全体に均等に分布する。

## 写経候補

- [al-roインタラクティブデモ](https://al-ro.github.io/projects/curl/) — 比較できる、コード公開あり
- [Varun Vachhar "Noise in Creative Coding"](https://varun.ca/noise/) — noise→flow field→curlの流れを丁寧に解説
- [Shadertoy: Visualizing Curl Noise](https://www.shadertoy.com/view/mlsSWH) — GLSL版
- [cabbibo/glsl-curl-noise](https://github.com/cabbibo/glsl-curl-noise) — シェーダー実装の決定版
