# ストレンジアトラクター — noiseの代わりに3行の方程式

[2026-04-08のスケッチ](/diary/2026-04-08)で3D空間に粒子を浮かべて、各軸の変位をnoiseで決めてた。

`p.x += dx; p.y += dy; p.z += dz;` の構造はそのままで、変位の決め方を **noise → 微分方程式** に置き換えると、ストレンジアトラクターになる。

## 何が起きるか

3行の連立方程式から、二度と同じ道を通らないのに「特定の形に吸い寄せられる」3D軌跡が出てくる。蝶、リング、双子の渦、四翼の鳥みたいな形。

代表的なのがLorenzアトラクター（1963年、Edward Lorenzが大気の対流をモデル化したやつ）：
```
dx = σ(y - x)
dy = x(ρ - z) - y
dz = xy - βz
```

3つの数値（σ, ρ, β）を変えるだけで、形がガラッと変わる。

[dynamicmath.xyzに12種類のアトラクターのp5.js実装](https://www.dynamicmath.xyz/strange-attractors/) があるので、まず眺めてほしい。Lorenz、Aizawa、Thomas、Halvorsen…全部「3行の方程式」から出てくる。

## 4/8のスケッチに足すなら

ループの中の `dx, dy, dz` の計算をこう書き換える：

```js
for (let p of particles) {
  // Lorenz attractor
  const sigma = 10;
  const rho = 28;
  const beta = 8 / 3;
  const dt = 0.005;

  let dx = sigma * (p.y - p.x) * dt;
  let dy = (p.x * (rho - p.z) - p.y) * dt;
  let dz = (p.x * p.y - beta * p.z) * dt;

  p.x += dx;
  p.y += dy;
  p.z += dz;

  point(p.x * 10, p.y * 10, p.z * 10);  // 描画スケール調整
}
```

ポイントは、初期位置を `random(-1, 1)` くらいの小さな範囲にすること。Lorenzは原点近辺の小さな領域から始めると、自分で広がっていく。

4/8のスケッチでは粒子を境界でワープさせていたけど、アトラクターでは「外には出ない」のでその処理は不要。これが「引き込み領域」という名前の由来。

## なぜ「流れ」が見えるか

4/7の日記で「近くにある座標のものは角度が似てくるから、パーティクルが接近すると合流して一緒に流れる」って書いてた。アトラクターも同じ原理。**位置が近い粒子は、次の変位も近い**から、自然に流れの帯ができる。

ただし、Lorenzは「初期値鋭敏性」を持つので、最初はほぼ同じ場所にいた2粒子も、長い時間が経つと完全に違う軌道を描く。これがカオスの定義。バタフライエフェクトの語源（Lorenzの講演タイトルが"Does the flap of a butterfly's wings in Brazil set off a tornado in Texas?"）。

## なぜnoiseと違うか

- noise: 関数 `noise(x, y, z)` から値を読む。空間に分布するスカラー場
- アトラクター: 方程式 `f(p) → dp` から速度を計算する。空間に分布する速度場（ベクトル場）

curl noiseもベクトル場だけど、アトラクターは「ベクトル場の中に決まった形（ストレンジアトラクター）が埋め込まれている」点が違う。粒子はその形をなぞる。

## さらに見るなら

- [dynamicmath.xyz - Strange Attractors](https://www.dynamicmath.xyz/strange-attractors/) — p5.js実装の宝庫、12種類比較できる
- [Wikipedia: Lorenz system](https://en.wikipedia.org/wiki/Lorenz_system) — 数学的背景
- [Coding Train: Lorenz Attractor](https://thecodingtrain.com/challenges/30-phyllotaxis) — Shiffmanの動画（30番台にLorenzあり）
