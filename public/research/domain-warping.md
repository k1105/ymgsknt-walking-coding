# Domain Warping — noiseに食わせる座標を、noiseで歪ませる

[2026-04-07のスケッチ](/diary/2026-04-07)で、`noise(p.x * 0.005, p.y * 0.005)` から角度を取って粒子を流してたよね。あのスケッチではnoiseフィールドは「滑らかな地形」だった。

**じゃあ、noiseに渡す座標自体をnoiseで歪ませたら？**

これがdomain warping。Inigo Quilez（シェーダー界のレジェンド）が体系化した技法。

## 何が起きるか

普通のnoise:
```
f(p) = noise(p)
```
→ 滑らかな丘陵

domain warping:
```
f(p) = noise(p + noise(p))
```
→ 大理石、雲、有機的な渦巻き

二段重ねにするとさらに：
```
q = noise(p)
r = noise(p + q)
f(p) = noise(p + r)
```
→ 内部に複雑な構造を持つテクスチャ

[Inigo Quilez本人のインタラクティブデモ](https://iquilezles.org/articles/warp/) を見てほしい。記事の中盤に「one warp」「two warps」と進化していく図がある。同じnoiseが全然違う見え方になるのがわかる。

## 4/7のスケッチに足すなら

今のあのコードを最小限変えるとこう：

```js
let scale = 0.005;

// noiseの座標を、別のnoiseで歪ませる
let qx = noise(p.x * scale, p.y * scale);
let qy = noise(p.x * scale + 100, p.y * scale + 100);

let angle = noise(
  p.x * scale + qx * 4,  // ← 歪ませた座標
  p.y * scale + qy * 4
) * TWO_PI * 2;

p.x += cos(angle);
p.y += sin(angle);
```

`qx, qy` の係数（4）が歪ませる強さ。0だと普通のフローフィールド、大きくすると粒子の流れに「乱気流」が混じる。

## 道具の使い方の4つ目

4/7の日記で「noiseの値を読む / 傾きを読む / 傾きを90度回す」の話してたよね。domain warpingは4つ目：**「noiseの出力を別のnoiseの入力にする」**。

curl noiseが「微分」だとすれば、domain warpingは「合成」。同じnoise関数でも、何を入力にするかで全く違うものが出てくる。

## さらに見るなら

- [Inigo Quilez原典記事](https://iquilezles.org/articles/warp/) — 図がわかりやすい
- [Shadertoy: Warp 2](https://www.shadertoy.com/view/lsl3RH) — Inigo Quilez本人のシェーダー実装
